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

    # Subquery corregida para SQL Server
    from sqlalchemy import select
    swiped_subq = select(Matches.UserID2).where(Matches.UserID1 == my_id).scalar_subquery()

    # 1) Traer TODOS los juegos del usuario actual
    my_skills = db.query(
        UserGamesSkill.GameId,
        UserGamesSkill.IsRanked,
        UserGamesSkill.Game_rank_local_id
    ).filter(UserGamesSkill.UserID == current_user.ID).all()

    if not my_skills:
        return []  # sin juegos, no hay sugerencias

    # 2) Query base de candidatos - SIMPLIFICADA para evitar problemas de SQL Server
    # En lugar de hacer joins complejos, hagamos una query más simple
    q = (
        db.query(
            User.ID,
            User.Username,
            User.BirthDate,
            User.Bio,
            UserGamesSkill.GameId,
            UserGamesSkill.SkillLevel,
            UserGamesSkill.IsRanked,
            Games.GameName,
            UserImages.ImageURL,
        )
        .join(UserGamesSkill, User.ID == UserGamesSkill.UserID)
        .join(Games, UserGamesSkill.GameId == Games.ID)
        .outerjoin(UserImages, and_(UserImages.UserID == User.ID, UserImages.IsPrimary == True))
        .filter(
            User.ID != current_user.ID,
            User.IsActive == True,
            ~User.ID.in_(swiped_subq),
        )
        .distinct()  # Evitar duplicados por múltiples juegos
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

    # 5) ORDER BY y paginación
    q = q.order_by(User.ID)
    rows = q.offset(skip).limit(limit).all()

    # 6) Armar respuesta - ahora necesitamos agrupar por usuario
    user_cache = {}
    for row in rows:
        user_id = row.ID
        if user_id not in user_cache:
            user_cache[user_id] = {
                'id': user_id,
                'username': row.Username,
                'age': calculate_age(row.BirthDate),
                'image': row.ImageURL,
                'bio': row.Bio,
                'games': []
            }
        
        user_cache[user_id]['games'].append({
            'game': row.GameName,
            'skill': row.SkillLevel,
            'isRanked': bool(row.IsRanked)
        })

    # 7) Convertir a formato de respuesta
    out: List[Suggestion] = []
    for user_data in user_cache.values():
        # Tomar el primer juego para la respuesta (puedes ajustar esta lógica)
        primary_game = user_data['games'][0]
        out.append(
            Suggestion(
                id=user_data['id'],
                username=user_data['username'],
                age=user_data['age'],
                image=user_data['image'],
                bio=user_data['bio'],
                game=primary_game['game'],
                skill=primary_game['skill'],
                isRanked=primary_game['isRanked'],
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
                detail="No se pudi inferir el juego (0 o >1 en común). Enviá game_id.",
            )

    # calcular IsRanked del match: ambos deben ser ranked en ese juego
    my_ranked = db.query(UserGamesSkill.IsRanked).filter(
        UserGamesSkill.UserID == me, UserGamesSkill.GameId == selected_game_id
    ).scalar() or 0
    ot_ranked = db.query(UserGamesSkill.IsRanked).filter(
        UserGamesSkill.UserID == other, UserGamesSkill.GameId == selected_game_id
    ).scalar() or 0
    match_is_ranked = 1 if (my_ranked and ot_ranked) else 0

    # ---- USAR MERGE para manejar race conditions automáticamente ----
    # Primero intentar obtener el registro existente
    existing = db.query(Matches).filter(Matches.UserID1 == u_low, Matches.UserID2 == u_high).first()
    
    if existing:
        row = existing
        created_now = False
    else:
        # Crear un nuevo objeto
        row = Matches(
            UserID1=u_low,
            UserID2=u_high,
            MatchDate=datetime.utcnow(),
            Status=True,  # O cualquier valor apropiado como "active", "matched", etc.
            IsRanked=match_is_ranked,
        )
        created_now = True
    
    # Actualizar los campos de like
    if me == u_low:
        row.LikedByUser1 = bool(data.like)
    else:
        row.LikedByUser2 = bool(data.like)
    
    row.IsRanked = match_is_ranked
    
    # Usar merge para manejar la inserción o actualización
    try:
        row = db.merge(row)
        db.commit()
        db.refresh(row)
        
        # Verificar si es match
        is_match = bool(row.LikedByUser1 if row.LikedByUser1 is not None else False) and \
                   bool(row.LikedByUser2 if row.LikedByUser2 is not None else False)
        
        # Verificar si acaba de convertirse en match
        if is_match and created_now:
            # Crear chat si es un match nuevo
            existing_chat = db.query(Chat).filter(Chat.MatchesID == row.ID, Chat.Status == True).first()
            if not existing_chat:
                system_msg = Chat(
                    MatchesID=row.ID,
                    SenderID=me,
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
            "liked_by_low_high": [
                bool(row.LikedByUser1 if row.LikedByUser1 is not None else False),
                bool(row.LikedByUser2 if row.LikedByUser2 is not None else False)
            ],
            "game_id": selected_game_id,
            "is_ranked": bool(match_is_ranked),
            "created_now": created_now,
        }
        
    except Exception as e:
        db.rollback()
        print(f"ERROR en swipe: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar el swipe: {str(e)}"
        )
