from sqlalchemy import Column, Integer, ForeignKey, Boolean, String
from sqlalchemy.orm import declarative_base, relationship
from app.db.connection import Base


class UserGamesSkill(Base):
    __tablename__ = "User_Games_Skill"
    __table_args__ = {"schema": "dbo"}

    UserID = Column(Integer, ForeignKey("dbo.User.ID"), primary_key=True)
    GameId = Column(Integer, ForeignKey("dbo.Games.ID"), primary_key=True)
    Game_rank_local_id = Column(Integer)
    SkillLevel = Column(String(50))
    IsRanked = Column(Boolean, nullable=False, server_default="0")

