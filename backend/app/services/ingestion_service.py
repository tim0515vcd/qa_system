import re
import uuid
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.services.embedding_service import gemini_document_embedding


PARSER_TYPE = "markdown"
PARSER_VERSION = "markdown_v2"

# Markdown heading，例如：
# # Title
# ## Section
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)

# 段落切分：兩個以上換行視為段落分隔
PARAGRAPH_SPLIT_RE = re.compile(r"\n\s*\n+")


def normalize_text(value: str) -> str:
    """
    基礎正規化：
    - Unicode 正規化
    - 換行統一
    - 去掉頭尾空白
    """
    value = unicodedata.normalize("NFKC", value)
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    return value.strip()


def detect_language(text: str) -> str:
    """
    粗略語言判斷。
    先做簡單版即可：
    - 幾乎全中文 => zh
    - 幾乎全英文 => en
    - 混合 => mixed
    """
    if not text.strip():
        return "unknown"

    cjk_count = len(re.findall(r"[\u4e00-\u9fff]", text))
    latin_count = len(re.findall(r"[A-Za-z]", text))

    if cjk_count > 0 and latin_count == 0:
        return "zh"
    if latin_count > 0 and cjk_count == 0:
        return "en"
    if cjk_count > 0 and latin_count > 0:
        return "mixed"
    return "unknown"


def estimate_token_count(text: str) -> int:
    """
    粗估 token 數。
    正式 tokenizer 之後可再替換，這版先比純字元數合理一點。
    """
    words = len(text.split())
    cjk_chars = len(re.findall(r"[\u4e00-\u9fff]", text))

    return max(
        words,
        cjk_chars // 2,
        len(text) // 4,
        1,
    )


def split_long_text(text: str, max_chars: int, overlap: int) -> list[str]:
    """
    當單一段落太長時，做次級切分。
    優先嘗試在換行或句號附近切，減少硬切造成語意破碎。
    """
    text = text.strip()
    if not text:
        return []

    if len(text) <= max_chars:
        return [text]

    pieces: list[str] = []
    start = 0
    text_len = len(text)
    stride = max(max_chars - overlap, 1)

    while start < text_len:
        end = min(start + max_chars, text_len)
        piece = text[start:end]

        # 若不是最後一段，優先找較自然切點
        if end < text_len:
            candidates = [
                piece.rfind("\n"),
                piece.rfind("。"),
                piece.rfind("！"),
                piece.rfind("？"),
                piece.rfind(". "),
                piece.rfind("! "),
                piece.rfind("? "),
            ]
            split_at = max(candidates)
            if split_at > max_chars * 0.6:
                end = start + split_at + 1
                piece = text[start:end]

        piece = piece.strip()
        if piece:
            pieces.append(piece)

        start += (
            stride
            if end == min(start + max_chars, text_len)
            else max((end - start) - overlap, 1)
        )

    return pieces


def parse_markdown_to_sections(markdown_text: str) -> dict[str, Any]:
    """
    將 markdown 先 parse 成 section 結構。

    回傳：
    {
        "document_language": "...",
        "parser_type": "...",
        "parser_version": "...",
        "sections": [
            {
                "heading": "...",
                "heading_level": 2,
                "heading_path": ["父節", "子節"],
                "body": "..."
            }
        ],
        "metadata": {...}
    }
    """
    text = normalize_text(markdown_text)
    if not text:
        # 內容是空的，屬於請求內容不合法
        raise BadRequestError("document is empty")

    matches = list(HEADING_RE.finditer(text))
    sections: list[dict[str, Any]] = []

    if not matches:
        sections.append(
            {
                "heading": None,
                "heading_level": None,
                "heading_path": [],
                "body": text,
            }
        )
    else:
        # 第一個 heading 前的內容視為前言
        if matches[0].start() > 0:
            preamble = text[: matches[0].start()].strip()
            if preamble:
                sections.append(
                    {
                        "heading": None,
                        "heading_level": None,
                        "heading_path": [],
                        "body": preamble,
                    }
                )

        heading_stack: list[tuple[int, str]] = []

        for idx, match in enumerate(matches):
            level = len(match.group(1))
            heading_text = match.group(2).strip()

            # 維護 heading path stack
            while heading_stack and heading_stack[-1][0] >= level:
                heading_stack.pop()
            heading_stack.append((level, heading_text))

            body_start = match.end()
            body_end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
            body = text[body_start:body_end].strip()

            sections.append(
                {
                    "heading": heading_text,
                    "heading_level": level,
                    "heading_path": [item[1] for item in heading_stack],
                    "body": body,
                }
            )

    return {
        "document_language": detect_language(text),
        "parser_type": PARSER_TYPE,
        "parser_version": PARSER_VERSION,
        "sections": sections,
        "metadata": {
            "section_count": len(sections),
            "warnings": [],
        },
    }


def chunk_sections(
    sections: list[dict[str, Any]],
    target_chars: int = 900,
    max_chars: int = 1200,
    overlap: int = 120,
) -> list[dict[str, Any]]:
    """
    以 section / paragraph 為主的 chunking。

    設計原則：
    - 標題盡量跟內容留在一起
    - 小段落合併成較完整 chunk
    - 超長段落再做二次切分
    """
    chunks: list[dict[str, Any]] = []
    chunk_index = 0
    running_offset = 0

    for section in sections:
        heading = section["heading"]
        heading_level = section["heading_level"]
        heading_path = section.get("heading_path", [])
        body = (section.get("body") or "").strip()

        prefix = f"{heading}\n\n" if heading else ""
        body_parts = [
            part.strip() for part in PARAGRAPH_SPLIT_RE.split(body) if part.strip()
        ]
        if not body_parts and body:
            body_parts = [body]

        # 沒有 body，但有 heading 時，仍可保留一個 heading chunk
        if not body_parts and heading:
            heading_only = heading.strip()
            chunks.append(
                {
                    "chunk_index": chunk_index,
                    "content": heading_only,
                    "section_heading": heading,
                    "heading_level": heading_level,
                    "chunk_type": "heading",
                    "content_language": detect_language(heading_only),
                    "page_number": None,
                    "start_offset": running_offset,
                    "end_offset": running_offset + len(heading_only),
                    "metadata": {
                        "heading_path": heading_path,
                        "split_reason": None,
                        "parser_version": PARSER_VERSION,
                    },
                }
            )
            chunk_index += 1
            running_offset += len(heading_only) + 2
            continue

        current = prefix.strip()
        current_start = running_offset

        for part in body_parts:
            candidate = f"{current}\n\n{part}".strip() if current else part

            # 當目前 chunk 已有內容，且再加會超出 max_chars，就先落盤
            if current and len(candidate) > max_chars:
                chunks.append(
                    {
                        "chunk_index": chunk_index,
                        "content": current.strip(),
                        "section_heading": heading,
                        "heading_level": heading_level,
                        "chunk_type": "paragraph",
                        "content_language": detect_language(current),
                        "page_number": None,
                        "start_offset": current_start,
                        "end_offset": current_start + len(current.strip()),
                        "metadata": {
                            "heading_path": heading_path,
                            "split_reason": "section_overflow",
                            "parser_version": PARSER_VERSION,
                        },
                    }
                )
                chunk_index += 1

                # 超長段落二次切分
                long_parts = split_long_text(part, max_chars=max_chars, overlap=overlap)

                if len(long_parts) > 1:
                    for long_idx, long_part in enumerate(long_parts[:-1]):
                        content = (
                            f"{prefix}{long_part}".strip() if heading else long_part
                        )
                        chunks.append(
                            {
                                "chunk_index": chunk_index,
                                "content": content,
                                "section_heading": heading,
                                "heading_level": heading_level,
                                "chunk_type": "paragraph",
                                "content_language": detect_language(content),
                                "page_number": None,
                                "start_offset": current_start,
                                "end_offset": current_start + len(content),
                                "metadata": {
                                    "heading_path": heading_path,
                                    "split_reason": "long_paragraph",
                                    "split_from_long_paragraph": True,
                                    "long_split_index": long_idx,
                                    "parser_version": PARSER_VERSION,
                                },
                            }
                        )
                        chunk_index += 1

                    current = (
                        f"{prefix}{long_parts[-1]}".strip()
                        if heading
                        else long_parts[-1]
                    )
                else:
                    current = f"{prefix}{part}".strip() if heading else part

                current_start += len(current) + 2
                continue

            # 達到目標長度就先切出一塊
            if current and len(current) >= target_chars:
                chunks.append(
                    {
                        "chunk_index": chunk_index,
                        "content": current.strip(),
                        "section_heading": heading,
                        "heading_level": heading_level,
                        "chunk_type": "paragraph",
                        "content_language": detect_language(current),
                        "page_number": None,
                        "start_offset": current_start,
                        "end_offset": current_start + len(current.strip()),
                        "metadata": {
                            "heading_path": heading_path,
                            "split_reason": "target_reached",
                            "parser_version": PARSER_VERSION,
                        },
                    }
                )
                chunk_index += 1
                current = f"{prefix}{part}".strip() if heading else part
                current_start += len(current) + 2
            else:
                current = candidate.strip()

        if current:
            chunks.append(
                {
                    "chunk_index": chunk_index,
                    "content": current.strip(),
                    "section_heading": heading,
                    "heading_level": heading_level,
                    "chunk_type": "paragraph" if body else "heading",
                    "content_language": detect_language(current),
                    "page_number": None,
                    "start_offset": current_start,
                    "end_offset": current_start + len(current.strip()),
                    "metadata": {
                        "heading_path": heading_path,
                        "split_reason": "section_end",
                        "parser_version": PARSER_VERSION,
                    },
                }
            )
            chunk_index += 1

        running_offset += len(prefix) + len(body) + 2

    # 合併太小碎片，減少噪音
    merged_chunks: list[dict[str, Any]] = []
    for item in chunks:
        if (
            merged_chunks
            and len(item["content"]) < 180
            and merged_chunks[-1]["section_heading"] == item["section_heading"]
            and merged_chunks[-1]["chunk_type"] == item["chunk_type"]
        ):
            merged_chunks[-1][
                "content"
            ] = f"{merged_chunks[-1]['content']}\n\n{item['content']}".strip()
            merged_chunks[-1]["end_offset"] = item["end_offset"]
        else:
            merged_chunks.append(item)

    for idx, item in enumerate(merged_chunks):
        item["chunk_index"] = idx
        item["token_count"] = estimate_token_count(item["content"])

    return merged_chunks


def ingest_document(document_id: str, db: Session) -> dict:
    """
    升級版 ingestion 流程：
    1. 找 document
    2. 讀檔
    3. parse markdown -> sections
    4. section-aware chunking
    5. 寫入 document_chunks
    6. 重建 tsvector
    7. 更新 document 狀態 / parser info / indexed_at
    """
    # 檢查 document_id 是否是合法 UUID
    try:
        document_uuid = uuid.UUID(document_id)
    except ValueError:
        raise BadRequestError("invalid document_id")

    # 查詢文件是否存在
    document = db.query(Document).filter(Document.id == document_uuid).first()
    if not document:
        raise NotFoundError("document not found")

    # ingestion 開始：先把狀態設成 processing
    current_metadata = document.metadata_ or {}
    current_metadata["ingest_started_at"] = datetime.utcnow().isoformat()
    current_metadata["last_ingest_error"] = None
    document.metadata_ = current_metadata
    document.status = "processing"
    db.flush()

    try:
        # 目前 ingestion 僅支援 markdown
        if document.source_type != "markdown":
            raise BadRequestError("currently only markdown is supported")

        # 文件紀錄有問題：缺 storage_path
        if not document.storage_path:
            raise BadRequestError("storage_path is empty")

        file_path = Path(document.storage_path)

        # DB 有記錄，但實體檔案不存在
        if not file_path.exists():
            raise NotFoundError("file not found on disk")

        # 讀檔並做基本正規化
        content_text = normalize_text(file_path.read_text(encoding="utf-8"))
        if not content_text:
            raise BadRequestError("document is empty")

        # parse markdown -> sections
        parsed = parse_markdown_to_sections(content_text)

        # section-aware chunking
        chunks = chunk_sections(
            parsed["sections"],
            target_chars=900,
            max_chars=1200,
            overlap=120,
        )

        # 避免重複 ingest 時 chunks 累加
        db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document.id
        ).delete()
        db.flush()

        # 建立 chunk ORM 物件
        chunk_rows: list[DocumentChunk] = []
        for chunk in chunks:
            chunk_rows.append(
                DocumentChunk(
                    document_id=document.id,
                    chunk_index=chunk["chunk_index"],
                    content=chunk["content"],
                    section_heading=chunk["section_heading"],
                    heading_level=chunk["heading_level"],
                    chunk_type=chunk["chunk_type"],
                    content_language=chunk["content_language"],
                    page_number=chunk["page_number"],
                    start_offset=chunk["start_offset"],
                    end_offset=chunk["end_offset"],
                    token_count=chunk["token_count"],
                    embedding=gemini_document_embedding(chunk["content"]),
                    metadata_=chunk["metadata"],
                )
            )

        db.add_all(chunk_rows)
        db.flush()

        # 更新 document 層級欄位
        document.parser_type = parsed["parser_type"]
        document.parser_version = parsed["parser_version"]
        document.content_language = parsed["document_language"]
        document.status = "indexed"
        document.indexed_at = datetime.utcnow()

        # 將 parser metadata 併回 document metadata
        current_metadata = document.metadata_ or {}
        current_metadata.update(
            {
                "parser_type": parsed["parser_type"],
                "parser_version": parsed["parser_version"],
                "document_language": parsed["document_language"],
                "ingest_section_count": len(parsed["sections"]),
                "ingest_chunk_count": len(chunk_rows),
                "parser_warnings": parsed["metadata"].get("warnings", []),
                "ingest_finished_at": datetime.utcnow().isoformat(),
                "last_ingest_error": None,
            }
        )
        document.metadata_ = current_metadata

        # 重建 tsvector：title + section_heading + content
        db.execute(
            text(
                """
                UPDATE document_chunks dc
                SET content_tsv =
                    setweight(to_tsvector('simple', coalesce(d.title, '')), 'A') ||
                    setweight(to_tsvector('simple', coalesce(dc.section_heading, '')), 'B') ||
                    setweight(to_tsvector('simple', coalesce(dc.content, '')), 'C')
                FROM documents d
                WHERE dc.document_id = d.id
                  AND dc.document_id = :document_id
                """
            ),
            {"document_id": str(document.id)},
        )

        # 這裡不 commit，交給 router 控制 transaction
        db.flush()

        return {
            "document_id": str(document.id),
            "chunks_created": len(chunk_rows),
            "status": document.status,
            "parser_type": document.parser_type,
            "parser_version": document.parser_version,
            "content_language": document.content_language,
        }

    except Exception as e:
        # ingestion 失敗時，明確標成 failed，並把錯誤寫進 metadata
        current_metadata = document.metadata_ or {}
        current_metadata["ingest_finished_at"] = datetime.utcnow().isoformat()
        current_metadata["last_ingest_error"] = str(e)
        document.metadata_ = current_metadata
        document.status = "failed"
        db.flush()
        raise
