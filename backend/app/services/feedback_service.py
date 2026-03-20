import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.query_feedback import QueryFeedback
from app.models.search_query import SearchQuery


def create_feedback(
    search_query_id: str,
    feedback_type: str,
    db: Session,
    reason: str | None = None,
    comment: str | None = None,
) -> QueryFeedback:
    try:
        search_query_uuid = uuid.UUID(search_query_id)
    except ValueError:
        raise BadRequestError("invalid search_query_id")

    query_record = (
        db.query(SearchQuery).filter(SearchQuery.id == search_query_uuid).first()
    )
    if not query_record:
        raise NotFoundError("search query not found")

    feedback = QueryFeedback(
        search_query_id=search_query_uuid,
        feedback_type=feedback_type,
        reason=reason,
        comment=comment,
    )

    db.add(feedback)
    db.flush()
    db.refresh(feedback)

    return feedback
