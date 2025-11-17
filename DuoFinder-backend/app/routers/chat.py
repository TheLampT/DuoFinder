from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

@router.get("/{match_id}")
def get_chat(match_id: int):
    return [
        {"from": "player1", "message": "Hey!"},
        {"from": "player2", "message": "What’s up?"}
    ]

class ChatMessage(BaseModel):
    content: str

@router.post("/{match_id}")
def send_message(match_id: int, message: ChatMessage):
    return {"match_id": match_id, "message_sent": message.content}
