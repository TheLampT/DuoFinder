from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

@router.get("/suggestions")
def get_match_suggestions():
    return [{"username": "player1"}, {"username": "player2"}]

class SwipeInput(BaseModel):
    target_user_id: int
    like: bool

@router.post("/swipe")
def swipe_user(data: SwipeInput):
    return {"message": "Swipe registered", "data": data}
