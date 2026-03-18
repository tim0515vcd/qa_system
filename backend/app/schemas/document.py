from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DocumentUploadResponse(BaseModel):
    # 上傳完成後回傳給前端的 document id
    document_id: UUID

    # 從檔名推導出的標題（先用檔名 stem）
    title: str

    # 文件來源類型，例如 pdf / markdown / notion
    source_type: str

    # 文件目前狀態，這一版上傳完先是 uploaded
    status: str

    # 建立時間，方便前端顯示或後續追查
    created_at: datetime

    # 允許直接從 ORM model 轉成 Pydantic response
    model_config = ConfigDict(from_attributes=True)
