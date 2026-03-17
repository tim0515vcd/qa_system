from uuid import UUID
from pydantic import BaseModel, Field


class FeedbackRequest(BaseModel):
    feedback_type: str = Field(..., pattern="^(like|dislike)$")
    reason: str | None = None
    comment: str | None = None


class FeedbackResponse(BaseModel):
    id: UUID
    search_query_id: UUID
    feedback_type: str
    reason: str | None
    comment: str | None
