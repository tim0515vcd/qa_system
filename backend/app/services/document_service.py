from pathlib import Path
import hashlib
import shutil
import uuid
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.chunk import DocumentChunk
from app.models.document import Document

# 原始上傳檔案存放位置
# /app 是 container 內的專案根目錄
UPLOAD_DIR = Path("/app/storage/raw")

# 啟動時保底建立資料夾
# exist_ok=True 代表如果已存在就不要報錯
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def calculate_checksum(file_path: Path) -> str:
    """
    計算檔案 sha256。
    用途：
    1. 之後可檢查重複上傳
    2. 可做版本比對
    3. 可追蹤檔案內容是否真的變動
    """
    sha256 = hashlib.sha256()

    # 分塊讀取，避免大檔一次吃進記憶體
    with file_path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)

    return sha256.hexdigest()


def save_uploaded_file(upload_file, source_type: str, db: Session) -> Document:
    """
    把上傳檔案落地到 storage/raw，
    並在 documents table 建一筆資料。
    """
    # 保留原副檔名，例如 .pdf / .md
    file_ext = Path(upload_file.filename).suffix

    # 先生成 document id，這個 id 同時也用來命名存檔檔名
    document_id = uuid.uuid4()

    # 避免同名檔案衝突，所以真正落地檔名用 uuid
    saved_filename = f"{document_id}{file_ext}"
    saved_path = UPLOAD_DIR / saved_filename

    # 將 UploadFile 的內容寫入本地檔案
    with saved_path.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    # 檔案落地後再算 checksum
    checksum = calculate_checksum(saved_path)

    # 建立 documents table 的 ORM 物件
    document = Document(
        id=document_id,
        source_type=source_type,
        # 先直接用原檔名去掉副檔名當 title
        title=Path(upload_file.filename).stem,
        original_filename=upload_file.filename,
        storage_path=str(saved_path),
        mime_type=upload_file.content_type,
        status="uploaded",
        checksum=checksum,
    )

    # 寫入 DB
    db.add(document)
    db.flush()
    db.refresh(document)

    return document


def list_document_chunks(document_id: UUID, db: Session) -> list[DocumentChunk]:
    """
    取得某份文件的所有 chunks，依 chunk_index 排序。
    """
    return (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.chunk_index.asc())
        .all()
    )
