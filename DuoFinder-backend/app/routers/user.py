from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class UserProfile(BaseModel):
    username: str
    email: str
    bio: str = ""

@router.get("/me")
def get_my_profile():
    return {
        "username": "example_user",
        "email": "example@email.com",
        "bio": "Casual gamer"
    }

@router.put("/me")
def update_profile(profile: UserProfile):
    return {"message": "Profile updated", "new_profile": profile}

@router.delete("/me")
def delete_my_account():
    return {"message": "User account deleted successfully"}


