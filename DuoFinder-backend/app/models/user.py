from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime
from sqlalchemy.orm import relationship
from app.db.connection import Base
from datetime import date


class User(Base):
    __tablename__ = "User"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    Mail = Column(String(255), unique=True, index=True, nullable=False)
    Password = Column(String(255), nullable=False)
    Username = Column(String(100), unique=True, index=True, nullable=False)
    Bio = Column(String(500))
    BirthDate = Column(Date)
    Server = Column(String(100))
    Discord = Column(String(120))
    Tracker = Column(String(200))
    IsActive = Column(Boolean, nullable=False, server_default="1")
