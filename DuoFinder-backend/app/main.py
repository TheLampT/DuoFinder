# main.py  —  DuoFinder (single file)

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
    Column, Integer, String, DateTime, Boolean
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# ───────────────────────────
# Configuración (.env)
# ───────────────────────────
from dotenv import load_dotenv
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

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ───────────────────────────
# Modelo ORM (dbo.User)
# ───────────────────────────
class User(Base):
    __tablename__ = "User"
    __table_args__ = {"schema": "dbo"}

    ID         = Column(Integer, primary_key=True, index=True)
    Mail       = Column(String(255), unique=True, index=True, nullable=False)
    Password   = Column(String(255), nullable=False)
    Username   = Column(String(100), unique=True, index=True, nullable=False)
    Bio        = Column(String(500))
    BirthDate  = Column(DateTime)
    Location   = Column(String(120))
    Discord    = Column(String(120))
    Tracker    = Column(String(200))
    IsActive   = Column(Boolean, nullable=False, server_default="1")
    CreatedAt  = Column(DateTime, nullable=False, server_default=func.getdate())

# Base.metadata.create_all(bind=engine)  # solo para POC. En prod: Alembic.

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
class RegisterIn(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserPublic(BaseModel):
    ID: int
    Mail: EmailStr
    Username: str
    IsActive: bool
    class Config:
        from_attributes = True  # pydantic v2

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ───────────────────────────
# FastAPI
# ───────────────────────────
app = FastAPI(title="DuoFinder API (single-file)")

@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(sql_text("SELECT 1"))
        return {"ok": True}
    except Exception as e:
        raise HTTPException(500, f"DB error: {e}")

# Helpers de acceso
def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.execute(select(User).where(User.Mail == email)).scalar_one_or_none()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.execute(select(User).where(User.Username == username)).scalar_one_or_none()

# ───────── Endpoints ─────────
@app.post("/register", response_model=UserPublic, status_code=201)
def register(user_in: RegisterIn, db: Session = Depends(get_db)):
    if get_user_by_email(db, user_in.email):
        raise HTTPException(400, "Email ya registrado")
    if get_user_by_username(db, user_in.username):
        raise HTTPException(400, "Username ya registrado")

    user = User(
        Mail=user_in.email,
        Username=user_in.username,
        Password=hash_password(user_in.password),
        IsActive=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Permitimos login por email o username en "username"
    user = get_user_by_email(db, form.username) or get_user_by_username(db, form.username)
    if not user or not verify_password(form.password, user.Password):
        raise HTTPException(400, "Credenciales inválidas")
    if not user.IsActive:
        raise HTTPException(403, "Usuario inactivo")

    token = create_access_token({"sub": user.Mail})
    return Token(access_token=token)

@app.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return current_user
