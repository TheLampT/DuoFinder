from sqlalchemy import Column, Integer, String, Boolean, Date, SmallInteger
from sqlalchemy.orm import relationship
from app.db.connection import Base

class User(Base):
    __tablename__ = "User"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    Mail = Column(String(255), unique=True, index=True, nullable=False)
    Password = Column(String(255), nullable=False)
    Username = Column(String(100), unique=True, index=True, nullable=False)
    Bio = Column(String(500), nullable=True)
    BirthDate = Column(Date, nullable=True)
    Server = Column(String(100), nullable=True)
    Discord = Column(String(120), nullable=True)
    Tracker = Column(String(200), nullable=True)
    IsActive = Column(Boolean, nullable=False, server_default="1")
    AgeMin = Column(SmallInteger, nullable=True)
    AgeMax = Column(SmallInteger, nullable=True)

    # Relaciones
    images = relationship("UserImages", back_populates="user", lazy="selectin", cascade="all, delete-orphan")
    games_skills = relationship("UserGamesSkill", back_populates="user", lazy="selectin", cascade="all, delete-orphan")
    community_memberships = relationship("CommunitysMembers", back_populates="user", lazy="selectin", cascade="all, delete-orphan")
    owned_communities = relationship("Community", back_populates="owner", lazy="selectin")
    matches_as_user1 = relationship("Matches", foreign_keys="Matches.UserID1", back_populates="user1", lazy="selectin")
    matches_as_user2 = relationship("Matches", foreign_keys="Matches.UserID2", back_populates="user2", lazy="selectin")
    sent_messages = relationship("Chat", foreign_keys="Chat.SenderID", back_populates="sender", lazy="selectin")

