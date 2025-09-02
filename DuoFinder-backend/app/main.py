# app/main.py
from datetime import datetime, timedelta
from typing import Optional
from os import getenv

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Text,
    create_engine, select, func, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Routers
from app.routers import auth, user, match, chat, community

from app.models.user import User

# =========================
# CONFIG
# =========================
load_dotenv()
SECRET_KEY = getenv("SECRET_KEY")
DATABASE_URL = getenv("DATABASE_URL")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")  # ojo: ajustado a /auth/login

# =========================
# APP (solo una vez)
# =========================
app = FastAPI(title="DuoFinder API")


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
        from_attributes = True


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
        sub = payload.get("sub")
        if sub is None:
            raise exc
    except JWTError:
        raise exc

    user = get_user_by_email(db, sub)
    if user is None or not user.IsActive:
        raise exc
    return user


# =========================
# INCLUDE ROUTERS (al final)
# =========================

@app.get("/")
def read_root():
    return {"message": "DuoFinder API funcionando ✅"}

app.include_router(auth.router,      prefix="/auth",        tags=["auth"])
app.include_router(user.router,      prefix="/users",       tags=["users"])
app.include_router(match.router,     prefix="/matches",     tags=["matches"])
app.include_router(chat.router,      prefix="/chats",       tags=["chats"])
app.include_router(community.router, prefix="/communities", tags=["communities"])