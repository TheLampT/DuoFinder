from sqlalchemy import Column, Integer, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, relationship
from app.db.connection import Base


class UserGameSkill(Base):
    __tablename__ = "User_Games_Skill"
    UserID = Column(Integer, ForeignKey("User.ID"), primary_key=True)
    GameID = Column(Integer, ForeignKey("Games.ID"), primary_key=True)
    SkillLevel = Column(Integer)
    IsRanked = Column(Boolean)

    user = relationship("User", back_populates="games")
    game = relationship("Game")  
