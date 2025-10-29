from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.connection import Base

class GameRanks(Base):
    __tablename__ = "Game_ranks"
    __table_args__ = {"schema": "dbo"}

    # PK compuesta
    Game_id = Column(Integer, ForeignKey("dbo.Games.ID"), primary_key=True)
    Local_rank_id = Column(Integer, primary_key=True)

    Rank_name = Column(String(120), nullable=True)
    Tier_name = Column(String(120), nullable=True)
    Division_label = Column(String(50), nullable=True)
    Division_number = Column(Integer, nullable=True)
    Rank_order = Column(Integer, nullable=True)

    game = relationship("Games", back_populates="game_ranks", lazy="joined")

    # 👇 ahora es ONE-TO-MANY correcto (un rank local lo usan muchos UserGamesSkill)
    user_skills = relationship("UserGamesSkill", lazy="selectin")
