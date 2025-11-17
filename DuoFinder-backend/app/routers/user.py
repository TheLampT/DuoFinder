from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
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
from sqlalchemy.orm import noload

SECRET_KEY = os.getenv("SECRET_KEY")

router = APIRouter()

def calculate_age(birthdate: Optional[date]) -> int:
    if not birthdate:
        return 0
    today = datetime.today()
    return today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))

# ===================== Schemas =====================

class GameSkillUpdate(BaseModel):
    game_id: Optional[int] = None
    game_name: Optional[str] = None
    skill_level: Optional[str] = None
    is_ranked: Optional[bool] = None
    game_rank_local_id: Optional[int] = Field(default=None, alias="game_rank_local_id")
    rank_name: Optional[str] = None

    class Config:
        populate_by_name = True  # permite usar ya sea game_rank_local_id o Game_rank_local_id al parsear

class UserImageOut(BaseModel):
    id: int
    url: str
    is_primary: bool

class ProfileImage(BaseModel):
    url: str
    is_primary: bool = False

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
    images: Optional[List[ProfileImage]] = None  # Lista de URLs de imágenes

class UserProfileOut(BaseModel):
    username: str
    email: EmailStr
    bio: str
    server: Optional[str] = None
    discord: Optional[str] = None
    tracker: Optional[str] = None
    age: int
    games: List[GameSkillUpdate] = []
    images: List[UserImageOut]


# ===================== Endpoints =====================

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
                game_rank_local_id=row.rank_local_id,  # ← schema snake_case
                rank_name=row.rank_name,
            )
        )
    image_rows = (
        db.query(UserImages)
        .filter(UserImages.UserID == current_user.ID)
        .all()
    )

    images_payload: List[UserImageOut] = [
        UserImageOut(
            id=img.ID,
            url=img.ImageURL,
            is_primary=img.IsPrimary,
        )
        for img in image_rows
    ]

    return UserProfileOut(
        username=user.Username,
        email=user.Mail,
        bio=user.Bio or "",
        server=user.Server,
        discord=user.Discord,
        tracker=user.Tracker,
        age=calculate_age(user.BirthDate),
        games=games_payload,
        images=images_payload,
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
        UpdatedPassword = hash_password(profile.password)
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
        # 1) Borrar skills previas del usuario (sin sincronizar sesión para evitar flushes intermedios)
        db.query(UserGamesSkill).filter(
            UserGamesSkill.UserID == current_user.ID
        ).delete(synchronize_session=False)

        # 2) Evitar autoflush durante validaciones/consultas auxiliares
        with db.no_autoflush:
            for g in (profile.games or []):
                # Inicializar SIEMPRE
                local_id = g.game_rank_local_id  # soporta alias Game_rank_local_id por el schema
                is_ranked = bool(g.is_ranked)

                if not is_ranked:
                    # No ranked => forzar NULL
                    local_id = None
                else:
                    # Si es ranked y no vino local_id pero sí rank_name, derivarlo
                    if local_id is None and g.rank_name:
                        local_id = (
                            db.query(GameRanks.Local_rank_id)
                            .options(noload("*"))  # evita cargas de relaciones que disparen selectin
                            .filter(
                                GameRanks.Game_id == g.game_id,
                                GameRanks.Rank_name == g.rank_name
                            )
                            .scalar()
                        )

                    # Validar existencia del par (game_id, local_id) en Game_ranks
                    if local_id is None:
                        raise HTTPException(
                            status_code=400,
                            detail=f"is_ranked=true requiere game_rank_local_id válido (o rank_name válido) para game_id={g.game_id}"
                        )

                    exists = (
                        db.query(GameRanks)
                        .options(noload("*"))
                        .filter(
                            GameRanks.Game_id == g.game_id,
                            GameRanks.Local_rank_id == local_id
                        )
                        .first()
                    )
                    if not exists:
                        raise HTTPException(
                            status_code=400,
                            detail=f"El par (game_id={g.game_id}, local_rank_id={local_id}) no existe en Game_ranks"
                        )

                # Insertar el registro normalizado
                rec = UserGamesSkill(
                    UserID=current_user.ID,
                    GameId=g.game_id,
                    SkillLevel=g.skill_level,
                    IsRanked=is_ranked,
                    Game_rank_local_id=local_id
                )
                db.add(rec)

    if profile.images is not None:
        db.query(UserImages).filter(
            UserImages.UserID == current_user.ID
        ).delete(synchronize_session=False)

        images_in = profile.images or []

        # 2) Si ninguna viene marcada como primaria, marco la primera como primaria
        has_primary = any(img.is_primary for img in images_in)

        for idx, img in enumerate(images_in):
            rec_img = UserImages(
                UserID=current_user.ID,
                ImageURL=img.url,
                IsPrimary=img.is_primary if has_primary else (idx == 0)
            )
            db.add(rec_img)

    db.commit()
    db.refresh(current_user)

    user_images = (
        db.query(UserImages)
        .filter(UserImages.UserID == current_user.ID)
        .order_by(UserImages.ID)
        .all()
    )

    primary_image_url = None
    for ui in user_images:
        if ui.IsPrimary:
            primary_image_url = ui.ImageURL
            break

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
            "primary_image_url": primary_image_url,
            "images": [{"id": ui.ID, "url": ui.ImageURL, "is_primary": ui.IsPrimary} for ui in user_images]
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
                game_rank_local_id=r.rank_local_id,  # ← schema snake_case
                rank_name=r.rank_name,
            )
        )

    image_rows = (
        db.query(UserImages)
        .filter(UserImages.UserID == user_id)
        .all()
    )

    images_payload: List[UserImageOut] = [
        UserImageOut(
            id=img.ID,
            url=img.ImageURL,
            is_primary=img.IsPrimary,
        )
        for img in image_rows
    ]

    return UserProfileOut(
        username=user.Username,
        email=user.Mail,
        bio=user.Bio or "",
        server=user.Server,
        discord=user.Discord,
        tracker=user.Tracker,
        age=calculate_age(user.BirthDate),
        games=games_payload,
        images=images_payload
        
    )
