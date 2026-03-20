from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from app.api.documents import router as documents_router
from app.api.search import router as search_router
from app.api.qa import router as qa_router
from app.core.settings import settings

# FastAPI 應用入口
app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "app_env": settings.app_env,
    }


# 掛上 documents API
app.include_router(documents_router)
app.include_router(search_router)
app.include_router(qa_router)
