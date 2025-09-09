from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base
from app.db.connection import Base

class Ranks(Base):
    __tablename__ = "Ranks"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    Rank = Column(String(120), nullable=False, unique=True)
