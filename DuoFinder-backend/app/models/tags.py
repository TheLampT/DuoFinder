from sqlalchemy import Column, Integer, String
from app.db.connection import Base

class Tags(Base):
    __tablename__ = "Tags"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    TagName = Column(String(120), nullable=False, unique=True)