from sqlalchemy import Column, Integer, String
from app.db.connection import Base

class MainGenre(Base):
    __tablename__ = "MainGenre"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    GenreName = Column(String(120), nullable=False, unique=True)