from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.db.connection import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

# ----- SCHEMAS DE RESPUESTA -----
class GameSkillOut(BaseModel):
    game: str
    skill: str
    isRanked: bool

class UserProfileOut(BaseModel):
    id: int
    username: str
    age: int
    bio: Optional[str] = None
    image: Optional[str] = None
    discord: Optional[str] = None
    gameSkill: List[GameSkillOut]

# ----- ENDPOINT /me -----
@router.get("/me", response_model=UserProfileOut)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    # Calcular edad
    today = date.today()
    birthdate = current_user.BirthDate
    age = today.year - birthdate.year - (
        (today.month, today.day) < (birthdate.month, birthdate.day)
    )

    # Imagen primaria
    primary_image = None
    for img in current_user.images:
        if img.IsPrimary:
            primary_image = img.ImageURL
            break

    # Juegos + skill
    game_skill = []
    for gs in current_user.games:
        if gs.game and gs.game.Rank:
            game_skill.append({
                "game": gs.game.GameName,
                "skill": gs.game.Rank.Rank,
                "isRanked": gs.IsRanked
            })

    return {
        "id": current_user.ID,
        "username": current_user.Username,
        "age": age,
        "bio": current_user.Bio,
        "image": primary_image,
        "discord": current_user.Discord,
        "gameSkill": game_skill
    }
