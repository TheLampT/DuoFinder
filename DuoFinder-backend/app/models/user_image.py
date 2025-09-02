from sqlalchemy import Column, Integer, String, Boolean, Date
from sqlalchemy.orm import declarative_base, relationship   
from app.db.connection import Base
from sqlalchemy import ForeignKey

class UserImage(Base):
    __tablename__ = "User_Images"
    ID = Column(Integer, primary_key=True)
    UserID = Column(Integer, ForeignKey("User.ID"))
    ImageURL = Column(String, nullable=False)
    IsPrimary = Column(Boolean, default=False)

    user = relationship("User", back_populates="images")
