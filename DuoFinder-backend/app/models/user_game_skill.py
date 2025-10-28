from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, ForeignKeyConstraint
from sqlalchemy.orm import relationship
from app.db.connection import Base

class UserGamesSkill(Base):
    __tablename__ = "User_Games_Skill"
    __table_args__ = (
        # 👇 FK compuesta hacia Game_ranks(Game_id, LocalRank_id)
        ForeignKeyConstraint(
            ["GameId", "Game_rank_localId"],
            ["dbo.Game_ranks.Game_id", "dbo.Game_ranks.Local_rank_id"],
            name="fk_user_skill_gameranks",
        ),
        {"schema": "dbo"},
    )

    # PK compuesta (UserID, GameId)
    UserID = Column(Integer, ForeignKey("dbo.User.ID"), primary_key=True, index=True)
    GameId = Column(Integer, ForeignKey("dbo.Games.ID"), primary_key=True, index=True)

    Game_rank_localId = Column(Integer, nullable=True)  # parte de la FK compuesta
    SkillLevel = Column(String(120), nullable=True)
    IsRanked = Column(Boolean, nullable=True)

    # Relaciones
    user = relationship("User", back_populates="games_skills")
    game = relationship("Games", back_populates="user_skills")

    # 👇 ahora es MANY-TO-ONE correcto (cada skill apunta a 1 registro de Game_ranks)
    local_rank = relationship("GameRanks", back_populates="user_skills", lazy="joined")
