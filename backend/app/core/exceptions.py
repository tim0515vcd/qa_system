class AppError(Exception):
    status_code = 500
    detail = "internal server error"

    def __init__(self, detail: str | None = None):
        if detail:
            self.detail = detail
        super().__init__(self.detail)


class BadRequestError(AppError):
    status_code = 400
    detail = "bad request"


class NotFoundError(AppError):
    status_code = 404
    detail = "resource not found"


class ConflictError(AppError):
    status_code = 409
    detail = "resource conflict"


class ExternalServiceError(AppError):
    status_code = 503
    detail = "external service unavailable"
