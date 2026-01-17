import os
import certifi
from dotenv import load_dotenv
from urllib.parse import quote_plus
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()

DB_USER = quote_plus(os.getenv("DB_USER", ""))
DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD", ""))
DB_NAME = "mercury"

CONNECTION_STRING = (
    f"mongodb+srv://{DB_USER}:{DB_PASSWORD}"
    "@mercury-backend.uqeaukz.mongodb.net/"
    "?retryWrites=true&w=majority&appName=mercury-backend"
)

def get_database():
    try:
        client = MongoClient(
            CONNECTION_STRING,
            server_api=ServerApi("1"),
            tls=True,
            tlsCAFile=certifi.where(),
        )
        client.admin.command("ping")
        print("Successfully connected to MongoDB")
        return client[DB_NAME]
    except Exception as e:
        print("MongoDB connection failed:", e)
        return None


if __name__ == "__main__":
    print("Getting database...")
    database = get_database()

    if database is not None:
        collection = database["test_collection"]
        print(f"Accessed collection: {collection.name}")
