
from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.connection import Base

class Matches(Base):
    __tablename__ = "Matches"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    UserID1 = Column(Integer, ForeignKey("dbo.User.ID"), nullable=False)
    UserID2 = Column(Integer, ForeignKey("dbo.User.ID"), nullable=False)
    MatchDate = Column(DateTime, server_default=func.getdate())
    Status = Column(String(50))
    IsRanked = Column(Boolean, nullable=False, server_default="0")
