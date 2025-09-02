from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from app.db.connection import Base

class Game(Base):
    __tablename__ = "Games"

    ID = Column(Integer, primary_key=True)
    GameName = Column(String)
    Description = Column(String)
    ReleasedYear = Column(Integer)
    RankId = Column(Integer, ForeignKey("Ranks.ID"))

    # 🔗 Relaciones
    Rank = relationship("Rank")
    user_skills = relationship("UserGameSkill", back_populates="game")
