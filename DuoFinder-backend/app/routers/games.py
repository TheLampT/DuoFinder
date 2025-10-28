# app/routers/games.py (fragmento)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict

from app.db.connection import get_db
from app.models.games import Games
from app.models.game_ranks import GameRanks  # <-- IMPORTANTE: usar la tabla Game_rankfr
from datetime import date

from pydantic import BaseModel

router = APIRouter()

# ===== Schemas =====
class RankOut(BaseModel):
    local_rank_id: int
    rank_name: Optional[str] = None
    tier_name: Optional[str] = None
    division_label: Optional[str] = None
    division_number: Optional[int] = None
    rank_order: Optional[int] = None

class GameWithRanksOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    released_year: Optional[date] = None
    ranks: List[RankOut] = []

# ===== Endpoint corregido =====
@router.get("/games", response_model=List[GameWithRanksOut])
def get_games_with_ranks(db: Session = Depends(get_db)):
    """
    Devuelve todos los juegos y sus rangos asociados a través de dbo.Game_ranks.
    NO usa Games.RankId.
    """
    rows = (
        db.query(
            Games.ID.label("game_id"),
            Games.GameName.label("game_name"),
            Games.Description.label("description"),
            Games.ReleasedYear.label("released_year"),
            GameRanks.Local_rank_id.label("local_rank_id"),
            GameRanks.Rank_name.label("rank_name"),
            GameRanks.Tier_name.label("tier_name"),
            GameRanks.Division_label.label("division_label"),
            GameRanks.Division_number.label("division_number"),
            GameRanks.Rank_order.label("rank_order"),
        )
        .outerjoin(GameRanks, GameRanks.Game_id == Games.ID)  # LEFT JOIN por Game_id
        .order_by(Games.GameName, GameRanks.Rank_order)
        .all()
    )

    by_game: Dict[int, GameWithRanksOut] = {}
    for r in rows:
        if r.game_id not in by_game:
            by_game[r.game_id] = GameWithRanksOut(
                id=r.game_id,
                name=r.game_name,
                description=r.description,
                released_year=r.released_year,
                ranks=[]
            )
        if r.local_rank_id is not None:
            by_game[r.game_id].ranks.append(
                RankOut(
                    local_rank_id=r.local_rank_id,
                    rank_name=r.rank_name,
                    tier_name=r.tier_name,
                    division_label=r.division_label,
                    division_number=r.division_number,
                    rank_order=r.rank_order,
                )
            )

    # Si la tabla Game_ranks estuviera vacía, aún devolvemos los juegos sin ranks
    if not rows:
        only_games = (
            db.query(Games.ID, Games.GameName, Games.Description, Games.ReleasedYear)
              .order_by(Games.GameName)
              .all()
        )
        return [
            GameWithRanksOut(
                id=g.ID, name=g.GameName, description=g.Description,
                released_year=g.ReleasedYear, ranks=[]
            )
            for g in only_games
        ]

    return list(by_game.values())
