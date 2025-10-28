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
from app.models.game_ranks import GameRanks
from sqlalchemy import and_
from app.models.games import Games
from app.routers.auth import get_current_user
import os

SECRET_KEY = os.getenv("SECRET_KEY")

router = APIRouter()

def calculate_age(birthdate: Optional[date]) -> int:
    if not birthdate:
        return 0
    today = datetime.today()
    return today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))

class GameSkillUpdate(BaseModel):
    game_id: Optional[int] = None
    game_name: Optional[str] = None
    skill_level: Optional[str] = None
    is_ranked: Optional[bool] = None
    Game_rank_local_id: Optional[int] = None
    rank_name: Optional[str] = None


class UserProfile(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None 
    email: Optional[EmailStr] = None
    bio: Optional[str] = ""
    server: Optional[str] = None
    discord: Optional[str] = None
    tracker: Optional[str] = None
    birthdate: Optional[date] = None
    games: Optional[List[GameSkillUpdate]] = None

class UserProfileOut(BaseModel):
    username: str
    email: EmailStr
    bio: str
    server: Optional[str] = None
    discord: Optional[str] = None
    tracker: Optional[str] = None
    age: int
    games: List[GameSkillUpdate] = []


@router.get("/me", response_model=UserProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.ID == current_user.ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    rows = (
        db.query(
            UserGamesSkill.GameId.label("game_id"),
            UserGamesSkill.SkillLevel.label("skill_level"),
            UserGamesSkill.IsRanked.label("is_ranked"),
            UserGamesSkill.Game_rank_local_id.label("rank_local_id"),
            Games.GameName.label("game_name"),
            GameRanks.Rank_name.label("rank_name"),
        )
        .join(Games, UserGamesSkill.GameId == Games.ID)
        .outerjoin(
            GameRanks,
            and_(
                GameRanks.Game_id == UserGamesSkill.GameId,
                GameRanks.Local_rank_id == UserGamesSkill.Game_rank_local_id,
            ),
        )
        .filter(UserGamesSkill.UserID == current_user.ID)
        .all()
    )

    games_payload: List[GameSkillUpdate] = []
    for row in rows:
        games_payload.append(
            GameSkillUpdate(
                game_id=row.game_id,
                game_name=row.game_name,
                skill_level=row.skill_level,
                is_ranked=row.is_ranked,
                Game_rank_local_id=row.rank_local_id,
                rank_name= row.rank_name,
            )
        )

    return UserProfileOut(
        username=user.Username,
        email=user.Mail,
        bio=user.Bio or "",
        server=user.Server,
        discord=user.Discord,
        tracker=user.Tracker,
        age=calculate_age(user.BirthDate),
        games=games_payload,
    )
@router.put("/me")
def update_profile(
    profile: UserProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
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
        db.query(UserGamesSkill).filter(UserGamesSkill.UserID == current_user.ID).delete()

        for game in profile.games:
            user_game_skill = UserGamesSkill(
                UserID=current_user.ID,
                GameId=game.game_id,
                SkillLevel=game.skill_level,
                IsRanked=game.is_ranked,
                Game_rank_local_id=game.Game_rank_local_id
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

@router.get("/{user_id}", response_model=UserProfileOut)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.ID == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Traer los juegos del usuario con nombre del juego y rango
    rows = (
        db.query(
            UserGamesSkill.GameId.label("game_id"),
            UserGamesSkill.SkillLevel.label("skill_level"),
            UserGamesSkill.IsRanked.label("is_ranked"),
            UserGamesSkill.Game_rank_local_id.label("rank_local_id"),
            Games.GameName.label("game_name"),
            GameRanks.Rank_name.label("rank_name"),  # ← nombre del rango
        )
        .join(Games, UserGamesSkill.GameId == Games.ID)
        .outerjoin(
            GameRanks,
            and_(
                GameRanks.Game_id == UserGamesSkill.GameId,
                GameRanks.Local_rank_id == UserGamesSkill.Game_rank_local_id,
            ),
        )
        .filter(UserGamesSkill.UserID == user_id)
        .all()
    )

    games_payload: List[GameSkillUpdate] = []
    for r in rows:
        games_payload.append(
            GameSkillUpdate(
                game_id=r.game_id,
                game_name=r.game_name,
                skill_level=r.skill_level,
                is_ranked=r.is_ranked,
                Game_rank_local_id=r.rank_local_id,
                rank_name=r.rank_name,
            )
        )

    return UserProfileOut(
        username=user.Username,
        email=user.Mail,
        bio=user.Bio or "",
        server=user.Server,
        discord=user.Discord,
        tracker=user.Tracker,
        age=calculate_age(user.BirthDate),
        games=games_payload,
    )