from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from app.db.connection import Base

class Matches(Base):
    __tablename__ = "Matches"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    UserID1 = Column(Integer, ForeignKey("dbo.User.ID"), nullable=False, index=True)
    UserID2 = Column(Integer, ForeignKey("dbo.User.ID"), nullable=False, index=True)
    MatchDate = Column(DateTime, nullable=True)
    Status = Column(Boolean, nullable=False)
    IsRanked = Column(Boolean, nullable=True)
    LikedByUser1 = Column(Boolean, nullable=True)
    LikedByUser2 = Column(Boolean, nullable=True)

    user1 = relationship("User", foreign_keys=[UserID1], back_populates="matches_as_user1", lazy="joined")
    user2 = relationship("User", foreign_keys=[UserID2], back_populates="matches_as_user2", lazy="joined")
    messages = relationship("Chat", back_populates="match", lazy="selectin", cascade="all, delete-orphan")
