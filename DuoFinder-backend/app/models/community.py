from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.connection import Base

class Community(Base):
    __tablename__ = "Community"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    Community_name = Column(String(200), nullable=False)
    Info = Column(String(1000), nullable=True)
    Owner_user_id = Column(Integer, ForeignKey("dbo.User.ID"), nullable=False)
    Created_date = Column(DateTime, nullable=True)
    Is_public = Column(Boolean, nullable=True)

    owner = relationship("User", back_populates="owned_communities", lazy="joined")

    # ⬇⬇⬇ nombres de clase EXACTOS
    members = relationship(
        "CommunitysMembers",
        back_populates="community",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    games = relationship(
        "CommunitysGames",
        back_populates="community",
        lazy="selectin",
        cascade="all, delete-orphan",
    )