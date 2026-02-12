"""MongoDB database connection using Motor (async driver)"""
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Initialize MongoDB connection"""
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.mongodb_db]
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.history.create_index("user_id")
    await db.history.create_index("created_at")
    
    print(f"✅ Connected to MongoDB: {settings.mongodb_db}")


async def close_db():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed")


def get_db():
    """Get database instance"""
    return db
