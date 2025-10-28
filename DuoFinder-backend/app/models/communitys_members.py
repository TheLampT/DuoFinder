from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.connection import Base

class CommunitysMembers(Base):
    __tablename__ = "Communitys_Members"
    __table_args__ = {"schema": "dbo"}

    Community_id = Column(Integer, ForeignKey("dbo.Community.ID"), primary_key=True, index=True)
    User_id = Column(Integer, ForeignKey("dbo.User.ID"), primary_key=True, index=True)
    Role = Column(String(50), nullable=True)
    Joined_at = Column(DateTime, nullable=True)

    community = relationship("Community", back_populates="members")
    user = relationship("User", back_populates="community_memberships")
