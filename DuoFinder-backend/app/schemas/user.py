from pydantic import BaseModel
from typing import List

class GameSkillOut(BaseModel):
    game: str
    skill: str
    isRanked: bool

class UserProfileOut(BaseModel):
    id: int
    username: str
    age: int
    bio: str | None
    image: str | None
    discord: str | None
    gameSkill: List[GameSkillOut]
