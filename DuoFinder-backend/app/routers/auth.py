from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

router = APIRouter()

class RegisterInput(BaseModel):
    username: str
    email: EmailStr
    password: str

@router.post("/register")
def register_user(user: RegisterInput):
    return {"message": "User registered successfully", "user": user}

class LoginInput(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
def login_user(data: LoginInput):
    return {"message": "Login successful", "email": data.email}
