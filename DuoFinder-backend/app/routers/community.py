from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional
from app.schemas.community import CommunityList, Community, MyCommunity, JoinResponse

from app.db.connection import get_db
from app.models.user import User
from app.models.user_images import UserImages
from app.models.user_game_skill import UserGamesSkill
from app.models.games import Games
from app.routers.auth import get_current_user

# Dep. de ejemplo (ajustá a tu proyecto)
def get_db():
    # return pyodbc.connect(...)
    ...

class CurrentUser:
    id: int

def get_current_user() -> CurrentUser:
    # Decodifica JWT y devuelve user con id
    ...

router = APIRouter(prefix="/communities", tags=["communities"])

@router.get("/", response_model=CommunityList)
def get_all_communities(
    q: Optional[str] = Query(None, description="Búsqueda por nombre/descr"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db = Depends(get_db)
):
    repo = CommunityRepository(db)
    service = CommunityService(repo)
    items, total = service.list(limit=limit, offset=offset, q=q)
    return {"items": items, "total": total, "limit": limit, "offset": offset}

@router.post("/join/{community_id}", response_model=JoinResponse, status_code=status.HTTP_200_OK)
def join_community(
    community_id: int,
    user: CurrentUser = Depends(get_current_user),
    db = Depends(get_db)
):
    repo = CommunityRepository(db)
    service = CommunityService(repo)
    inserted, msg = service.join(community_id=community_id, user_id=user.id)
    if msg == "Community not found":
        raise HTTPException(status_code=404, detail=msg)
    return {"community_id": community_id, "joined": inserted, "message": msg}

@router.get("/my", response_model=list[MyCommunity])
def get_my_communities(
    user: CurrentUser = Depends(get_current_user),
    db = Depends(get_db)
):
    repo = CommunityRepository(db)
    service = CommunityService(repo)
    return service.list_my(user_id=user.id)

"""
@router.get("/")
def get_all_communities():
    return [
        {"id": 1, "name": "Valorant"},
        {"id": 2, "name": "League of Legends"}
    ]

@router.post("/join/{community_id}")
def join_community(community_id: int):
    return {"message": f"Joined community {community_id}"}

@router.get("/my")
def get_my_communities():
    return [{"id": 2, "name": "League of Legends"}]
"""
class CommunityEdit(BaseModel):
    name: str
    description: str

@router.post("/admin/create")
def create_community(data: CommunityEdit):
    return {"message": "Community created", "data": data}

@router.post("/admin/{id}/edit")
def edit_community(id: int, data: CommunityEdit):
    return {"message": f"Community {id} updated", "new_data": data}

@router.delete("/admin/{id}")
def delete_community(id: int):
    return {"message": f"Community {id} deleted successfully"}