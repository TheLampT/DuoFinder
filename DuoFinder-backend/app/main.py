# main.py  —  DuoFinder 

from datetime import datetime, timedelta
from typing import Optional
from os import getenv
from urllib.parse import quote_plus

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import (
    create_engine, select, func, text as sql_text,
    Column, Integer, String, Date, Boolean, DateTime
)
from datetime import date
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# ───────────────────────────
# Configuración (.env)
# ───────────────────────────
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Routers
from app.routers import auth, user, match, chat, community

from app.models.user import User

# =========================
# CONFIG
# =========================
load_dotenv()

SECRET_KEY  = getenv("SECRET_KEY", "dev-inseguro")
ALGORITHM   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

ODBC_DRIVER = getenv("ODBC_DRIVER", "ODBC Driver 18 for SQL Server")
SERVER      = getenv("SERVER", "")
DATABASE    = getenv("DATABASE", "")
USERNAME    = getenv("USERNAME", "")
PASSWORD    = getenv("PASSWORD", "")

# Cadena ODBC (escapada con quote_plus para manejar espacios/símbolos)
odbc_str = (
    f"Driver={{{ODBC_DRIVER}}};"
    f"Server=tcp:{SERVER},1433;"
    f"Database={DATABASE};"
    f"Uid={USERNAME};"
    f"Pwd={PASSWORD};"
    "Encrypt=yes;"
    "TrustServerCertificate=yes;"
    "Connection Timeout=30;"
).replace("{ODBC_DRIVER}", ODBC_DRIVER)

DATABASE_URL = "mssql+pyodbc:///?odbc_connect=" + quote_plus(odbc_str)

# ───────────────────────────
# SQLAlchemy
# ───────────────────────────
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=1800, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")  # ojo: ajustado a /auth/login


app = FastAPI(title="DuoFinder API")




# =========================
# UTILS
# =========================
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ───────────────────────────
# Seguridad (hash y JWT)
# ───────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")  # /login devuelve token

def hash_password(p: str) -> str:
    return pwd_context.hash(p)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, minutes: Optional[int] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=minutes or ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise cred_exc
    except JWTError:
        raise cred_exc
    user = db.execute(select(User).where(User.Mail == email)).scalar_one_or_none()
    if not user or not user.IsActive:
        raise cred_exc
    return user

# ───────────────────────────
# Schemas Pydantic
# ───────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"



# Helpers de acceso
def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.execute(select(User).where(User.Mail == email)).scalar_one_or_none()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.execute(select(User).where(User.Username == username)).scalar_one_or_none()



app.include_router(auth.router,      prefix="/auth",        tags=["auth"])
app.include_router(user.router,      prefix="/users",       tags=["users"])
app.include_router(match.router,     prefix="/matches",     tags=["matches"])
app.include_router(chat.router,      prefix="/chats",       tags=["chats"])
app.include_router(community.router, prefix="/communities", tags=["communities"])
