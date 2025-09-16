from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CommunityBase(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_private: bool
    created_at: datetime

class Community(CommunityBase):
    pass

class MyCommunity(CommunityBase):
    role: str

class CommunityList(BaseModel):
    items: list[Community]
    total: int
    limit: int
    offset: int

class JoinResponse(BaseModel):
    community_id: int
    joined: bool           # True si se insertó, False si ya era miembro
    message: str