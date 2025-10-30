import os
import urllib.parse
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Cargar variables del .env
load_dotenv()

# Obtener la DATABASE_URL
raw_url = os.getenv("DATABASE_URL")
print(raw_url)

if raw_url is None:
    print("❌ No se encontró DATABASE_URL en .env")
    exit()

# Si el driver contiene espacios, SQLAlchemy necesita que esté URL-encoded
# Esto lo arreglamos solo si lo escribiste mal, ejemplo: driver=ODBC Driver 17 for SQL Server
if "driver=ODBC Driver 17 for SQL Server" in raw_url:
    raw_url = raw_url.replace("driver=ODBC Driver 17 for SQL Server", "driver=" + urllib.parse.quote_plus("ODBC Driver 17 for SQL Server"))

print("🔌 Conectando a:", raw_url)

# Crear engine
try:
    engine = create_engine(raw_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ Conexión exitosa:", result.scalar())
except Exception as e:
    print("❌ Error de conexión:", e)


"""
from fastapi import APIRouter, Query, Depends from sqlalchemy.orm import Session from pydantic import BaseModel from typing import List, Optional from datetime import date, datetime from fastapi import HTTPException from sqlalchemy import and_ from app.models.user import User from app.models.user_images import UserImages from app.models.user_game_skill import UserGamesSkill from app.models.games import Games from app.routers.auth import get_current_user from app.db.connection import get_db from app.models.matches import Matches from app.models.chat import Chat router = APIRouter() # ==== Constantes (0 = dislike, 1 = like) ==== DISLIKE = 0 LIKE = 1 # ==== Schemas ==== class Suggestion(BaseModel): id: int username: str age: int image: Optional[str] = None bio: Optional[str] = None game: str skill: str isRanked: bool class Config: from_attributes = True class SwipeInput(BaseModel): target_user_id: int like: bool game_id: int # <-- NUEVO: juego en el que se hace el swipe # ==== Utilidades ==== def calculate_age(birthdate: date) -> int: today = date.today() return today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day)) # ==== Endpoints ==== @router.get("/suggestions", response_model=List[Suggestion]) def get_match_suggestions( game_id: int = Query(..., description="ID of the game to find matches for"), server: Optional[str] = Query(None, description="Optional server filter"), is_ranked: Optional[bool] = Query(None, description="Optional ranked filter"), skip: int = Query(0, ge=0, description="Number of records to skip for pagination"), limit: int = Query(5, ge=1, le=50, description="Number of records to return"), current_user: User = Depends(get_current_user), db: Session = Depends(get_db) ): @ Sugerencias de usuarios para matchear según juego (y opcionalmente server / ranked). Trae la imagen principal si existe. @ q = ( db.query( User, UserGamesSkill, Games, UserImages.ImageURL.label("image_url") ) .join(UserGamesSkill, User.ID == UserGamesSkill.UserID) .join(Games, UserGamesSkill.GameId == Games.ID) .outerjoin( UserImages, and_(UserImages.UserID == User.ID, UserImages.IsMain == True) ) .filter( User.ID != current_user.ID, User.IsActive == True, UserGamesSkill.GameId == game_id ) ) if server is not None: q = q.filter(User.Server == server) if is_ranked is not None: q = q.filter(UserGamesSkill.IsRanked == is_ranked) q = q.offset(skip).limit(limit) rows = q.all() suggestions: List[Suggestion] = [] for user, skill, game, image_url in rows: suggestions.append( Suggestion( id=user.ID, username=user.Username, age=calculate_age(user.BirthDate), image=image_url, bio=user.Bio, game=game.GameName, skill=skill.SkillLevel, isRanked=skill.IsRanked ) ) return suggestions @router.post("/swipe") def swipe_user( data: SwipeInput, # target_user_id: int, like: bool current_user: User = Depends(get_current_user), db: Session = Depends(get_db) ): @ Sin game_id en el body: inferimos el juego. Reglas: 1) Si ambos comparten exactamente un GameID -> usar ese. 2) Si el usuario actual solo tiene un GameID -> usar ese. 3) Si hay 0 o >1 en común -> 400 (ambiguo): que el front mande game_id. Matches.IsRanked = 1 solo si ambos IsRanked=1 en ese GameID. @ my_id = current_user.ID target_id = data.target_user_id my_choice = LIKE if data.like else DISLIKE # --- Traer (GameID, IsRanked) de ambos usuarios como tuplas --- my_skills = db.query( UserGamesSkill.GameId, UserGamesSkill.IsRanked ).filter( UserGamesSkill.UserID == my_id ).all() # -> [(game_id, is_ranked), ...] target_skills = db.query( UserGamesSkill.GameId, UserGamesSkill.IsRanked ).filter( UserGamesSkill.UserID == target_id ).all() # Conjuntos de IDs para inferencia my_game_ids = {gid for (gid, _) in my_skills} target_game_ids = {gid for (gid, _) in target_skills} common = my_game_ids.intersection(target_game_ids) # --- Inferir GameID --- if len(common) == 1: selected_game_id = next(iter(common)) elif len(my_game_ids) == 1: selected_game_id = next(iter(my_game_ids)) else: raise HTTPException( status_code=400, detail="No se pudo inferir el juego del swipe (0 o >1 juegos en común). " "Envía game_id desde el frontend en estos casos." ) # Diccionarios para consultar IsRanked por juego my_ranked_by_game = {gid: ranked for (gid, ranked) in my_skills} target_ranked_by_game = {gid: ranked for (gid, ranked) in target_skills} # Si ambos tienen entrada y ambos IsRanked=1 -> vínculo ranked my_r = my_ranked_by_game.get(selected_game_id, 0) tg_r = target_ranked_by_game.get(selected_game_id, 0) match_is_ranked = 1 if (my_r and tg_r) else 0 # --- Mi fila (A -> B) --- my_row = db.query(Matches).filter( and_(Matches.UserID1 == my_id, Matches.UserID2 == target_id) ).first() if my_row: my_row.Status = my_choice # Si tu tabla Matches tiene GameID, setéalo también: # my_row.GameID = selected_game_id my_row.IsRanked = match_is_ranked else: my_row = Matches( UserID1=my_id, UserID2=target_id, Status=my_choice, # GameID=selected_game_id, # <-- si existe la columna IsRanked=match_is_ranked, MatchDate=datetime.utcnow() ) db.add(my_row) db.flush() # --- Fila inversa (B -> A) con like --- reverse_row = db.query(Matches).filter( and_(Matches.UserID1 == target_id, Matches.UserID2 == my_id, Matches.Status == LIKE) ).first() db.commit() db.refresh(my_row) # --- ¿Hay match lógico? --- if my_row.Status == LIKE and reverse_row: canonical_match_id = min(my_row.ID, reverse_row.ID) existing_chat = db.query(Chat).filter( and_(Chat.MatchesID == canonical_match_id, Chat.Status == True) ).first() if not existing_chat: new_chat = Chat( MatchesID=canonical_match_id, SenderID=my_id, ContentChat="Chat creado por match", CreatedDate=datetime.utcnow(), Status=True, ReadChat=False ) db.add(new_chat) db.commit() db.refresh(new_chat) return { "message": "¡Es un match!", "match": True, "chat_id": new_chat.ID, "matches_ids": [my_row.ID, reverse_row.ID], "game_id_inferido": selected_game_id, "is_ranked": bool(match_is_ranked) } return { "message": "¡Es un match!", "match": True, "chat_id": existing_chat.ID, "matches_ids": [my_row.ID, reverse_row.ID], "game_id_inferido": selected_game_id, "is_ranked": bool(match_is_ranked) } return { "message": "Swipe registrado/actualizado", "match": False, "status": my_row.Status, "game_id_inferido": selected_game_id, "is_ranked": bool(match_is_ranked) }

"""
