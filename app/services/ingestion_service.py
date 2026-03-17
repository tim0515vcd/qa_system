import uuid
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.services.embedding_service import fake_embedding


def simple_markdown_chunk(
    text: str, chunk_size: int = 500, overlap: int = 100
) -> list[str]:
    """
    最簡單的字元切 chunk 版本。
    先用這版打通流程，之後再升級成 heading-aware / token-aware chunking。
    """
    text = text.strip()
    if not text:
        return []

    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunks.append(text[start:end])

        # overlap 讓前後 chunk 保留一些上下文
        start += max(chunk_size - overlap, 1)

    return chunks


def ingest_document(document_id: str, db: Session) -> dict:
    """
    最小版 ingestion:
    1. 找 document
    2. 讀原始檔
    3. 切 chunks
    4. 寫入 document_chunks
    5. 更新 document 狀態
    """
    try:
        document_uuid = uuid.UUID(document_id)
    except ValueError:
        raise ValueError("invalid document_id")

    document = db.query(Document).filter(Document.id == document_uuid).first()
    if not document:
        raise ValueError("document not found")

    if document.source_type != "markdown":
        raise ValueError("currently only markdown is supported")

    if not document.storage_path:
        raise ValueError("storage_path is empty")

    file_path = Path(document.storage_path)
    if not file_path.exists():
        raise ValueError("file not found on disk")

    # 目前先直接把 markdown 當純文字讀進來
    content_text = file_path.read_text(encoding="utf-8").strip()
    if not content_text:
        raise ValueError("document is empty")

    # 避免重複 ingest 時 chunks 一直累加
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()

    chunks = simple_markdown_chunk(content_text, chunk_size=500, overlap=100)

    chunk_rows = []
    for idx, chunk_text in enumerate(chunks):
        chunk_rows.append(
            DocumentChunk(
                document_id=document.id,
                chunk_index=idx,
                content=chunk_text,
                token_count=len(chunk_text),  # 先暫時用字元數代替
                embedding=fake_embedding(chunk_text),
                metadata_={"source_type": document.source_type},
            )
        )

    db.add_all(chunk_rows)
    db.flush()

    # 將該 document 的 chunks 內容轉成 tsvector
    db.execute(
        text(
            """
            UPDATE document_chunks
            SET content_tsv = to_tsvector('english', content)
            WHERE document_id = :document_id
            """
        ),
        {"document_id": str(document.id)},
    )

    document.status = "indexed"
    db.commit()

    return {
        "document_id": str(document.id),
        "chunks_created": len(chunk_rows),
        "status": document.status,
    }
