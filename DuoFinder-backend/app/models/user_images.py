from sqlalchemy import Column, Integer, String, Boolean, Date
from sqlalchemy.orm import declarative_base, relationship   
from app.db.connection import Base
from sqlalchemy import ForeignKey

class UserImages(Base):
    __tablename__ = "User_Images"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    UserID = Column(Integer, ForeignKey("dbo.User.ID"), nullable=False)
    ImageURL = Column(String(500), nullable=False)
    IsPrimary = Column(Boolean, nullable=False, server_default="0")

    user = relationship("User", back_populates="images")
