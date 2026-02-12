"""Route history and dashboard stats API"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from bson import ObjectId
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api", tags=["Dashboard"])


@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    """Get user's route optimization history"""
    db = get_db()
    
    cursor = db.history.find(
        {"user_id": current_user["user_id"]}
    ).sort("created_at", -1).limit(50)
    
    history = []
    async for doc in cursor:
        history.append({
            "id": str(doc["_id"]),
            "start_location": doc.get("start_location", ""),
            "num_stops": doc.get("num_stops", 0),
            "total_distance_km": doc.get("total_distance_km", 0),
            "total_time_min": doc.get("total_time_min", 0),
            "predicted_cost": doc.get("predicted_cost", 0),
            "risk_score": doc.get("risk_score", 0),
            "quality_score": doc.get("quality_score", 0),
            "created_at": doc.get("created_at", datetime.utcnow()).isoformat(),
        })
    
    return {"history": history}


@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics for current user"""
    db = get_db()
    user_id = current_user["user_id"]
    
    # Get user data
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    # Count total optimizations
    total_routes = await db.history.count_documents({"user_id": user_id})
    
    # Get recent history for charts
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_cursor = db.history.find(
        {"user_id": user_id, "created_at": {"$gte": seven_days_ago}}
    ).sort("created_at", -1)
    
    recent_routes = []
    total_distance = 0
    total_cost = 0
    total_time = 0
    
    async for doc in recent_cursor:
        total_distance += doc.get("total_distance_km", 0)
        total_cost += doc.get("predicted_cost", 0)
        total_time += doc.get("total_time_min", 0)
        recent_routes.append({
            "date": doc.get("created_at", datetime.utcnow()).strftime("%b %d"),
            "distance": round(doc.get("total_distance_km", 0), 1),
            "cost": round(doc.get("predicted_cost", 0), 2),
        })
    
    # All-time aggregate
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": None,
            "total_distance": {"$sum": "$total_distance_km"},
            "total_cost": {"$sum": "$predicted_cost"},
            "avg_risk": {"$avg": "$risk_score"},
            "avg_quality": {"$avg": "$quality_score"},
        }}
    ]
    
    agg_result = await db.history.aggregate(pipeline).to_list(1)
    agg = agg_result[0] if agg_result else {}
    
    return {
        "total_routes": total_routes,
        "total_distance": round(agg.get("total_distance", 0), 1),
        "total_cost": round(agg.get("total_cost", 0), 2),
        "avg_risk_score": round(agg.get("avg_risk", 0), 1),
        "avg_quality_score": round(agg.get("avg_quality", 0), 1),
        "recent_routes": recent_routes,
        "member_since": user.get("created_at", datetime.utcnow()).isoformat() if user else "",
    }
