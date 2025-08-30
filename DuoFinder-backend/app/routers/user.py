from fastapi import Depends, HTTPException, status
from app.routers.auth import get_current_user  # ajustá el import según tu estructura
from sqlalchemy.orm import Session
from app.db.connection import get_db  # si usás SQLAlchemy
from app.models.user import User  # tu modelo real de usuarios
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter

router = APIRouter()

class UserProfile(BaseModel):
    username: str
    email: str
    bio: str = ""

@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.Username,
        "email": current_user.Mail,
        "bio": current_user.Bio or ""
    }


@router.put("/me")
def update_profile(
    profile: UserProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.username = profile.username
    current_user.email = profile.email
    current_user.bio = profile.bio

    db.commit()
    db.refresh(current_user)

    return {"message": "Perfil actualizado", "new_profile": profile}

@router.delete("/me")
def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.delete(current_user)
    db.commit()
    return {"message": "Cuenta eliminada exitosamente"}



