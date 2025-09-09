from app.models import Chat,GamesTags,Games,MainGenre,Matches,Ranks,Tags,UserGamesSkill,UserImages,User
from sqlalchemy.orm import relationship

#Chat
match = relationship("Matches", back_populates="chat")
sender = relationship("User", back_populates="sent_messages")

#Matches
chat = relationship("Chat", back_populates="match", uselist=False)

#UserGamesSkill
user = relationship("User", back_populates="skills")

#UserImages
user = relationship("User", back_populates="images")

#User
images = relationship("UserImages", back_populates="user", cascade="all, delete-orphan")
skills = relationship("UserGamesSkill", back_populates="user", cascade="all, delete-orphan")
sent_messages = relationship("Chat", back_populates="sender", foreign_keys="Chat.SenderID", cascade="all, delete-orphan")
