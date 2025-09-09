from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.connection import get_db
from app.models.user import User
from app.utils.security import hash_password, verify_password, create_access_token
from datetime import date
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.config import SECRET_KEY, ALGORITHM

router = APIRouter()

# ----- Schemas -----
class RegisterInput(BaseModel):
    username: str
    email: EmailStr
    password: str
    birthdate: date

class LoginInput(BaseModel):
    email: EmailStr
    password: str

# ----- Endpoints -----
@router.post("/register", status_code=201)
def register_user(user_in: RegisterInput, db: Session = Depends(get_db)):
    # validar email único
    exists = db.execute(select(User).where(User.Mail == user_in.email)).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    # crear usuario
    user = User(
        Mail=user_in.email,
        Username=user_in.username,
        Password=hash_password(user_in.password),
        BirthDate=user_in.birthdate,
        IsActive=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully", "id": user.ID, "email": user.Mail}

@router.post("/login")
def login_user(data: LoginInput, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.Mail == data.email)).scalar_one_or_none()
    if not user or not verify_password(data.password, user.Password):
        raise HTTPException(status_code=400, detail="Credenciales inválidas")
    if not user.IsActive:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    token = create_access_token({"sub": user.Mail})
    return {"access_token": token, "token_type": "bearer"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")  # o el path correcto a tu login

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.Mail == email).first()
    if user is None:
        raise credentials_exception

    return user
