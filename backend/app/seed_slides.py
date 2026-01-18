"""
Script to seed the database with slide topics from the frontend structure.
Run this once to migrate your mock slides into the backend database.

Usage:
    python -m app.seed_slides
"""

from .database import get_database
from datetime import datetime

# Slide topics extracted from frontend MOCK_SLIDES
SLIDE_TOPICS = [
    # Chapter 1: Foundations of Derivatives
    {
        "course_id": "course_calc_101",
        "chapter_id": "chapter_1",
        "chapter_title": "Chapter 1: Foundations of Derivatives",
        "order": 1,
        "slides": [
            {
                "slide_id": "slide_1",
                "title": "Introduction to Derivatives",
                "learning_objectives": "Understand the concept of derivatives as instantaneous rate of change. Learn derivative notation and geometric interpretation as tangent line slope.",
                "context": "Calculus I: Limits & Derivatives - Foundational concept",
                "order": 1
            },
            {
                "slide_id": "slide_2",
                "title": "Basic Derivative Rules",
                "learning_objectives": "Master the power rule, constant rule, constant multiple rule, and sum rule for finding derivatives of polynomial functions.",
                "context": "Calculus I: Limits & Derivatives - Essential rules",
                "order": 2
            },
            {
                "slide_id": "slide_3",
                "title": "The Limit Definition",
                "learning_objectives": "Understand the formal limit definition of a derivative and how to apply it to find derivatives from first principles.",
                "context": "Calculus I: Limits & Derivatives - Theoretical foundation",
                "order": 3
            },
            {
                "slide_id": "slide_4",
                "title": "Derivative Notation",
                "learning_objectives": "Learn different notations for derivatives (Lagrange, Leibniz, Newton, Euler) and when to use each notation.",
                "context": "Calculus I: Limits & Derivatives - Mathematical notation",
                "order": 4
            },
            {
                "slide_id": "slide_5",
                "title": "Higher-Order Derivatives",
                "learning_objectives": "Understand second and higher-order derivatives, their physical meaning (velocity, acceleration), and how to calculate them.",
                "context": "Calculus I: Limits & Derivatives - Advanced concepts",
                "order": 5
            }
        ]
    },
    # Chapter 2: Derivative Rules
    {
        "course_id": "course_calc_101",
        "chapter_id": "chapter_2",
        "chapter_title": "Chapter 2: Derivative Rules",
        "order": 2,
        "slides": [
            {
                "slide_id": "slide_1",
                "title": "The Power Rule",
                "learning_objectives": "Master the power rule for derivatives and apply it to functions with any real number exponent.",
                "context": "Calculus I: Derivative Rules - Fundamental technique",
                "order": 1
            },
            {
                "slide_id": "slide_2",
                "title": "Product Rule",
                "learning_objectives": "Learn the product rule for differentiating products of two functions and avoid common mistakes.",
                "context": "Calculus I: Derivative Rules - Combining functions",
                "order": 2
            },
            {
                "slide_id": "slide_3",
                "title": "Quotient Rule",
                "learning_objectives": "Master the quotient rule for differentiating ratios of functions using the 'low dee high minus high dee low' mnemonic.",
                "context": "Calculus I: Derivative Rules - Division of functions",
                "order": 3
            },
            {
                "slide_id": "slide_4",
                "title": "Chain Rule",
                "learning_objectives": "Understand and apply the chain rule for composite functions, differentiating from the outside in.",
                "context": "Calculus I: Derivative Rules - Function composition",
                "order": 4
            },
            {
                "slide_id": "slide_5",
                "title": "Combining Differentiation Rules",
                "learning_objectives": "Apply multiple differentiation rules together to solve complex problems involving products, quotients, and compositions.",
                "context": "Calculus I: Derivative Rules - Advanced problem solving",
                "order": 5
            }
        ]
    },
    # Chapter 3: Applications of Derivatives
    {
        "course_id": "course_calc_101",
        "chapter_id": "chapter_3",
        "chapter_title": "Chapter 3: Applications of Derivatives",
        "order": 3,
        "slides": [
            {
                "slide_id": "slide_1",
                "title": "Critical Points and Extrema",
                "learning_objectives": "Learn to find critical points by setting the derivative equal to zero. Understand local and absolute extrema and their significance.",
                "context": "Calculus I: Applications - Optimization fundamentals",
                "order": 1
            },
            {
                "slide_id": "slide_2",
                "title": "The First Derivative Test",
                "learning_objectives": "Use the first derivative test to classify critical points as local maxima, minima, or neither by analyzing sign changes.",
                "context": "Calculus I: Applications - Classification of extrema",
                "order": 2
            },
            {
                "slide_id": "slide_3",
                "title": "The Second Derivative Test",
                "learning_objectives": "Apply the second derivative test to determine concavity and classify critical points using the second derivative.",
                "context": "Calculus I: Applications - Concavity analysis",
                "order": 3
            },
            {
                "slide_id": "slide_4",
                "title": "Optimization Problems",
                "learning_objectives": "Solve real-world optimization problems by setting up equations, finding derivatives, and determining maximum or minimum values.",
                "context": "Calculus I: Applications - Real-world problem solving",
                "order": 4
            },
            {
                "slide_id": "slide_5",
                "title": "Related Rates",
                "learning_objectives": "Understand how to solve related rates problems by relating multiple changing quantities using the chain rule.",
                "context": "Calculus I: Applications - Dynamic systems",
                "order": 5
            }
        ]
    }
]


def seed_database():
    """Seed the database with slide topics"""
    db = get_database()
    
    if db is None:
        print("Error: Database connection not available")
        return
    
    print("Starting database seeding...")
    
    # Clear existing data (optional - comment out if you want to keep existing data)
    print("Clearing existing slide topics...")
    db.slide_topics.delete_many({"course_id": "course_calc_101"})
    
    # Insert slide topics
    total_slides = 0
    for chapter_data in SLIDE_TOPICS:
        chapter_id = chapter_data["chapter_id"]
        chapter_title = chapter_data["chapter_title"]
        course_id = chapter_data["course_id"]
        chapter_order = chapter_data["order"]
        
        print(f"\n📚 Processing {chapter_title}...")
        
        for slide in chapter_data["slides"]:
            slide_doc = {
                "course_id": course_id,
                "chapter_id": chapter_id,
                "chapter_title": chapter_title,
                "chapter_order": chapter_order,
                "slide_id": f"{chapter_id}_{slide['slide_id']}",
                "title": slide["title"],
                "learning_objectives": slide["learning_objectives"],
                "context": slide["context"],
                "order": slide["order"],
                "created_at": datetime.now()
            }
            
            db.slide_topics.insert_one(slide_doc)
            total_slides += 1
            print(f"  ✓ Added: {slide['title']}")
    
    print(f"\n✅ Successfully seeded {total_slides} slide topics!")
    print(f"📊 Database: {db.name}")
    print(f"📁 Collection: slide_topics")


if __name__ == "__main__":
    seed_database()
