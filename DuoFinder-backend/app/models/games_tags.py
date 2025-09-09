from sqlalchemy import Column, Integer, ForeignKey
from app.db.connection import Base

class GamesTags(Base):
    __tablename__ = "Games_Tags"
    __table_args__ = {"schema": "dbo"}

    GamesID = Column(Integer, ForeignKey("dbo.Games.ID"), primary_key=True)
    TagsID = Column(Integer, ForeignKey("dbo.Tags.ID"), primary_key=True)

