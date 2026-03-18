import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 從環境變數組出 PostgreSQL 連線字串
# 這裡 host 用的是 docker compose 裡的 service 名稱 db
DATABASE_URL = (
    f"postgresql+psycopg2://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}"
    f"@{os.getenv('POSTGRES_HOST', 'db')}:{os.getenv('POSTGRES_PORT', '5432')}/{os.getenv('POSTGRES_DB')}"
)

# 建立 SQLAlchemy Engine
# pool_pre_ping=True 可避免連線池中有失效連線時直接炸掉
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# 建立 DB Session 工廠
# autoflush=False: 避免 SQLAlchemy 在你還沒準備好時自動 flush
# autocommit=False: 交易要自己 commit，避免不小心寫入
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    """
    FastAPI dependency:
    每次 request 進來時給一個 DB session，
    request 結束後自動關閉。
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
