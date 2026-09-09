import os
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
BASE = Path(__file__).parent
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
app = FastAPI(title="Capacity Connect API")
bearer = HTTPBearer(auto_error=False)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class AssessmentSubmission(BaseModel):
    answers: list[int]  # list of 10 answer indices


class GapAnalysisRequest(BaseModel):
    role: str
    current_skills: dict[str, float]


class ProgressUpdate(BaseModel):
    module_id: str
    score: float


class ProjectSubmission(BaseModel):
    project_id: str
    github_url: str = ""
    demo_url: str = ""
    description: str = ""


class PracticalSubmission(BaseModel):
    answers: dict[str, int]  # question_id -> chosen option index


class OpportunityMatchRequest(BaseModel):
    skills: dict[str, float]


class FeedbackInput(BaseModel):
    learner_name: str
    rating: float
    comment: str


class UserStatusUpdate(BaseModel):
    status: str  # 'approved', 'rejected', 'disabled'

class UserRoleUpdate(BaseModel):
    role: str  # 'student', 'trainer', 'admin'

class AnnouncementInput(BaseModel):
    title: str
    body: str

class CourseInput(BaseModel):
    title: str
    description: str = ''
    difficulty: str = 'Beginner'
    duration_hrs: int = 1
    objectives: list[str] = []
    resources: list[dict] = []


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ROLE_REQUIREMENTS = {
    "Full Stack Developer": {
        "HTML": 70, "CSS": 70, "JavaScript": 85, "Python": 75,
        "SQL": 70, "REST API": 80, "Git": 65, "FastAPI": 70, "Authentication": 65,
    },
    "Frontend Developer": {
        "HTML": 80, "CSS": 80, "JavaScript": 90, "Git": 70, "Authentication": 60,
    },
    "Backend Developer": {
        "Python": 80, "FastAPI": 75, "SQL": 85, "REST API": 85,
        "Git": 70, "Authentication": 75,
    },
    "Data Analyst": {
        "Python": 80, "SQL": 85, "Git": 60,
    },
}

ASSESSMENT_QUESTIONS = [
    {
        "id": "q1", "skill": "REST API",
        "question": "What HTTP method should be used to retrieve data from an API without side effects?",
        "options": ["POST", "GET", "PUT", "DELETE"], "correct": 1,
    },
    {
        "id": "q2", "skill": "REST API",
        "question": "A REST API returns status code 404. What does this mean?",
        "options": ["Server error", "Unauthorized", "Resource not found", "Success"], "correct": 2,
    },
    {
        "id": "q3", "skill": "SQL",
        "question": "Which SQL clause filters rows AFTER aggregation?",
        "options": ["WHERE", "HAVING", "GROUP BY", "ORDER BY"], "correct": 1,
    },
    {
        "id": "q4", "skill": "SQL",
        "question": "What is the purpose of a database index?",
        "options": ["Store backups", "Speed up query lookups", "Encrypt data", "Create relationships"], "correct": 1,
    },
    {
        "id": "q5", "skill": "JavaScript",
        "question": "Which JavaScript concept handles asynchronous operations?",
        "options": ["Closures", "Prototypes", "Promises / async-await", "Symbols"], "correct": 2,
    },
    {
        "id": "q6", "skill": "JavaScript",
        "question": "What does the Array.map() method return?",
        "options": ["The original array mutated", "A new array with transformed elements", "A single value", "A boolean"], "correct": 1,
    },
    {
        "id": "q7", "skill": "Python",
        "question": "Which Python keyword is used to define a generator function?",
        "options": ["return", "async", "yield", "lambda"], "correct": 2,
    },
    {
        "id": "q8", "skill": "Python",
        "question": "What does FastAPI use to validate request body data?",
        "options": ["Marshmallow", "Pydantic", "Cerberus", "Voluptuous"], "correct": 1,
    },
    {
        "id": "q9", "skill": "Git",
        "question": "Which Git command integrates changes from one branch into another?",
        "options": ["git clone", "git push", "git merge", "git fetch"], "correct": 2,
    },
    {
        "id": "q10", "skill": "Authentication",
        "question": "Where should a JWT access token be stored in a browser for security?",
        "options": ["localStorage", "sessionStorage", "Memory (JS variable)", "URL query string"], "correct": 2,
    },
]

PRACTICAL_QUESTIONS = [
    {
        "id": "p1", "skill": "REST API",
        "scenario": "You are designing an API endpoint to create a new user account.",
        "question": "Which HTTP method and URL pattern is most RESTful?",
        "options": ["GET /users/create", "POST /users", "PUT /user/new", "PATCH /accounts"], "correct": 1,
    },
    {
        "id": "p2", "skill": "SQL",
        "scenario": "A table 'orders' has 10 million rows. Queries filtering by customer_id are slow.",
        "question": "What is the most effective solution?",
        "options": [
            "Add more RAM to the server",
            "Use SELECT * instead of specific columns",
            "Create an index on customer_id",
            "Split the table into two tables",
        ], "correct": 2,
    },
    {
        "id": "p3", "skill": "JavaScript",
        "scenario": "Your fetch() call to an API sometimes returns data and sometimes throws an error.",
        "question": "What is the correct way to handle both cases?",
        "options": [
            "Use try/catch with async/await",
            "Call the API twice",
            "Check navigator.online before fetching",
            "Use synchronous XMLHttpRequest",
        ], "correct": 0,
    },
]

DEMO_STUDENT = {
    "name": "Alex Johnson",
    "role": "Full Stack Developer",
    "skills": {
        "HTML": 90, "CSS": 85, "JavaScript": 72, "Python": 65,
        "SQL": 48, "REST API": 40, "Git": 75, "FastAPI": 45, "Authentication": 35,
    },
    "skill_readiness": 72,
    "skill_gaps": 4,
    "learning_progress": 58,
    "learning_effectiveness": 84,
    "journey": {
        "assessment": True,
        "gap_analysis": True,
        "learning_path": True,
        "learn_practice": 58,
        "project": 35,
        "competency": False,
        "passport": True,
        "opportunities": 6,
    },
}

DEMO_TRAINER = {
    "name": "Dr. Priya Sharma",
    "expertise": ["Python", "FastAPI", "REST API", "Backend Development"],
    "active_learners": 24,
    "avg_improvement": 27,
    "projects_to_review": 6,
    "avg_feedback": 4.6,
    "quality_score": 88,
    "quality_breakdown": {
        "learner_improvement": 90,
        "course_completion": 85,
        "learner_feedback": 89,
    },
    "learners": [
        {"name": "Alex Johnson", "role": "Full Stack Developer", "progress": 58, "skill_readiness": 72, "last_active": "2h ago"},
        {"name": "Priya Nair", "role": "Backend Developer", "progress": 82, "skill_readiness": 85, "last_active": "1d ago"},
        {"name": "Arjun Patel", "role": "Frontend Developer", "progress": 45, "skill_readiness": 61, "last_active": "3h ago"},
        {"name": "Sneha Reddy", "role": "Full Stack Developer", "progress": 71, "skill_readiness": 78, "last_active": "5h ago"},
        {"name": "Kiran Kumar", "role": "Data Analyst", "progress": 90, "skill_readiness": 91, "last_active": "30m ago"},
    ],
    "projects_pending": [
        {"student": "Alex Johnson", "project": "Full Stack Task Manager", "submitted": "2h ago", "status": "pending"},
        {"student": "Arjun Patel", "project": "Portfolio Website", "submitted": "1d ago", "status": "pending"},
    ],
}

DEMO_ADMIN_STATS = {
    'total_users': 156, 'active_learners': 89, 'trainers': 12,
    'courses': 8, 'assessments_taken': 340, 'certifications': 23,
    'avg_completion': 74, 'avg_readiness': 68
}

DEMO_USERS = [
    {'id': 'u1', 'name': 'Alex Johnson', 'email': 'alex@example.com', 'role': 'student', 'status': 'approved', 'joined': '2026-08-15'},
    {'id': 'u2', 'name': 'Priya Nair', 'email': 'priya.n@example.com', 'role': 'student', 'status': 'approved', 'joined': '2026-08-20'},
    {'id': 'u3', 'name': 'Arjun Patel', 'email': 'arjun@example.com', 'role': 'student', 'status': 'approved', 'joined': '2026-08-22'},
    {'id': 'u4', 'name': 'Sneha Reddy', 'email': 'sneha@example.com', 'role': 'student', 'status': 'pending', 'joined': '2026-09-01'},
    {'id': 'u5', 'name': 'Rahul Mehta', 'email': 'rahul.m@example.com', 'role': 'trainer', 'status': 'approved', 'joined': '2026-07-10'},
    {'id': 'u6', 'name': 'Dr. Ananya Sen', 'email': 'ananya@example.com', 'role': 'trainer', 'status': 'pending', 'joined': '2026-09-05'},
    {'id': 'u7', 'name': 'Kiran Kumar', 'email': 'kiran@example.com', 'role': 'student', 'status': 'approved', 'joined': '2026-08-25'}
]

DEMO_ANNOUNCEMENTS = [
    {'id': 'a1', 'title': 'SIH 2026 Demo Day', 'body': 'All teams prepare for the final SIH demonstration on September 15th.', 'date': '2026-09-08'},
    {'id': 'a2', 'title': 'New Learning Modules Available', 'body': '5 new skill modules have been published.', 'date': '2026-09-05'}
]

DEMO_TRAINER_COURSES = [
    {'id': 'tc1', 'title': 'Python Backend Masterclass', 'description': 'Complete Python backend with FastAPI', 'difficulty': 'Intermediate', 'duration_hrs': 12, 'status': 'published', 'students': 18},
    {'id': 'tc2', 'title': 'REST API Design Patterns', 'description': 'Industry-standard REST API architecture', 'difficulty': 'Advanced', 'duration_hrs': 8, 'status': 'draft', 'students': 0}
]

LEARNING_MODULES_FALLBACK = [
    {
        "id": "m1", "skill": "REST API", "title": "REST API Fundamentals",
        "description": "Learn HTTP methods, status codes, request/response cycles.",
        "difficulty": "Beginner", "duration_hrs": 3, "position": 1,
        "objectives": ["Understand HTTP methods", "Design REST URLs", "Handle status codes", "Parse JSON"],
        "resources": [{"title": "MDN HTTP Overview", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"}],
    },
    {
        "id": "m2", "skill": "SQL", "title": "SQL & Database Design",
        "description": "Master SELECT, JOIN, indexes and schema design.",
        "difficulty": "Beginner", "duration_hrs": 4, "position": 2,
        "objectives": ["Write SELECT queries", "Use JOINs", "Create indexes", "Design schemas"],
        "resources": [{"title": "SQLZoo", "url": "https://sqlzoo.net"}],
    },
    {
        "id": "m3", "skill": "FastAPI", "title": "FastAPI Backend Development",
        "description": "Build async Python APIs with Pydantic and dependency injection.",
        "difficulty": "Intermediate", "duration_hrs": 5, "position": 3,
        "objectives": ["Create endpoints", "Use Pydantic models", "Dependency injection", "OpenAPI docs"],
        "resources": [{"title": "FastAPI Tutorial", "url": "https://fastapi.tiangolo.com/tutorial/"}],
    },
    {
        "id": "m4", "skill": "Authentication", "title": "Authentication & Security",
        "description": "JWT auth, password hashing and role-based access.",
        "difficulty": "Intermediate", "duration_hrs": 3, "position": 4,
        "objectives": ["Hash passwords", "Issue JWTs", "Protect routes", "Role-based access"],
        "resources": [{"title": "JWT Introduction", "url": "https://jwt.io/introduction"}],
    },
    {
        "id": "m5", "skill": "Full Stack", "title": "Full Stack Integration",
        "description": "Connect JS frontend to FastAPI + PostgreSQL end-to-end.",
        "difficulty": "Advanced", "duration_hrs": 8, "position": 5,
        "objectives": ["Wire fetch() to API", "Handle auth tokens", "DOM manipulation", "Deploy end-to-end"],
        "resources": [{"title": "MDN Fetch API", "url": "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch"}],
    },
]

OPPORTUNITIES_FALLBACK = [
    {
        "id": "opp1", "title": "Junior Full Stack Developer", "company": "TechStart Inc.",
        "type": "Full-time", "location": "Remote",
        "required_skills": {"JavaScript": 70, "Python": 65, "REST API": 70, "SQL": 60, "Git": 60},
        "description": "Build and maintain web applications using modern full-stack technologies.",
    },
    {
        "id": "opp2", "title": "Backend API Developer", "company": "DataFlow Systems",
        "type": "Contract", "location": "Hybrid",
        "required_skills": {"Python": 75, "FastAPI": 70, "SQL": 80, "REST API": 75, "Authentication": 65},
        "description": "Design and develop scalable REST APIs for our data platform.",
    },
    {
        "id": "opp3", "title": "Frontend Developer", "company": "Creative Labs",
        "type": "Full-time", "location": "On-site",
        "required_skills": {"HTML": 75, "CSS": 75, "JavaScript": 80, "Git": 65},
        "description": "Create responsive, accessible UIs with modern JavaScript.",
    },
    {
        "id": "opp4", "title": "Data Analyst", "company": "Insight Analytics",
        "type": "Full-time", "location": "Remote",
        "required_skills": {"Python": 75, "SQL": 85, "Git": 55},
        "description": "Analyse large datasets and build dashboards to drive business decisions.",
    },
    {
        "id": "opp5", "title": "API Integration Specialist", "company": "ConnectHub",
        "type": "Part-time", "location": "Remote",
        "required_skills": {"REST API": 80, "JavaScript": 65, "Authentication": 60},
        "description": "Integrate third-party APIs and build automation workflows.",
    },
    {
        "id": "opp6", "title": "Python Backend Intern", "company": "Startup Foundry",
        "type": "Internship", "location": "Remote",
        "required_skills": {"Python": 60, "FastAPI": 55, "SQL": 55, "Git": 50},
        "description": "Work on real backend projects alongside senior engineers.",
    },
]

DEMO_PASSPORT = {
    "full_name": "Alex Johnson",
    "target_role": "Full Stack Developer",
    "verified_skills": [
        {"skill": "JavaScript", "score": 82, "verified": True, "trend": "+10"},
        {"skill": "Python", "score": 76, "verified": True, "trend": "+11"},
        {"skill": "SQL", "score": 68, "verified": False, "trend": "+20"},
        {"skill": "REST API", "score": 78, "verified": True, "trend": "+38"},
        {"skill": "Git", "score": 84, "verified": True, "trend": "+9"},
        {"skill": "FastAPI", "score": 72, "verified": False, "trend": "+27"},
        {"skill": "HTML", "score": 90, "verified": True, "trend": "+0"},
        {"skill": "CSS", "score": 85, "verified": True, "trend": "+0"},
    ],
    "projects": [{"title": "Full Stack Task Manager", "score": 85, "completed": True}],
    "certifications": [{"title": "Backend Development Certificate", "skill": "REST API", "id": "CC-DEMO0001"}],
    "competencies": ["REST API Development", "Backend Development"],
}

DEMO_EFFECTIVENESS = {
    "effectiveness_score": 84,
    "skill_improvements": [
        {"skill": "REST API", "before": 40, "after": 78, "improvement": 38},
        {"skill": "SQL", "before": 48, "after": 68, "improvement": 20},
        {"skill": "FastAPI", "before": 45, "after": 72, "improvement": 27},
        {"skill": "JavaScript", "before": 72, "after": 82, "improvement": 10},
        {"skill": "Python", "before": 65, "after": 76, "improvement": 11},
    ],
    "summary": "Learning has improved your skills by an average of 21 points. REST API shows the biggest gain.",
}


# ---------------------------------------------------------------------------
# Helper: verify JWT token with Supabase
# ---------------------------------------------------------------------------

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        user = supabase.auth.get_user(credentials.credentials)
        return user.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ---------------------------------------------------------------------------
# Demo endpoints
# ---------------------------------------------------------------------------

@app.get("/api/demo/student")
def get_demo_student():
    return DEMO_STUDENT


@app.get("/api/demo/trainer")
def get_demo_trainer():
    return DEMO_TRAINER


# ---------------------------------------------------------------------------
# Assessment endpoints
# ---------------------------------------------------------------------------

@app.get("/api/assessment/questions")
def get_assessment_questions():
    return ASSESSMENT_QUESTIONS


@app.post("/api/assessment/score")
def score_assessment(submission: AssessmentSubmission):
    if len(submission.answers) != len(ASSESSMENT_QUESTIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Expected {len(ASSESSMENT_QUESTIONS)} answers, got {len(submission.answers)}",
        )

    skill_totals: dict[str, int] = {}
    skill_correct: dict[str, int] = {}
    for i, q in enumerate(ASSESSMENT_QUESTIONS):
        skill = q["skill"]
        skill_totals[skill] = skill_totals.get(skill, 0) + 1
        if submission.answers[i] == q["correct"]:
            skill_correct[skill] = skill_correct.get(skill, 0) + 1

    scores: dict[str, float] = {}
    for skill, total in skill_totals.items():
        correct = skill_correct.get(skill, 0)
        scores[skill] = round(50 + (correct / total) * 50, 1)

    total_correct = sum(skill_correct.values())
    return {
        "scores": scores,
        "total_correct": total_correct,
        "total_questions": len(ASSESSMENT_QUESTIONS),
    }


# ---------------------------------------------------------------------------
# Skill-gap endpoints
# ---------------------------------------------------------------------------

@app.post("/api/skill-gap/analyze")
def analyze_skill_gap(req: GapAnalysisRequest):
    requirements = ROLE_REQUIREMENTS.get(req.role)
    if not requirements:
        available = list(ROLE_REQUIREMENTS.keys())
        raise HTTPException(status_code=404, detail=f"Role not found. Available: {available}")

    gaps = []
    for skill, required in requirements.items():
        current = req.current_skills.get(skill, 0.0)
        gap = max(0.0, required - current)
        if gap == 0:
            status = "mastered"
        elif gap <= 10:
            status = "good"
        elif gap <= 25:
            status = "needs_work"
        else:
            status = "critical"

        priority = 1 if gap == 0 else (2 if gap <= 10 else (3 if gap <= 25 else 4))
        gaps.append({
            "skill": skill,
            "current": current,
            "required": required,
            "gap": round(gap, 1),
            "status": status,
            "priority": priority,
        })

    gaps.sort(key=lambda x: x["gap"], reverse=True)
    biggest_gap_skill = gaps[0]["skill"] if gaps else ""
    avg_gap = round(sum(g["gap"] for g in gaps) / len(gaps), 1) if gaps else 0.0

    try:
        supabase.table("skill_gap_analyses").insert({
            "role": req.role,
            "current_skills": req.current_skills,
            "gaps": gaps,
            "biggest_gap_skill": biggest_gap_skill,
            "avg_gap": avg_gap,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception:
        pass

    return {
        "gaps": gaps,
        "biggest_gap_skill": biggest_gap_skill,
        "avg_gap": avg_gap,
    }


# ---------------------------------------------------------------------------
# Learning endpoints
# ---------------------------------------------------------------------------

@app.get("/api/learning/modules")
def get_learning_modules(role: Optional[str] = None, limit: int = 10):
    try:
        query = supabase.table("learning_modules").select("*").order("position")
        if role:
            query = query.eq("role", role)
        result = query.limit(limit).execute()
        if result.data:
            return result.data
        return LEARNING_MODULES_FALLBACK[:limit]
    except Exception:
        return LEARNING_MODULES_FALLBACK[:limit]


@app.post("/api/learning/progress")
def save_learning_progress(update: ProgressUpdate):
    saved = False
    try:
        supabase.table("learning_progress").insert({
            "module_id": update.module_id,
            "score": update.score,
            "user_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        saved = True
    except Exception:
        pass
    return {"saved": saved}


@app.get("/api/learning/effectiveness")
def get_learning_effectiveness(
    before_skills: Optional[str] = None,
    after_skills: Optional[str] = None,
):
    if before_skills and after_skills:
        try:
            before = json.loads(before_skills)
            after = json.loads(after_skills)
            improvements = []
            for skill in after:
                b = before.get(skill, 0)
                a = after[skill]
                improvements.append({
                    "skill": skill,
                    "before": b,
                    "after": a,
                    "improvement": round(a - b, 1),
                })
            if improvements:
                avg_improvement = sum(i["improvement"] for i in improvements) / len(improvements)
                best = max(improvements, key=lambda x: x["improvement"])
                effectiveness_score = min(100, round(50 + avg_improvement * 1.5, 1))
                return {
                    "effectiveness_score": effectiveness_score,
                    "skill_improvements": improvements,
                    "summary": (
                        f"Learning has improved your skills by an average of "
                        f"{round(avg_improvement, 0):.0f} points. "
                        f"{best['skill']} shows the biggest gain."
                    ),
                }
        except Exception:
            pass
    return DEMO_EFFECTIVENESS


# ---------------------------------------------------------------------------
# Project endpoints
# ---------------------------------------------------------------------------

@app.get("/api/projects")
def get_projects():
    try:
        result = supabase.table("projects").select("*").execute()
        if result.data:
            return result.data
    except Exception:
        pass
    return [
        {
            "id": "proj1",
            "title": "Full Stack Task Manager",
            "description": "Build a full-stack task management app with user auth, REST API, and a JavaScript frontend.",
            "skills": ["HTML", "CSS", "JavaScript", "Python", "FastAPI", "SQL", "Authentication", "REST API", "Git"],
            "difficulty": "Advanced",
            "duration_hrs": 20,
            "objectives": [
                "Implement JWT authentication",
                "Design a REST API with FastAPI",
                "Build a dynamic frontend with vanilla JS",
                "Persist data in PostgreSQL",
            ],
        }
    ]


@app.post("/api/projects/{project_id}/submit")
def submit_project(project_id: str, submission: ProjectSubmission):
    saved = False
    score = 85
    try:
        supabase.table("project_submissions").insert({
            "project_id": project_id,
            "github_url": submission.github_url,
            "demo_url": submission.demo_url,
            "description": submission.description,
            "score": score,
            "user_id": None,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        saved = True
    except Exception:
        pass
    return {
        "score": score,
        "feedback": "Strong implementation. All required skills demonstrated.",
        "saved": saved,
    }


# ---------------------------------------------------------------------------
# Practical assessment endpoints
# ---------------------------------------------------------------------------

@app.post("/api/practical/evaluate")
def evaluate_practical(submission: PracticalSubmission):
    total = len(PRACTICAL_QUESTIONS)
    correct_count = 0
    pq_map = {q["id"]: q for q in PRACTICAL_QUESTIONS}
    for qid, chosen in submission.answers.items():
        q = pq_map.get(qid)
        if q and chosen == q["correct"]:
            correct_count += 1

    if submission.answers:
        raw_score = (correct_count / total) * 100
        score = max(50.0, round(raw_score, 1))
    else:
        score = 0.0

    status = "passed" if score >= 70 else "failed"

    course_completion = 90.0
    assessment_score = 82.0
    project_score = 85.0
    composite = round(
        course_completion * 0.25
        + assessment_score * 0.25
        + score * 0.30
        + project_score * 0.20,
        1,
    )
    verified = composite >= 75

    try:
        supabase.table("practical_assessments").insert({
            "answers": submission.answers,
            "score": score,
            "status": status,
            "correct": correct_count,
            "composite": composite,
            "verified": verified,
            "user_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception:
        pass

    return {
        "score": score,
        "status": status,
        "correct": correct_count,
        "total": total,
        "competency": {
            "course_completion": course_completion,
            "assessment_score": assessment_score,
            "practical_score": score,
            "project_score": project_score,
            "composite": composite,
        },
        "verified": verified,
    }


# ---------------------------------------------------------------------------
# Skill passport endpoint
# ---------------------------------------------------------------------------

@app.get("/api/skill-passport")
def get_skill_passport(
    demo: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
):
    if demo and demo.lower() == "true":
        return DEMO_PASSPORT

    if credentials:
        try:
            user = supabase.auth.get_user(credentials.credentials)
            user_id = user.user.id
            result = supabase.table("skill_passports").select("*").eq("user_id", user_id).single().execute()
            if result.data:
                return result.data
        except Exception:
            pass

    return DEMO_PASSPORT


# ---------------------------------------------------------------------------
# Opportunities endpoints
# ---------------------------------------------------------------------------

@app.get("/api/opportunities")
def get_opportunities():
    try:
        result = supabase.table("opportunities").select("*").execute()
        if result.data:
            return result.data
    except Exception:
        pass
    return OPPORTUNITIES_FALLBACK


@app.post("/api/opportunities/match")
def match_opportunities(req: OpportunityMatchRequest):
    try:
        result = supabase.table("opportunities").select("*").execute()
        opportunities = result.data if result.data else OPPORTUNITIES_FALLBACK
    except Exception:
        opportunities = OPPORTUNITIES_FALLBACK

    matched = []
    for opp in opportunities:
        required_skills: dict = opp.get("required_skills", {})
        if not required_skills:
            continue

        total_required = len(required_skills)
        met_skills = []
        missing_skills = []
        partial_credit = 0.0

        for skill, required_level in required_skills.items():
            student_level = req.skills.get(skill, 0.0)
            if student_level >= required_level:
                met_skills.append(skill)
            else:
                missing_skills.append(skill)
                if required_level > 0:
                    partial_credit += (student_level / required_level) * (1 / total_required)

        base_pct = (len(met_skills) / total_required) * 100
        match_pct = round(min(100.0, base_pct + partial_credit * 100 * 0.3), 1)

        next_skill_tip = ""
        if missing_skills:
            best_partial = -1.0
            for skill in missing_skills:
                req_level = required_skills[skill]
                student_level = req.skills.get(skill, 0.0)
                ratio = student_level / req_level if req_level > 0 else 0.0
                if ratio > best_partial:
                    best_partial = ratio
                    next_skill_tip = skill

        matched.append({
            "id": opp.get("id"),
            "title": opp.get("title"),
            "company": opp.get("company"),
            "type": opp.get("type"),
            "location": opp.get("location", ""),
            "description": opp.get("description", ""),
            "match_pct": match_pct,
            "met_skills": met_skills,
            "missing_skills": missing_skills,
            "next_skill_tip": next_skill_tip,
        })

    matched.sort(key=lambda x: x["match_pct"], reverse=True)
    return matched


# ---------------------------------------------------------------------------
# Trainer endpoints
# ---------------------------------------------------------------------------

@app.get("/api/trainer/dashboard")
def get_trainer_dashboard():
    dashboard = dict(DEMO_TRAINER)
    try:
        result = supabase.table("trainer_quality").select("*").limit(1).execute()
        if result.data:
            dashboard.update(result.data[0])
    except Exception:
        pass
    return dashboard


@app.get("/api/trainer/learners")
def get_trainer_learners():
    return DEMO_TRAINER["learners"]


@app.post("/api/trainer/feedback")
def submit_trainer_feedback(feedback: FeedbackInput):
    try:
        supabase.table("trainer_feedback").insert({
            "learner_name": feedback.learner_name,
            "rating": feedback.rating,
            "comment": feedback.comment,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception:
        pass
    return {
        "saved": True,
        "message": f"Feedback for {feedback.learner_name} recorded.",
    }


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------

@app.get('/api/admin/overview')
def admin_overview():
    return DEMO_ADMIN_STATS

@app.get('/api/admin/users')
def admin_users():
    return DEMO_USERS

@app.post('/api/admin/users/{user_id}/status')
def update_user_status(user_id: str, body: UserStatusUpdate):
    for u in DEMO_USERS:
        if u['id'] == user_id:
            u['status'] = body.status
            return {'updated': True, 'user': u}
    raise HTTPException(404, 'User not found')

@app.post('/api/admin/users/{user_id}/role')
def update_user_role(user_id: str, body: UserRoleUpdate):
    for u in DEMO_USERS:
        if u['id'] == user_id:
            u['role'] = body.role
            return {'updated': True, 'user': u}
    raise HTTPException(404, 'User not found')

@app.get('/api/admin/announcements')
def get_announcements():
    return DEMO_ANNOUNCEMENTS

@app.post('/api/admin/announcements')
def create_announcement(body: AnnouncementInput):
    import uuid
    ann = {'id': str(uuid.uuid4())[:8], 'title': body.title, 'body': body.body, 'date': datetime.now(timezone.utc).strftime('%Y-%m-%d')}
    DEMO_ANNOUNCEMENTS.insert(0, ann)
    return {'created': True, 'announcement': ann}

@app.delete('/api/admin/announcements/{ann_id}')
def delete_announcement(ann_id: str):
    global DEMO_ANNOUNCEMENTS
    DEMO_ANNOUNCEMENTS = [a for a in DEMO_ANNOUNCEMENTS if a['id'] != ann_id]
    return {'deleted': True}

# ---------------------------------------------------------------------------
# Extra Trainer endpoints
# ---------------------------------------------------------------------------

@app.get('/api/trainer/courses')
def get_trainer_courses():
    return DEMO_TRAINER_COURSES

@app.post('/api/trainer/courses')
def create_trainer_course(body: CourseInput):
    import uuid
    course = {'id': 'tc-' + str(uuid.uuid4())[:6], 'title': body.title, 'description': body.description, 'difficulty': body.difficulty, 'duration_hrs': body.duration_hrs, 'status': 'draft', 'students': 0}
    DEMO_TRAINER_COURSES.append(course)
    return {'created': True, 'course': course}

@app.delete('/api/trainer/courses/{course_id}')
def delete_trainer_course(course_id: str):
    global DEMO_TRAINER_COURSES
    DEMO_TRAINER_COURSES = [c for c in DEMO_TRAINER_COURSES if c['id'] != course_id]
    return {'deleted': True}

@app.post('/api/trainer/courses/{course_id}/publish')
def publish_trainer_course(course_id: str):
    for c in DEMO_TRAINER_COURSES:
        if c['id'] == course_id:
            c['status'] = 'published'
            return {'published': True, 'course': c}
    raise HTTPException(404, 'Course not found')

@app.get('/api/trainer/competency-match')
def trainer_competency_match():
    trainer_skills = ['Python', 'FastAPI', 'REST API', 'Authentication', 'SQL']
    matches = []
    for learner in DEMO_TRAINER['learners']:
        role = learner['role']
        req = ROLE_REQUIREMENTS.get(role, {})
        student_skills = DEMO_STUDENT['skills'] if learner['name'] == 'Alex Johnson' else {s: 60 for s in req}
        overlap = []
        for skill in trainer_skills:
            if skill in req:
                gap = max(0, req[skill] - student_skills.get(skill, 0))
                if gap > 5:
                    overlap.append({'skill': skill, 'gap': gap, 'required': req[skill], 'current': student_skills.get(skill, 0)})
        match_score = len(overlap) / max(1, len(req)) * 100 if overlap else 0
        matches.append({'learner': learner['name'], 'role': role, 'teachable_gaps': overlap, 'match_score': round(match_score, 1)})
    matches.sort(key=lambda x: x['match_score'], reverse=True)
    return {'trainer': 'Dr. Priya Sharma', 'expertise': trainer_skills, 'matches': matches}

# ---------------------------------------------------------------------------
# Frontend catch-all (must come after all API routes)
# ---------------------------------------------------------------------------

# Serve specific static files only (security: don't expose source code)
@app.get('/{full_path:path}', include_in_schema=False)
def frontend_catchall(full_path: str):
    # Serve known static files
    static_files = {'style.css', 'script.js', 'supabase-config.js'}
    if full_path in static_files:
        file_path = BASE / full_path
        if file_path.exists():
            return FileResponse(file_path)
    # Default: serve index.html for SPA routing
    return FileResponse(BASE / 'index.html')
