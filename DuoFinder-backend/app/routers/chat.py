# app/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc, and_
from datetime import datetime
from typing import Optional, List

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
    partner_id: int
    partner_username: str
    last_message: Optional[str]
    unread_count: int

class ChatThreadOut(BaseModel):
    partner_id: int
    partner_username: str
    messages: List[ChatMessageOut]

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
    # 1) Verificar pertenencia y recuperar el match
    match = _assert_user_in_match(db, match_id, current_user.ID)

    # 2) Determinar el "otro" usuario
    partner_id = match.UserID2 if current_user.ID == match.UserID1 else match.UserID1
    partner = db.query(User.ID, User.Username).filter(User.ID == partner_id).first()
    partner_username = partner.Username if partner else "(usuario)"

    # 3) Último mensaje del chat
    last_message_row = (
        db.query(Chat)
          .filter(Chat.MatchesID == match_id)
          .order_by(desc(Chat.CreatedDate))
          .first()
    )
    last_message_content = last_message_row.ContentChat if last_message_row else None

    # 4) Mensajes no leídos para el usuario actual
    unread_count = (
        db.query(Chat)
          .filter(
              Chat.MatchesID == match_id,
              Chat.ReadChat == False,
              Chat.SenderID != current_user.ID,
          )
          .count()
    )

    return ChatInfo(
        partner_id=partner_id,
        partner_username=partner_username,
        last_message=last_message_content,
        unread_count=unread_count,
    )


@router.get("/{match_id}", response_model=ChatThreadOut)
def get_chat(
    match_id: int,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Devuelve el hilo de chat con:
      - partner_id y partner_username (el otro usuario del match)
      - messages: lista paginada de mensajes (ascendente por fecha)
    """
    match = _assert_user_in_match(db, match_id, current_user.ID)

    # Determinar el "otro" usuario del match
    partner_id = match.UserID2 if current_user.ID == match.UserID1 else match.UserID1
    partner = db.query(User.ID, User.Username).filter(User.ID == partner_id).first()
    partner_username = partner.Username if partner else "(usuario)"

    # Traer mensajes
    rows = (
        db.query(Chat)
        .filter(Chat.MatchesID == match_id)
        .order_by(asc(Chat.CreatedDate))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return ChatThreadOut(
        partner_id=partner_id,
        partner_username=partner_username,
        messages=[ChatMessageOut.from_model(r) for r in rows],
    )


@router.post("/{match_id}", response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    match_id: int,
    message: ChatMessageIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_user_in_match(db, match_id, current_user.ID)

    row = Chat(
        MatchesID=match_id,
        SenderID=current_user.ID,
        ContentChat=message.content.strip(),
        CreatedDate=datetime.utcnow(),
        Status=True,          # <-- boolean si tu columna es bit/bool
        ReadChat=False,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ChatMessageOut.from_model(row)