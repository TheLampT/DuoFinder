# app/routers/community.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.user import User
from app.models.community import Community
from app.models.communitys_members import CommunitysMembers
from app.models.communitys_games import CommunitysGames

from app.models.games import Games
from app.routers.auth import get_current_user

router = APIRouter(prefix="/communities", tags=["communities"])

# -----------------------
# Pydantic Schemas
# -----------------------
class CommunityCreate(BaseModel):
    name: str
    info: Optional[str] = None
    is_public: bool = True
    game_ids: Optional[List[int]] = None  # opcional para asociar juegos al crear

class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    info: Optional[str] = None
    is_public: Optional[bool] = None
    game_ids: Optional[List[int]] = None  # si viene, reemplaza asociaciones

class CommunityOut(BaseModel):
    id: int
    name: str
    info: Optional[str] = None
    is_public: bool
    owner_user_id: int

class MyCommunityOut(CommunityOut):
    role: str

class CommunityList(BaseModel):
    items: List[CommunityOut]
    total: int
    limit: int
    offset: int


# -----------------------
# Helpers
# -----------------------
def _community_to_out(c: Community) -> CommunityOut:
    return CommunityOut(
        id=c.ID,
        name=c.Community_name,
        info=c.Info,
        is_public=bool(c.Is_public),
        owner_user_id=c.Owner_user_id,
    )

def _ensure_games_exist(db: Session, game_ids: List[int]):
    if not game_ids:
        return
    existing = {g[0] for g in db.query(Games.ID).filter(Games.ID.in_(game_ids)).all()}
    missing = set(game_ids) - existing
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Game IDs not found: {sorted(list(missing))}"
        )

def _is_owner(user_id: int, community: Community) -> bool:
    return community.Owner_user_id == user_id


# -----------------------
# Endpoints
# -----------------------

@router.post("/", response_model=CommunityOut, status_code=status.HTTP_201_CREATED)
def create_community(
    payload: CommunityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # nombre único
    exists = db.query(Community).filter(
        Community.Community_name == payload.name
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail="Community name already exists")

    # validar juegos (opcional)
    if payload.game_ids:
        _ensure_games_exist(db, payload.game_ids)

    c = Community(
        Community_name=payload.name,
        Info=payload.info,
        Owner_user_id=current_user.ID,
        Is_public=payload.is_public,
    )
    db.add(c)
    db.flush()  # para obtener c.ID

    # agregar owner como miembro (role=owner)
    db.add(CommunitysMembers(
        Community_id=c.ID,
        User_id=current_user.ID,
        Role="owner",
    ))

    # asociar juegos si viene
    if payload.game_ids:
        for gid in set(payload.game_ids):
            db.add(CommunitysGames(Community_id=c.ID, Game_id=gid))

    db.commit()
    db.refresh(c)
    return _community_to_out(c)


@router.put("/{community_id}", response_model=CommunityOut)
def update_community(
    community_id: int,
    payload: CommunityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c: Community | None = db.query(Community).filter(Community.ID == community_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Community not found")

    if not _is_owner(current_user.ID, c):
        raise HTTPException(status_code=403, detail="Only the owner can modify the community")

    # si cambia nombre, chequear unicidad
    if payload.name and payload.name != c.Community_name:
        name_taken = db.query(Community).filter(
            Community.Community_name == payload.name,
            Community.ID != c.ID
        ).first()
        if name_taken:
            raise HTTPException(status_code=409, detail="Community name already exists")
        c.Community_name = payload.name

    if payload.info is not None:
        c.Info = payload.info

    if payload.is_public is not None:
        c.Is_public = payload.is_public

    # reemplazar asociaciones de juegos si viene game_ids
    if payload.game_ids is not None:
        _ensure_games_exist(db, payload.game_ids)
        # borrar actuales
        db.query(CommunitysGames).filter(
            CommunitysGames.Community_id == c.ID
        ).delete(synchronize_session=False)
        # insertar nuevas (sin duplicados)
        for gid in set(payload.game_ids):
            db.add(CommunitysGames(Community_id=c.ID, Game_id=gid))

    db.commit()
    db.refresh(c)
    return _community_to_out(c)


@router.delete("/{community_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_community(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c: Community | None = db.query(Community).filter(Community.ID == community_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Community not found")

    if not _is_owner(current_user.ID, c):
        raise HTTPException(status_code=403, detail="Only the owner can delete the community")

    # Si no tenés cascada en el modelo, borro explícitamente las dependencias
    db.query(CommunitysMembers).filter(CommunitysMembers.Community_id == c.ID).delete(synchronize_session=False)
    db.query(CommunitysGames).filter(CommunitysGames.Community_id == c.ID).delete(synchronize_session=False)

    db.delete(c)
    db.commit()
    return


@router.get("/", response_model=CommunityList)
def get_all_communities(
    q: Optional[str] = Query(None, description="Búsqueda por nombre o info"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Community)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Community.Community_name.ilike(like)) | (Community.Info.ilike(like))
        )

    total = query.count()
    items = query.order_by(Community.Created_date.desc()) \
                 .offset(offset).limit(limit).all()

    return CommunityList(
        items=[_community_to_out(c) for c in items],
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/my", response_model=List[MyCommunityOut])
def get_my_communities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Community, CommunitysMembers.Role)
        .join(CommunitysMembers, CommunitysMembers.Community_id == Community.ID)
        .filter(CommunitysMembers.User_id == current_user.ID)
        .order_by(Community.Community_name.asc())
        .all()
    )
    result: List[MyCommunityOut] = []
    for c, role in rows:
        result.append(MyCommunityOut(
            id=c.ID,
            name=c.Community_name,
            info=c.Info,
            is_public=bool(c.Is_public),
            owner_user_id=c.Owner_user_id,
            role=role,
        ))
    return result


@router.post("/{community_id}/join", status_code=status.HTTP_200_OK)
def join_community(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verificar si la comunidad existe
    community = db.query(Community).filter(Community.ID == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Verificar si el usuario ya es miembro de la comunidad
    existing_member = db.query(CommunitysMembers).filter(
        CommunitysMembers.Community_id == community_id,
        CommunitysMembers.User_id == current_user.ID
    ).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="Already a member of this community")

    # Agregar al usuario como miembro (con rol "member")
    new_member = CommunitysMembers(
        Community_id=community_id,
        User_id=current_user.ID,
        Role="member"  # O el rol que quieras asignar
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return {"message": f"User {current_user.username} successfully joined the community."}

@router.post("/{community_id}/leave", status_code=status.HTTP_200_OK)
def leave_community(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verificar si la comunidad existe
    community = db.query(Community).filter(Community.ID == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Verificar si el usuario es miembro de la comunidad
    member = db.query(CommunitysMembers).filter(
        CommunitysMembers.Community_id == community_id,
        CommunitysMembers.User_id == current_user.ID
    ).first()
    if not member:
        raise HTTPException(status_code=400, detail="Not a member of this community")

    # Eliminar al usuario de la comunidad
    db.delete(member)
    db.commit()

    return {"message": f"User {current_user.username} successfully left the community."}