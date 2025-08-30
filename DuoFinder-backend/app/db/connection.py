from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# Carga variables de entorno
load_dotenv()

# Recupera la URL
DATABASE_URL = os.getenv("DATABASE_URL")

# Crea el engine
engine = create_engine(DATABASE_URL)

# Session y Base
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()