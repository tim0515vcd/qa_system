from fastapi import FastAPI
import os
import psycopg2
from app.api.documents import router as documents_router
from app.api.search import router as search_router
from app.api.qa import router as qa_router

# FastAPI 應用入口
app = FastAPI(title="RAG Docs System")


@app.get("/health")
def health():
    """
    最基本的健康檢查。
    用來確認 API service 有正常活著。
    """
    return {"status": "ok"}


@app.get("/db-check")
def db_check():
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "db"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        dbname=os.getenv("POSTGRES_DB", "ragdb"),
        user=os.getenv("POSTGRES_USER", "raguser"),
        password=os.getenv("POSTGRES_PASSWORD", "ragpass"),
    )
    cur = conn.cursor()
    cur.execute("SELECT version();")
    version = cur.fetchone()[0]
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    conn.commit()
    cur.close()
    conn.close()
    return {"db": "connected", "version": version}


# 掛上 documents API
app.include_router(documents_router)
app.include_router(search_router)
app.include_router(qa_router)
