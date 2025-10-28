from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.connection import Base

class Games(Base):
    __tablename__ = "Games"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    GameName = Column(String(200), nullable=False)
    Description = Column(Text, nullable=True)
    ReleasedYear = Column(Integer, nullable=True)

    # Relaciones
    game_ranks = relationship("GameRanks", back_populates="game", lazy="selectin", cascade="all, delete-orphan")
    user_skills = relationship("UserGamesSkill", back_populates="game", lazy="selectin", cascade="all, delete-orphan")
    communities = relationship("CommunitysGames", back_populates="game", lazy="selectin", cascade="all, delete-orphan")
