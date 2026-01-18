
from app.database import get_database

db = get_database()
if db is not None:
    count = db.slide_topics.count_documents({})
    print(f"Total slide topics: {count}")
    
    # Check course_calc_101
    count_calc = db.slide_topics.count_documents({"course_id": "course_calc_101"})
    print(f"course_calc_101 slide topics: {count_calc}")
else:
    print("Database connection failed")
