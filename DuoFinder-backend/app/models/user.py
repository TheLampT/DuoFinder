from sqlalchemy import Column, Integer, String, Boolean, Date
from sqlalchemy.orm import declarative_base
from app.db.connection import Base

Base = declarative_base()

class User(Base):
    __tablename__ = "User"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    Mail = Column(String(255), unique=True, index=True, nullable=False)
    Username = Column(String(100), unique=True, index=True, nullable=False)
    Password = Column(String(255), nullable=False)
    BirthDate = Column(Date, nullable=False)
    IsActive = Column(Boolean, nullable=False, server_default="1")
