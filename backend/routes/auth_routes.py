"""Authentication API routes"""
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from database import get_db
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# --- Request/Response Models ---

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    company: str = Field(default="")


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class ProfileUpdate(BaseModel):
    name: str = Field(default=None)
    company: str = Field(default=None)


# --- Routes ---

@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    """Register a new user"""
    db = get_db()
    
    # Check if email exists
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_doc = {
        "name": req.name,
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "company": req.company,
        "created_at": datetime.utcnow(),
        "total_optimizations": 0,
        "total_distance_saved": 0,
        "total_cost_saved": 0,
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Generate token
    token = create_access_token({"sub": user_id, "email": req.email.lower()})
    
    return AuthResponse(
        token=token,
        user={
            "id": user_id,
            "name": req.name,
            "email": req.email.lower(),
            "company": req.company,
        }
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Login user and return JWT token"""
    db = get_db()
    
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "email": user["email"]})
    
    return AuthResponse(
        token=token,
        user={
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "company": user.get("company", ""),
        }
    )


@router.get("/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "company": user.get("company", ""),
        "created_at": user["created_at"].isoformat(),
        "total_optimizations": user.get("total_optimizations", 0),
        "total_distance_saved": user.get("total_distance_saved", 0),
        "total_cost_saved": user.get("total_cost_saved", 0),
    }


@router.put("/profile")
async def update_profile(req: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Update user profile"""
    db = get_db()
    update_data = {}
    
    if req.name is not None:
        update_data["name"] = req.name
    if req.company is not None:
        update_data["company"] = req.company
    
    if update_data:
        await db.users.update_one(
            {"_id": ObjectId(current_user["user_id"])},
            {"$set": update_data}
        )
    
    return {"message": "Profile updated successfully"}
