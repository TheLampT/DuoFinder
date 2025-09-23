from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.connection import Base

class Chat(Base):
    __tablename__ = "Chat"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    MatchesID = Column(Integer, ForeignKey("dbo.Matches.ID"), nullable=False)
    SenderID = Column(Integer, ForeignKey("dbo.User.ID"), nullable=False)
    ContentChat = Column(Text, nullable=False)
    CreatedDate = Column(DateTime, nullable=False, server_default=func.getdate())
    Status = Column(String(50))
    ReadChat = Column(Boolean, nullable=False, server_default="0")
