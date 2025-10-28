from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.connection import Base

class CommunitysGames(Base):
    __tablename__ = "Communitys_Games"
    __table_args__ = {"schema": "dbo"}

    Community_id = Column(Integer, ForeignKey("dbo.Community.ID"), primary_key=True, index=True)
    Game_id = Column(Integer, ForeignKey("dbo.Games.ID"), primary_key=True, index=True)

    community = relationship("Community", back_populates="games")
    game = relationship("Games", back_populates="communities")
