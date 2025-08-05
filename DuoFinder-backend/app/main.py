from fastapi import FastAPI
from app.routers import auth, user, match, chat, community

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/users", tags=["users"])
app.include_router(match.router, prefix="/matches", tags=["matches"])
app.include_router(chat.router, prefix="/chats", tags=["chats"])
app.include_router(community.router, prefix="/communities", tags=["communities"])
