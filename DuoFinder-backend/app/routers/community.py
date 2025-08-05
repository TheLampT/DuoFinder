from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

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