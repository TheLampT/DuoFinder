from fastapi import FastAPI
from app.routers import auth, user, match, chat, community

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/users", tags=["users"])
app.include_router(match.router, prefix="/matches", tags=["matches"])
app.include_router(chat.router, prefix="/chats", tags=["chats"])
app.include_router(community.router, prefix="/communities", tags=["communities"])

from app.routers import auth, user, match, chat, community
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, create_engine, select, func
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from dotenv import load_dotenv
from os import getenv

load_dotenv()
SECRET_KEY = getenv("SECRET_KEY")
DATABASE_URL = getenv("DATABASE_URL")


app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/users", tags=["users"])
app.include_router(match.router, prefix="/matches", tags=["matches"])
app.include_router(chat.router, prefix="/chats", tags=["chats"])
app.include_router(community.router, prefix="/communities", tags=["communities"])

# =========================
# CONFIG
# =========================
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI(title="DuoFinder API")

# =========================
# MODELOS ORM (según tu diagrama)
# =========================

class User(Base):
    __tablename__ = "User"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    Mail = Column(String(255), unique=True, index=True, nullable=False)
    Password = Column(String(255), nullable=False)
    Username = Column(String(100), unique=True, index=True, nullable=False)

    Bio = Column(String(500))
    BirthDate = Column(DateTime)
    Location = Column(String(120))
    Discord = Column(String(120))
    Tracker = Column(String(200))
    IsActive = Column(Boolean, nullable=False, server_default="1")

    CreatedAt = Column(DateTime, nullable=False, server_default=func.getdate())

    # Relaciones útiles
    images = relationship("UserImages", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("UserGamesSkill", back_populates="user", cascade="all, delete-orphan")
    sent_messages = relationship("Chat", back_populates="sender", foreign_keys="Chat.SenderID")

class Matches(Base):
    __tablename__ = "Matches"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    UserID1 = Column(Integer, ForeignKey("dbo.User.ID"), nullable=False)
    UserID2 = Column(Integer, ForeignKey("dbo.User.ID"), nullable=False)
    MatchDate = Column(DateTime, server_default=func.getdate())
    Status = Column(String(50))         # ej: 'active', 'blocked', etc.
    IsRanked = Column(Boolean, nullable=False, server_default="0")

    chat = relationship("Chat", back_populates="match", uselist=False)

class Chat(Base):
    __tablename__ = "Chat"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    MatchesID = Column(Integer, ForeignKey("dbo.Matches.ID"), nullable=False)
    SenderID = Column(Integer, ForeignKey("dbo.User.ID"), nullable=False)
    ContentChat = Column(Text, nullable=False)
    CreatedDate = Column(DateTime, nullable=False, server_default=func.getdate())
    Status = Column(String(50))      # ej: 'ok','deleted'
    ReadChat = Column(Boolean, nullable=False, server_default="0")

    match = relationship("Matches", back_populates="chat")
    sender = relationship("User", back_populates="sent_messages")

class UserImages(Base):
    __tablename__ = "User_Images"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    UserID = Column(Integer, ForeignKey("dbo.User.ID"), nullable=False)
    ImageURL = Column(String(500), nullable=False)
    IsPrimary = Column(Boolean, nullable=False, server_default="0")

    user = relationship("User", back_populates="images")

class Games(Base):
    __tablename__ = "Games"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    GenreId = Column(Integer, ForeignKey("dbo.MainGenre.ID"), nullable=True)
    RankId = Column(Integer, ForeignKey("dbo.Ranks.ID"), nullable=True)
    GameName = Column(String(200), nullable=False)
    Description = Column(Text)
    ReleaseYear = Column(Integer)

class MainGenre(Base):
    __tablename__ = "MainGenre"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    GenreName = Column(String(120), nullable=False, unique=True)

class Ranks(Base):
    __tablename__ = "Ranks"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    Rank = Column(String(120), nullable=False, unique=True)

class Tags(Base):
    __tablename__ = "Tags"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, index=True)
    TagName = Column(String(120), nullable=False, unique=True)

class GamesTags(Base):
    __tablename__ = "Games_Tags"
    __table_args__ = {"schema": "dbo"}

    GamesID = Column(Integer, ForeignKey("dbo.Games.ID"), primary_key=True)
    TagsID = Column(Integer, ForeignKey("dbo.Tags.ID"), primary_key=True)

class UserGamesSkill(Base):
    __tablename__ = "User_Games_Skill"
    __table_args__ = {"schema": "dbo"}

    UserID = Column(Integer, ForeignKey("dbo.User.ID"), primary_key=True)
    GameID = Column(Integer, ForeignKey("dbo.Games.ID"), primary_key=True)
    SkillLevel = Column(String(50))
    IsRanked = Column(Boolean, nullable=False, server_default="0")

    user = relationship("User", back_populates="skills")

# Base.metadata.create_all(bind=engine)  # usa migraciones en prod; habilitalo si es POC

# =========================
# SCHEMAS (Pydantic)
# =========================
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserPublic(BaseModel):
    ID: int
    Mail: EmailStr
    Username: str
    Bio: Optional[str] = None
    BirthDate: Optional[datetime] = None
    Location: Optional[str] = None
    Discord: Optional[str] = None
    Tracker: Optional[str] = None
    IsActive: bool

    class Config:
        from_attributes = True  # pydantic v2

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# =========================
# UTILS
# =========================
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(p: str) -> str:
    return pwd_context.hash(p)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# =========================
# REPO helpers
# =========================
def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.execute(select(User).where(User.Mail == email)).scalar_one_or_none()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.execute(select(User).where(User.Username == username)).scalar_one_or_none()

def create_user(db: Session, u: UserCreate) -> User:
    user = User(
        Mail=u.email,
        Username=u.username,
        Password=hash_password(u.password),
        IsActive=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# =========================
# AUTH CORE
# =========================
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")  # guardamos Mail aquí
        if sub is None:
            raise exc
    except JWTError:
        raise exc

    user = get_user_by_email(db, sub)
    if user is None or not user.IsActive:
        raise exc
    return user

# =========================
# ENDPOINTS
# =========================
@app.post("/register", response_model=UserPublic, status_code=201)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    if get_user_by_username(db, user_in.username):
        raise HTTPException(status_code=400, detail="Username ya registrado")
    return create_user(db, user_in)

@app.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Permitimos login por email o username
    user = get_user_by_email(db, form.username) or get_user_by_username(db, form.username)
    if not user or not verify_password(form.password, user.Password):
        raise HTTPException(status_code=400, detail="Credenciales inválidas")
    if not user.IsActive:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    token = create_access_token({"sub": user.Mail})
    return Token(access_token=token)

@app.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/protected")
def protected(_: User = Depends(get_current_user)):
    return {"ok": True}