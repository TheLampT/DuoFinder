# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import select

# Importo utilidades/definiciones desde main (ya tenés todo ahí)
from app.main import (
    get_db,                  # dependencia de sesión
    User,                    # modelo ORM dbo.User
    hash_password,           # hashing bcrypt
    verify_password,         # verificación bcrypt
    create_access_token      # genera JWT usando tu SECRET_KEY
)

router = APIRouter()

# ───────── Schemas de entrada ─────────
class RegisterInput(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginInput(BaseModel):
    email: EmailStr
    password: str

# ───────── Helpers locales ─────────
def get_user_by_email(db: Session, email: str):
    return db.execute(select(User).where(User.Mail == email)).scalar_one_or_none()

def get_user_by_username(db: Session, username: str):
    return db.execute(select(User).where(User.Username == username)).scalar_one_or_none()

# ───────── Endpoints ─────────
@router.post("/register", status_code=201)
def register_user(payload: RegisterInput, db: Session = Depends(get_db)):
    # Validaciones de unicidad
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    if get_user_by_username(db, payload.username):
        raise HTTPException(status_code=400, detail="Username ya registrado")

    # Crear y persistir usuario
    user = User(
        Mail=payload.email,
        Username=payload.username,
        Password=hash_password(payload.password),
        IsActive=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Devolver sin exponer el password
    return {
        "message": "User registered successfully",
        "user": {"id": user.ID, "email": user.Mail, "username": user.Username}
    }

@router.post("/login")
def login_user(payload: LoginInput, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.Password):
        raise HTTPException(status_code=400, detail="Credenciales inválidas")
    if not user.IsActive:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    token = create_access_token({"sub": user.Mail})
    return {"access_token": token, "token_type": "bearer"}
