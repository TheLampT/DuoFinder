from sqlalchemy import Column, Integer, String, ForeignKey,Text
from app.db.connection import Base

class Games(Base):
    __tablename__ = "Games"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    GenreId = Column(Integer, ForeignKey("dbo.MainGenre.ID"))
    RankId = Column(Integer, ForeignKey("dbo.Ranks.ID"))
    GameName = Column(String(200), nullable=False)
    Description = Column(Text)
    ReleasedYear = Column(Integer)
