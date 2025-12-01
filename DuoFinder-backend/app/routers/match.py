from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

from app.db.connection import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.user_images import UserImages
from app.models.user_game_skill import UserGamesSkill
from app.models.games import Games
from app.models.matches import Matches
from app.models.chat import Chat

router = APIRouter()

DISLIKE = 0
LIKE = 1


# -------------------- Schemas --------------------
class Suggestion(BaseModel):
    id: int
    username: str
    age: int
    image: Optional[str] = None
    bio: Optional[str] = None
    game: str
    skill: str
    isRanked: bool

    class Config:
        from_attributes = True


class SwipeInput(BaseModel):
    target_user_id: int
    like: bool
    game_id: Optional[int] = None  # opcional: si no viene, se infiere


# -------------------- Util --------------------
def calculate_age(birthdate: date) -> int:
    today = date.today()
    return today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))


# -------------------- Endpoints --------------------
@router.get("/suggestions", response_model=List[Suggestion])
def get_match_suggestions(
    server: Optional[str] = Query(None),
    is_ranked: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(5, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    
    my_id = current_user.ID

    # Subquery con los usuarios a los que YA hice swipe (cualquier status)
    from sqlalchemy import select
    
    swiped_subq = select(Matches.UserID2).where(Matches.UserID1 == my_id).scalar_subquery()
    
    # Otra alternativa:
    # swiped_subq = db.query(Matches.UserID2).filter(Matches.UserID1 == my_id).scalar_subquery()

    # 1) Traer TODOS los juegos del usuario actual
    my_skills = db.query(
        UserGamesSkill.GameId,
        UserGamesSkill.IsRanked,
        UserGamesSkill.Game_rank_local_id
    ).filter(UserGamesSkill.UserID == current_user.ID).all()

    if not my_skills:
        return []  # sin juegos, no hay sugerencias

    # 2) Query base de candidatos
    q = (
        db.query(
            User,
            UserGamesSkill,    # <- skills del candidato
            Games,
            UserImages.ImageURL.label("image_url"),
        )
        .join(UserGamesSkill, User.ID == UserGamesSkill.UserID)
        .join(Games, UserGamesSkill.GameId == Games.ID)
        .outerjoin(UserImages, and_(UserImages.UserID == User.ID, UserImages.IsPrimary == True))
        .filter(
            User.ID != current_user.ID,
            User.IsActive == True,
            ~User.ID.in_(swiped_subq),
        )
    )

    # 3) Armar condiciones dinámicas por cada juego propio
    conds = []
    for (g_id, my_ranked, my_local_rank_id) in my_skills:
        if my_ranked and my_local_rank_id is not None:
            # Ambos ranked y dentro de ±3
            conds.append(
                and_(
                    UserGamesSkill.GameId == g_id,
                    UserGamesSkill.IsRanked == True,
                    UserGamesSkill.Game_rank_local_id.between(
                        int(my_local_rank_id) - 3, int(my_local_rank_id) + 3
                    ),
                )
            )
        else:
            # Al menos uno no ranked: basta con compartir el juego
            conds.append(UserGamesSkill.GameId == g_id)

    q = q.filter(or_(*conds))

    # 4) Filtros opcionales
    if server is not None:
        q = q.filter(User.Server == server)
    if is_ranked is not None:
        q = q.filter(UserGamesSkill.IsRanked == is_ranked)

    rows = q.offset(skip).limit(limit).all()

    # 5) AGREGAR ORDER BY - Esto soluciona el error
    # Ordenar por ID de usuario para consistencia
    q = q.order_by(User.ID)

    rows = q.offset(skip).limit(limit).all()

    # 6) Armar respuesta
    out: List[Suggestion] = []
    for user, skill, game, image_url in rows:
        out.append(
            Suggestion(
                id=user.ID,
                username=user.Username,
                age=calculate_age(user.BirthDate),
                image=image_url,
                bio=user.Bio,
                game=game.GameName,
                skill=skill.SkillLevel,
                isRanked=bool(skill.IsRanked),
            )
        )
    return out


@router.post("/swipe")
def swipe_user(
    data: SwipeInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    me = current_user.ID
    other = data.target_user_id
    if me == other:
        raise HTTPException(status_code=400, detail="No podés hacer swipe contra vos mismo")

    # ---- pareja canónica ----
    u_low, u_high = (me, other) if me < other else (other, me)

    # ---- juego: usar el provisto o inferirlo ----
    selected_game_id: Optional[int] = data.game_id
    if selected_game_id is None:
        my_skills = db.query(UserGamesSkill.GameId, UserGamesSkill.IsRanked).filter(UserGamesSkill.UserID == me).all()
        ot_skills = db.query(UserGamesSkill.GameId, UserGamesSkill.IsRanked).filter(UserGamesSkill.UserID == other).all()

        my_ids = {g for g, _ in my_skills}
        ot_ids = {g for g, _ in ot_skills}
        common = my_ids & ot_ids

        if len(common) == 1:
            selected_game_id = next(iter(common))
        elif len(my_ids) == 1:
            selected_game_id = next(iter(my_ids))
        else:
            raise HTTPException(
                status_code=400,
                detail="No se pudo inferir el juego (0 o >1 en común). Enviá game_id.",
            )

    # calcular IsRanked del match: ambos deben ser ranked en ese juego
    my_ranked = db.query(UserGamesSkill.IsRanked).filter(
        UserGamesSkill.UserID == me, UserGamesSkill.GameId == selected_game_id
    ).scalar() or 0
    ot_ranked = db.query(UserGamesSkill.IsRanked).filter(
        UserGamesSkill.UserID == other, UserGamesSkill.GameId == selected_game_id
    ).scalar() or 0
    match_is_ranked = 1 if (my_ranked and ot_ranked) else 0

    # ---- obtener/crear fila canónica ----
    row = db.query(Matches).filter(Matches.UserID1 == u_low, Matches.UserID2 == u_high).first()
    created_now = False
    if not row:
        row = Matches(
            UserID1=u_low,
            UserID2=u_high,
            MatchDate=datetime.utcnow(),
            IsRanked=match_is_ranked,
            # GameID=selected_game_id,  # si tenés la columna
        )
        db.add(row)
        try:
            db.flush()
            created_now = True
        except IntegrityError:
            # carrera: otra instancia insertó; recuperar
            db.rollback()
            row = db.query(Matches).filter(Matches.UserID1 == u_low, Matches.UserID2 == u_high).first()

    # ---- actualizar like del lado correspondiente ----
    if me == u_low:
        row.LikedByUser1 = bool(data.like)
    else:
        row.LikedByUser2 = bool(data.like)

    # mantener metadatos
    row.IsRanked = match_is_ranked
    # if hasattr(row, "GameID"):
    #     row.GameID = selected_game_id

    # antes vs después para detectar "se armó el match"
    was_match = bool(getattr(row, "LikedByUser1")) and bool(getattr(row, "LikedByUser2"))

    db.commit()
    db.refresh(row)

    is_match = bool(row.LikedByUser1) and bool(row.LikedByUser2)

    # ---- crear chat solo una vez cuando aparece el match ----
    if not was_match and is_match:
        existing_chat = db.query(Chat).filter(Chat.MatchesID == row.ID, Chat.Status == True).first()
        if not existing_chat:
            system_msg = Chat(
                MatchesID=row.ID,
                SenderID=me,  # o None si permitís nulos
                ContentChat="¡Se creó el chat por match!",
                CreatedDate=datetime.utcnow(),
                Status=True,
                ReadChat=False,
            )
            db.add(system_msg)
            db.commit()
            db.refresh(system_msg)
            return {
                "message": "¡Es un match!",
                "match": True,
                "chat_id": system_msg.ID,
                "match_id": row.ID,
                "game_id": selected_game_id,
                "is_ranked": bool(match_is_ranked),
            }

    return {
        "message": "Swipe registrado/actualizado",
        "match": is_match,
        "match_id": row.ID,
        "liked_by_low_high": [bool(row.LikedByUser1), bool(row.LikedByUser2)],
        "game_id": selected_game_id,
        "is_ranked": bool(match_is_ranked),
        "created_now": created_now,
    }
