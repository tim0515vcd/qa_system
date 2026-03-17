from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from uuid import UUID
from app.core.deps import DbSession

from app.schemas.document import DocumentUploadResponse
from app.schemas.chunk import DocumentChunkItem, DocumentChunkListResponse

from app.services.ingestion_service import ingest_document
from app.services.document_service import save_uploaded_file
from app.services.document_service import list_document_chunks

# documents 相關 API 路由
router = APIRouter(prefix="/api/v1/documents", tags=["documents"])

# 目前先限制允許的 source_type
# 這樣後面 parser 比較好控管，不會什麼值都塞進來
ALLOWED_SOURCE_TYPES = {"pdf", "markdown", "notion"}


@router.post("/upload", response_model=DocumentUploadResponse)
def upload_document(
    # 檔案本體，透過 multipart/form-data 上傳
    file: UploadFile = File(...),
    # 額外表單欄位，用來描述文件來源類型
    source_type: str = Form(...),
    # 注入 SQLAlchemy session
    db: DbSession = None,
):
    # 驗證 source_type 是否在允許清單內
    if source_type not in ALLOWED_SOURCE_TYPES:
        raise HTTPException(status_code=400, detail="invalid source_type")

    # 保底檢查：理論上 UploadFile 應該要有檔名
    if not file.filename:
        raise HTTPException(status_code=400, detail="filename is required")

    # 實際檔案儲存與 DB 建立交給 service 處理
    document = save_uploaded_file(file, source_type, db)

    # 回傳精簡結果給前端
    return DocumentUploadResponse(
        document_id=document.id,
        title=document.title,
        source_type=document.source_type,
        status=document.status,
        created_at=document.created_at,
    )


@router.post("/{document_id}/ingest")
def ingest_document_api(
    document_id: UUID,
    db: DbSession,
):
    try:
        result = ingest_document(str(document_id), db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{document_id}/chunks", response_model=DocumentChunkListResponse)
def get_document_chunks(
    document_id: UUID,
    db: DbSession,
):
    chunks = list_document_chunks(document_id, db)

    return DocumentChunkListResponse(
        items=[
            DocumentChunkItem(
                id=chunk.id,
                document_id=chunk.document_id,
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                page_number=chunk.page_number,
                start_offset=chunk.start_offset,
                end_offset=chunk.end_offset,
                token_count=chunk.token_count,
                created_at=chunk.created_at,
            )
            for chunk in chunks
        ],
        total=len(chunks),
    )
