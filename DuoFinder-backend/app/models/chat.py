from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.connection import Base

class Chat(Base):
    __tablename__ = "Chat"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    MatchesID = Column(Integer, ForeignKey("dbo.Matches.ID"), nullable=False, index=True)
    SenderID = Column(Integer, ForeignKey("dbo.User.ID"), nullable=False, index=True)
    ContentChat = Column(String(2000), nullable=False)
    CreatedDate = Column(DateTime, nullable=True)
    Status = Column(String(50), nullable=True)
    ReadChat = Column(Boolean, nullable=True)

    match = relationship("Matches", back_populates="messages", lazy="joined")
    sender = relationship("User", back_populates="sent_messages", lazy="joined")
