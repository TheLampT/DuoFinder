from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import date

from app.models.user import User
from app.models.user_images import UserImages
from app.models.user_game_skill import UserGamesSkill
from app.models.games import Games
from app.routers.auth import get_current_user
from app.db.connection import get_db

router = APIRouter()

# ==== Schemas ====

class Suggestion(BaseModel):
    id: int
    username: str
    age: int
    image: str
    bio: str | None
    game: str
    skill: str
    isRanked: bool

    class Config:
        from_attributes = True

class SwipeInput(BaseModel):
    target_user_id: int
    like: bool

# ==== Utilidades ====

def calculate_age(birthdate: date) -> int:
    today = date.today()
    return today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))

# ==== Endpoints ====

@router.get("/suggestions", response_model=List[Suggestion])
def get_match_suggestions(
    game_id: int = Query(..., description="ID of the game to find matches for"),
    server: str | None = Query(None, description="Optional server filter"),
    is_ranked: bool | None = Query(None, description="Optional ranked filter"),
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(5, ge=1, le=50, description="Number of records to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(User, UserGamesSkill, Games)\
        .join(UserGamesSkill, User.ID == UserGamesSkill.UserID)\
        .join(Games, UserGamesSkill.GameID == Games.ID)\
        .filter(
            User.ID != current_user.ID,
            User.IsActive == True,
            User.Server == server,
            UserGamesSkill.GameID == game_id,
            UserGamesSkill.IsRanked == is_ranked
        )\
        .offset(skip)\
        .limit(limit)

    results = query.all()

    suggestions = []
    for user, skill, game, image in results:
        suggestions.append({
            "id": user.ID,
            "username": user.Username,
            'images': image.ImageURL,
            "age": calculate_age(user.BirthDate),
            "bio": user.Bio,
            "game": game.GameName,
            "skill": skill.SkillLevel,
            "isRanked": skill.IsRanked
        })

    return suggestions

@router.post("/swipe")
def swipe_user(data: SwipeInput):
    # A implementar más adelante: lógica para registrar like/dislike
    return {"message": "Swipe registrado", "data": data}
