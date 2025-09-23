# app/models/community.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from app.db.connection import Base

# =========================
# Tabla principal: Community
# =========================
class Community(Base):
    __tablename__ = "Community"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    Community_name = Column(String(120), nullable=False, unique=True, index=True)
    Info = Column(String(1000))
    Owner_user_id = Column(Integer, ForeignKey("dbo.User.ID"), nullable=False, index=True)
    Created_date = Column(DateTime, nullable=False, server_default=text("SYSUTCDATETIME()"))
    Is_public = Column(Boolean, nullable=False, server_default=text("1"))

    """
    # Relaciones
    Owner = relationship("User", backref="Owned_communities")
    Members = relationship("Communitys_Members", back_populates="Community", cascade="all, delete-orphan")
    Games = relationship("Communitys_Games", back_populates="Community", cascade="all, delete-orphan")
    """

# =====================================================
# Tabla puente: Communitys_Members  (miembros/roles)
# PK compuesta (Community_id, User_id)
# =====================================================
class Communitys_Members(Base):
    __tablename__ = "Communitys_Members"
    __table_args__ = {"schema": "dbo"}

    Community_id = Column(Integer, ForeignKey("dbo.Community.ID"), primary_key=True)
    User_id = Column(Integer, ForeignKey("dbo.User.ID"), primary_key=True)
    Role = Column(String(50), nullable=False, server_default=text("'member'"))
    Joined_at = Column(DateTime, nullable=False, server_default=text("SYSUTCDATETIME()"))

    """
    Community = relationship("Community", back_populates="Members")
    User = relationship("User", back_populates="Community_memberships")
    """


# ===================================================
# Tabla puente: Communitys_Games  (juegos por comunidad)
# PK compuesta (Community_id, Game_id)
# ===================================================
class Communitys_Games(Base):
    __tablename__ = "Communitys_Games"
    __table_args__ = {"schema": "dbo"}

    Community_id = Column(Integer, ForeignKey("dbo.Community.ID"), primary_key=True)
    Game_id = Column(Integer, ForeignKey("dbo.Games.ID"), primary_key=True)

    """
    Community = relationship("Community", back_populates="Games")
    # Si tu modelo de juegos se llama "Games", esta relación funcionará.
    # Si el modelo se llama "Game", cambiá el string a "Game".
    Game = relationship("Games", back_populates="Communities_assoc", lazy="joined")
    """


# ================================================
# Back-populates en modelos existentes (referencia)
# (Poné esto en los modelos correspondientes si aún no lo tenés)
# ================================================
# En app/models/user.py añadí:
# Owned_communities = relationship("Community", back_populates="Owner")
# Community_memberships = relationship("Communitys_Members", back_populates="User", cascade="all, delete-orphan")

# En app/models/games.py (o como se llame tu modelo de juegos) añadí:
# Communities_assoc = relationship("Communitys_Games", back_populates="Game", cascade="all, delete-orphan")
