from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Optional
from app.utils.security import hash_password

from app.db.connection import get_db
from app.models.user import User
from app.models.user_images import UserImages
from app.models.user_game_skill import UserGamesSkill
from app.models.games import Games
from app.routers.auth import get_current_user
import os

SECRET_KEY = os.getenv("SECRET_KEY")

router = APIRouter()

def calculate_age(birthdate: date) -> int:
    today = datetime.today()
    return today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))

class GameSkillUpdate(BaseModel):
    game_id: Optional[int] = None
    skill_level: Optional[str] = None
    is_ranked: Optional[bool] = None
    game_rank_local_id: Optional[int] = None

class UserProfile(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    bio: Optional[str] = ""
    server: Optional[str] = None
    discord: Optional[str] = None
    tracker: Optional[str] = None
    birthdate: Optional[date] = None
    games: Optional[List[GameSkillUpdate]] = None

class UserProfileOut(UserProfile):
    age: int



@router.get("/me", response_model=UserProfileOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.Username,
        "email": current_user.Mail,
        "bio": current_user.Bio or "",
        "age": calculate_age(current_user.BirthDate),
    }

@router.put("/me")
def update_profile(
    profile: UserProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    # Actualiza solo si se pasó un valor
    if profile.username is not None:
        current_user.Username = profile.username
    if profile.password is not None:
        UpdatedPassword=hash_password(profile.password)
        current_user.Password = UpdatedPassword
    if profile.bio is not None:
        current_user.Bio = profile.bio
    if profile.server is not None:
        current_user.Server = profile.server
    if profile.discord is not None:
        current_user.Discord = profile.discord
    if profile.tracker is not None:
        current_user.Tracker = profile.tracker
    if profile.birthdate is not None:
        current_user.BirthDate = profile.birthdate

    if profile.games is not None:
        # Primero eliminamos los juegos anteriores del usuario
        db.query(UserGamesSkill).filter(UserGamesSkill.UserID == current_user.ID).delete()

        # Luego insertamos los nuevos juegos
        for game in profile.games:
            user_game_skill = UserGamesSkill(
                UserID=current_user.ID,
                GameId=game.game_id,
                SkillLevel=game.skill_level,
                IsRanked=game.is_ranked,
                Game_rank_local_id=game.game_rank_local_id
            )
            db.add(user_game_skill)

    

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Perfil actualizado",
        "new_profile": {
            "username": current_user.Username,
            "email": current_user.Mail,
            "bio": current_user.Bio,
            "server": current_user.Server,
            "discord": current_user.Discord,
            "tracker": current_user.Tracker,
            "birthdate": str(current_user.BirthDate),
        }
    }


@router.delete("/me")
def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.IsActive = False
    db.commit()
    return {"message": "Cuenta eliminada exitosamente"}

@router.get("/{user_id}")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.ID == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    image = db.query(UserImages).filter(
        UserImages.UserID == user_id
    ).first()
    image_url = image.Url if image else None

    skills = db.query(UserGamesSkill, Games).join(Games, UserGamesSkill.GameID == Games.ID).filter(
        UserGamesSkill.UserID == user_id
    ).all()

    game_skill = [
        {
            "game": game.Name,
            "skill": skill.SkillLevel,
            "isRanked": skill.IsRanked
        }
        for skill, game in skills
    ]

    return {
        "id": str(user.ID),
        "username": user.Username,
        "age": calculate_age(user.BirthDate),
        "bio": user.Bio or "",
        "image": image_url,
        "server": user.Server,
        "discord": user.Discord,
        "gameSkill": game_skill
    }
