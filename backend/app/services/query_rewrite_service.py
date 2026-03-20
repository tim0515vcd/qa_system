import re
import unicodedata

from sqlalchemy.orm import Session

from app.models.query_rewrite_rule import QueryRewriteRule


def normalize_query_text(query: str) -> str:
    """
    將 query 做基礎正規化，這是正式版最基本的一層。

    做的事情：
    1. NFKC：統一全形/半形、某些 Unicode 變體
    2. lower()：英文統一小寫
    3. trim + 壓縮多餘空白

    注意：
    這裡不做 aggressive 清洗，不隨便刪字，
    避免把使用者原本語意洗掉。
    """
    query = unicodedata.normalize("NFKC", query)
    query = query.lower().strip()
    query = re.sub(r"\s+", " ", query)
    return query


def tokenize_query(query: str) -> list[str]:
    """
    正式版先做保守 tokenization。

    設計原則：
    - 保留整句，因為中文 query 很常不能直接空白切詞
    - 再補空白切出的 parts，讓英文 phrase 也能被規則命中

    例如：
    "sign in 失敗"
    -> ["sign in 失敗", "sign", "in", "失敗"] 這種太破碎不一定好

    所以這裡先採保守版：
    - 保留整句
    - 只補空白切出的片段
    """
    normalized = normalize_query_text(query)

    tokens: list[str] = [normalized]

    for part in normalized.split(" "):
        part = part.strip()
        if part and part not in tokens:
            tokens.append(part)

    return tokens


def build_rewritten_query(query: str, db: Session) -> dict:
    """
    將使用者 query 轉成正式版 retrieval query。

    回傳內容分成幾層：
    - original_query：原始輸入
    - normalized_query：正規化後查詢
    - canonical_terms：normalize 類規則轉出的標準詞
    - expanded_terms：synonym / alias / translation 類規則補出的擴展詞
    - final_query：最後拿去做 FTS 的查詢字串

    設計重點：
    1. vector search 不建議吃太多擴展詞，容易把語意拉歪
    2. FTS 可適度吃 final_query，提高 recall
    """
    original_query = query
    normalized_query = normalize_query_text(query)
    query_tokens = tokenize_query(normalized_query)

    # 撈出所有啟用中的 rewrite rules
    # 第一版正式版先全撈，資料量通常不大
    # 之後規模變大可再改成 source_term in (...) 的查詢優化
    rules = (
        db.query(QueryRewriteRule).filter(QueryRewriteRule.is_active.is_(True)).all()
    )

    # canonical_terms：正規化後的主查詢詞
    canonical_terms: list[str] = [normalized_query]

    # expanded_terms：用來補 recall 的擴展詞
    expanded_terms: list[str] = []

    for rule in rules:
        source = normalize_query_text(rule.source_term)
        target = normalize_query_text(rule.target_term)

        # 規則命中條件：
        # 1. 完全等於整句
        # 2. 命中 token
        # 3. source 是 query 子字串
        matched = False

        if source == normalized_query:
            matched = True
        elif source in query_tokens:
            matched = True
        elif source in normalized_query:
            matched = True

        if not matched:
            continue

        # normalize 類型：
        # 代表 target 是比較標準的 canonical term
        if rule.rewrite_type == "normalize":
            if target not in canonical_terms:
                canonical_terms.append(target)
        else:
            # synonym / alias / translation
            # 這些先視為 recall 用擴展詞
            if target not in expanded_terms:
                expanded_terms.append(target)

    # final_query 組法：
    # 先放 canonical，再放 expanded
    # 去重保序，避免 query 變太醜
    final_terms: list[str] = []
    seen = set()

    for term in canonical_terms + expanded_terms:
        term = term.strip()
        if not term:
            continue
        if term in seen:
            continue
        seen.add(term)
        final_terms.append(term)

    final_query = " ".join(final_terms)

    return {
        "original_query": original_query,
        "normalized_query": normalized_query,
        "canonical_terms": canonical_terms,
        "expanded_terms": expanded_terms,
        "final_query": final_query,
    }
