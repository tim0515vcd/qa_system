from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.search_query import SearchQuery
from app.services.embedding_service import gemini_query_embedding
from app.services.query_rewrite_service import build_rewritten_query


def search_chunks(query: str, db: Session, limit: int = 5):
    """
    PostgreSQL Full-Text Search 正式版。

    與第一版不同的地方：
    1. 不再直接拿原始 query 查
    2. 先走 query rewrite pipeline
    3. FTS 使用 final_query，提高 recall
    4. 使用 websearch_to_tsquery('simple', ...)
       - 比 plainto_tsquery 更貼近使用者輸入習慣
       - 'simple' 對中英混合內容通常比 'english' 更穩
    """
    rewrite = build_rewritten_query(query, db)
    final_query = rewrite["final_query"]

    sql = text(
        """
        SELECT
            dc.id AS chunk_id,
            dc.document_id AS document_id,
            dc.chunk_index AS chunk_index,
            d.title AS document_title,
            dc.content AS content,
            dc.token_count AS token_count,
            dc.created_at AS created_at,
            dc.metadata AS metadata,
            ts_rank_cd(dc.content_tsv, websearch_to_tsquery('simple', :query)) AS rank
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE dc.content_tsv @@ websearch_to_tsquery('simple', :query)
        ORDER BY rank DESC, dc.created_at DESC
        LIMIT :limit
        """
    )

    rows = (
        db.execute(
            sql,
            {
                "query": final_query,
                "limit": limit,
            },
        )
        .mappings()
        .all()
    )

    return rows


def save_search_query(
    query: str,
    result_count: int,
    db: Session,
    retrieval_mode: str = "fts",
    metadata: dict | None = None,
) -> SearchQuery:
    """
    紀錄一次搜尋行為。
    這裡不直接 commit，交給 router 統一控制 transaction。
    """
    record = SearchQuery(
        query=query,
        result_count=result_count,
        retrieval_mode=retrieval_mode,
        metadata_=metadata or {},
    )
    db.add(record)

    # flush: 送出 SQL，但不提交 transaction
    db.flush()

    # refresh: 把 DB 當前值回填 ORM 物件
    db.refresh(record)
    return record


def vector_search_chunks(query: str, db: Session, limit: int = 5):
    """
    vector search 正式版。

    重點：
    - vector query 不直接吃 final_query
    - 優先吃 normalized_query

    原因：
    FTS 偏向 keyword matching，可以吃擴展詞；
    但 embedding 偏向語意空間，亂加太多擴展詞反而可能把語意拉偏。
    """
    rewrite = build_rewritten_query(query, db)
    vector_query = rewrite["normalized_query"]

    query_embedding = gemini_query_embedding(vector_query)

    sql = text(
        """
        SELECT
            dc.id AS chunk_id,
            dc.document_id AS document_id,
            dc.chunk_index AS chunk_index,
            d.title AS document_title,
            dc.content AS content,
            dc.token_count AS token_count,
            dc.created_at AS created_at,
            dc.metadata AS metadata,
            dc.embedding <=> CAST(:query_embedding AS vector) AS distance
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> CAST(:query_embedding AS vector) ASC
        LIMIT :limit
        """
    )

    rows = (
        db.execute(
            sql,
            {
                "query_embedding": str(query_embedding),
                "limit": limit,
            },
        )
        .mappings()
        .all()
    )

    return rows


def _min_max_normalize(values: list[float], reverse: bool = False) -> list[float]:
    """
    將一組數值做 min-max normalization，映射到 0~1。

    reverse=True 時，表示「越小越好」的分數要反轉。
    例如 vector distance：
    - distance 越小越好
    - 轉成 score 時應該越大越好
    """
    if not values:
        return []

    lo = min(values)
    hi = max(values)

    # 全部相等時，直接給 1.0，避免除以 0
    if hi == lo:
        return [1.0 for _ in values]

    if reverse:
        return [(hi - value) / (hi - lo) for value in values]

    return [(value - lo) / (hi - lo) for value in values]


def hybrid_search_chunks(query: str, db: Session, limit: int = 5):
    """
    hybrid search 正式版。

    流程：
    1. FTS 取 candidate pool
    2. vector 取 candidate pool
    3. 依 chunk_id 合併
    4. 將 FTS / vector 分數各自 normalize
    5. 算 hybrid_score 後排序

    這版先不接 reranker，
    但整體資料結構已經預留後面升級空間。
    """
    candidate_limit = max(limit * 4, 20)

    rewrite = build_rewritten_query(query, db)
    normalized_query = rewrite["normalized_query"]

    fts_rows = search_chunks(query, db, candidate_limit)
    vector_rows = vector_search_chunks(query, db, candidate_limit)

    merged: dict[str, dict[str, Any]] = {}

    # --------
    # 先處理 FTS 結果
    # --------
    fts_scores = [float(row["rank"] or 0.0) for row in fts_rows]
    fts_norm_scores = _min_max_normalize(fts_scores)

    for idx, row in enumerate(fts_rows):
        chunk_id = str(row["chunk_id"])

        merged[chunk_id] = {
            "chunk_id": row["chunk_id"],
            "document_id": row["document_id"],
            "chunk_index": row["chunk_index"],
            "document_title": row["document_title"],
            "content": row["content"],
            "token_count": row["token_count"],
            "created_at": row["created_at"],
            "metadata": row["metadata"],
            "matched_by_fts": True,
            "matched_by_vector": False,
            "fts_raw_score": fts_scores[idx],
            "fts_score": fts_norm_scores[idx],
            "vector_distance": None,
            "vector_score": 0.0,
        }

    # --------
    # 再處理 vector 結果
    # --------
    vector_distances = [float(row["distance"] or 0.0) for row in vector_rows]
    vector_norm_scores = _min_max_normalize(vector_distances, reverse=True)

    for idx, row in enumerate(vector_rows):
        chunk_id = str(row["chunk_id"])
        distance = vector_distances[idx]
        vector_score = vector_norm_scores[idx]

        if chunk_id in merged:
            # 同一 chunk 同時被 FTS / vector 命中
            merged[chunk_id]["matched_by_vector"] = True
            merged[chunk_id]["vector_distance"] = distance
            merged[chunk_id]["vector_score"] = vector_score
        else:
            merged[chunk_id] = {
                "chunk_id": row["chunk_id"],
                "document_id": row["document_id"],
                "chunk_index": row["chunk_index"],
                "document_title": row["document_title"],
                "content": row["content"],
                "token_count": row["token_count"],
                "created_at": row["created_at"],
                "metadata": row["metadata"],
                "matched_by_fts": False,
                "matched_by_vector": True,
                "fts_raw_score": 0.0,
                "fts_score": 0.0,
                "vector_distance": distance,
                "vector_score": vector_score,
            }

    # --------
    # 計算 hybrid score
    # --------
    items = []

    for value in merged.values():
        title_text = (value.get("document_title") or "").lower()
        content_text = (value.get("content") or "").lower()

        # 小額 bonus：
        # 如果 normalized query 直接命中文件標題或 chunk 內容，可微幅加分
        title_bonus = (
            0.12 if normalized_query and normalized_query in title_text else 0.0
        )
        content_bonus = (
            0.08 if normalized_query and normalized_query in content_text else 0.0
        )

        # 同時被 FTS + vector 命中，通常可信度較高
        dual_hit_bonus = (
            0.10 if value["matched_by_fts"] and value["matched_by_vector"] else 0.0
        )

        # 目前權重：
        # - FTS 0.55
        # - vector 0.45
        # 這是偏保守的混合比，因為多數文件問答場景仍會需要 keyword precision
        hybrid_score = (
            0.55 * value["fts_score"]
            + 0.45 * value["vector_score"]
            + dual_hit_bonus
            + title_bonus
            + content_bonus
        )

        value["hybrid_score"] = hybrid_score
        items.append(value)

    items.sort(
        key=lambda x: (
            x["hybrid_score"],
            x["matched_by_fts"],
            x["matched_by_vector"],
        ),
        reverse=True,
    )

    return items[:limit]
