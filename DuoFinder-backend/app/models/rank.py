from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base
from app.db.connection import Base

class Rank(Base):
    __tablename__ = "Ranks"

    ID = Column(Integer, primary_key=True)
    Rank = Column(String)
