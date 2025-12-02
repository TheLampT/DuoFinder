# app/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from datetime import datetime

from app.db.connection import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.chat import Chat
from app.models.matches import Matches  # asegúrate de tener este modelo

router = APIRouter(prefix="/chats", tags=["chats"])


# ---------- Schemas ----------
class ChatMessageIn(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class ChatMessageOut(BaseModel):
    id: int
    match_id: int
    sender_id: int
    content: str
    created_at: datetime
    read: bool

    @classmethod
    def from_model(cls, m: Chat) -> "ChatMessageOut":
        return cls(
            id=m.ID,
            match_id=m.MatchesID,
            sender_id=m.SenderID,
            content=m.ContentChat,
            created_at=m.CreatedDate,
            read=bool(m.ReadChat),
        )

class ChatInfo(BaseModel):
    last_message: str | None  # El contenido del último mensaje
    unread_count: int  # Número de mensajes no leídos

    class Config:
        orm_mode = True

# ---------- Helpers ----------
def _assert_user_in_match(db: Session, match_id: int, user_id: int) -> Matches:
    match = db.query(Matches).filter(Matches.ID == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match no encontrado")
    # Ajusta estos nombres si tu modelo difiere (UserID1 / UserID2)
    if user_id not in {match.UserID1, match.UserID2}:
        raise HTTPException(status_code=403, detail="No perteneces a este chat")
    return match


# ---------- Endpoints ----------

@router.get("/{match_id}/info", response_model=ChatInfo)
def get_chat_info(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Devuelve la información del chat: último mensaje y contador de mensajes no leídos.
    """
    # Verificar que el usuario esté en el match
    _assert_user_in_match(db, match_id, current_user.ID)

    # Obtener el último mensaje del chat
    last_message = db.query(Chat).filter(Chat.MatchesID == match_id).order_by(desc(Chat.CreatedDate)).first()
    last_message_content = last_message.ContentChat if last_message else None

    # Contar los mensajes no leídos para el usuario actual
    unread_count = db.query(Chat).filter(
        Chat.MatchesID == match_id,
        Chat.ReadChat == False,
        Chat.SenderID != current_user.ID
    ).count()

    return ChatInfo(
        last_message=last_message_content,
        unread_count=unread_count
    )

@router.get("/{match_id}", response_model=list[ChatMessageOut])
def get_chat(
    match_id: int,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Devuelve los mensajes del chat (orden ascendente por fecha).
    Paginado simple con limit/offset.
    """
    _assert_user_in_match(db, match_id, current_user.ID)

    rows = (
        db.query(Chat)
        .filter(Chat.MatchesID == match_id)
        .order_by(asc(Chat.CreatedDate))
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [ChatMessageOut.from_model(r) for r in rows]


@router.post("/{match_id}", response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    match_id: int,
    message: ChatMessageIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Inserta un mensaje nuevo en el chat perteneciente al match dado.
    """
    _assert_user_in_match(db, match_id, current_user.ID)

    # Crear registro
    row = Chat(
        MatchesID=match_id,
        SenderID=current_user.ID,
        ContentChat=message.content.strip(),
        CreatedDate=datetime.utcnow(),
        Status="sent",
        ReadChat=False,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ChatMessageOut.from_model(row)