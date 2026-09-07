import os
import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
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
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class SkillGap(BaseModel):
    role: str
    skills: dict[str, float]

class Assessment(BaseModel):
    skill: str
    score: float = Field(ge=0, le=100)

class Effectiveness(BaseModel):
    competency: float = Field(ge=0, le=100)
    practical: float = Field(ge=0, le=100)
    project: float = Field(ge=0, le=100)
    path: float = Field(ge=0, le=100)
    retention: float = Field(ge=0, le=100)

class CourseInput(BaseModel):
    title: str
    description: str = ""
    category: str = "General"
    difficulty: str = "Beginner"
    thumbnail_url: str | None = None
    duration_minutes: int = Field(default=0, ge=0)

class CourseStatus(BaseModel):
    status: str

class ApprovalInput(BaseModel):
    status: str

class RoleInput(BaseModel):
    role: str

def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        response = supabase.auth.get_user(credentials.credentials)
        user = response.user
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired session") from exc
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user

def user_profile(user):
    result = supabase.table("profiles").select("id,full_name,email,role,approval_status").eq("id", user.id).single().execute()
    if not result.data:
        raise HTTPException(status_code=403, detail="Profile not found")
    return result.data

def require_role(user, *roles, approved_trainer=False):
    profile = user_profile(user)
    if profile["role"] not in roles:
        raise HTTPException(status_code=403, detail="You are not authorized for this action")
    if approved_trainer and (profile.get("approval_status") != "approved"):
        raise HTTPException(status_code=403, detail="Trainer approval is required")
    return profile

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Capacity Connect", "backend": "Supabase"}

@app.get("/api/me")
def me(user=Depends(current_user)):
    return user_profile(user)

@app.get("/api/roles")
def roles():
    r = supabase.table("roles").select("id,name,description").execute()
    return r.data or []

@app.get("/api/role/{role_id}/skills")
def role_skills(role_id: str):
    r = supabase.table("role_skills").select("skill_id,required_level,skills(id,name)").eq("role_id", role_id).execute()
    return r.data or []

@app.post("/api/skill-gap")
def save_skill_gap(data: SkillGap, user=Depends(current_user)):
    payload = {"user_id": user.id, "role": data.role, "skills": data.skills, "created_at": datetime.now(timezone.utc).isoformat()}
    r = supabase.table("skill_gap_analyses").insert(payload).execute()
    return {"id": r.data[0]["id"] if r.data else None, "message": "Skill-gap analysis saved"}

@app.post("/api/assessment")
def save_assessment(data: Assessment, user=Depends(current_user)):
    r = supabase.table("assessments").insert({"user_id": user.id, "skill": data.skill, "score": data.score}).execute()
    return {"id": r.data[0]["id"] if r.data else None, "passed": data.score >= 70, "certificate_eligible": data.score >= 70}

@app.post("/api/effectiveness")
def effectiveness(data: Effectiveness):
    score = round(data.competency*.25 + data.practical*.35 + data.project*.20 + data.path*.10 + data.retention*.10)
    return {"score": score, "breakdown": data.model_dump()}

@app.get("/api/trainers")
def trainers():
    r = supabase.table("trainer_quality").select("*").order("quality_score", desc=True).execute()
    return r.data or []

@app.get("/api/trainer/courses")
def trainer_courses(user=Depends(current_user)):
    profile = require_role(user, "trainer", "admin", approved_trainer=True)
    query = supabase.table("courses").select("*").order("updated_at", desc=True)
    if profile["role"] == "trainer":
        query = query.eq("trainer_id", user.id)
    result = query.execute()
    return result.data or []

@app.post("/api/trainer/courses")
def create_course(data: CourseInput, user=Depends(current_user)):
    require_role(user, "trainer", approved_trainer=True)
    if data.difficulty not in {"Beginner", "Intermediate", "Advanced"}:
        raise HTTPException(status_code=422, detail="Invalid difficulty")
    payload = data.model_dump()
    payload["trainer_id"] = user.id
    result = supabase.table("courses").insert(payload).execute()
    return result.data[0] if result.data else {}

@app.patch("/api/trainer/courses/{course_id}")
def update_course(course_id: str, data: CourseInput, user=Depends(current_user)):
    profile = require_role(user, "trainer", "admin", approved_trainer=True)
    query = supabase.table("courses").update(data.model_dump()).eq("id", course_id)
    if profile["role"] == "trainer":
        query = query.eq("trainer_id", user.id)
    result = query.execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Course not found or not owned by you")
    return result.data[0]

@app.post("/api/trainer/courses/{course_id}/status")
def update_course_status(course_id: str, data: CourseStatus, user=Depends(current_user)):
    profile = require_role(user, "trainer", "admin", approved_trainer=True)
    if data.status not in {"draft", "pending", "published", "rejected"}:
        raise HTTPException(status_code=422, detail="Invalid course status")
    query = supabase.table("courses").update({"status": data.status}).eq("id", course_id)
    if profile["role"] == "trainer":
        query = query.eq("trainer_id", user.id)
    result = query.execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Course not found or not owned by you")
    return result.data[0]

@app.delete("/api/trainer/courses/{course_id}")
def delete_course(course_id: str, user=Depends(current_user)):
    profile = require_role(user, "trainer", "admin", approved_trainer=True)
    query = supabase.table("courses").delete().eq("id", course_id)
    if profile["role"] == "trainer":
        query = query.eq("trainer_id", user.id)
    result = query.execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Course not found or not owned by you")
    return {"deleted": True}

@app.get("/api/admin/overview")
def admin_overview(user=Depends(current_user)):
    require_role(user, "admin")
    profiles = supabase.table("profiles").select("role,approval_status").execute().data or []
    courses = supabase.table("courses").select("status").execute().data or []
    enrollments = supabase.table("enrollments").select("progress").execute().data or []
    return {
        "students": sum(row["role"] == "student" for row in profiles),
        "trainers": sum(row["role"] == "trainer" for row in profiles),
        "admins": sum(row["role"] == "admin" for row in profiles),
        "pending_trainers": sum(row["role"] == "trainer" and row.get("approval_status") == "pending" for row in profiles),
        "courses": len(courses),
        "published_courses": sum(row["status"] == "published" for row in courses),
        "enrollments": len(enrollments),
        "completion_rate": round(sum(float(row["progress"]) for row in enrollments) / len(enrollments)) if enrollments else 0,
    }

@app.get("/api/admin/users")
def admin_users(user=Depends(current_user)):
    require_role(user, "admin")
    return supabase.table("profiles").select("id,full_name,email,role,approval_status,created_at").order("created_at", desc=True).execute().data or []

@app.post("/api/admin/users/{user_id}/approval")
def update_trainer_approval(user_id: str, data: ApprovalInput, user=Depends(current_user)):
    require_role(user, "admin")
    if data.status not in {"approved", "rejected", "disabled"}:
        raise HTTPException(status_code=422, detail="Invalid approval status")
    result = supabase.table("profiles").update({"approval_status": data.status}).eq("id", user_id).eq("role", "trainer").execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Trainer not found")
    return result.data[0]

@app.post("/api/admin/users/{user_id}/role")
def update_user_role(user_id: str, data: RoleInput, user=Depends(current_user)):
    require_role(user, "admin")
    if data.role not in {"student", "trainer", "admin"} or user_id == user.id:
        raise HTTPException(status_code=422, detail="Invalid role change")
    result = supabase.table("profiles").update({"role": data.role, "approval_status": "pending" if data.role == "trainer" else "approved"}).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]

# Knowledge-base search. Documents/chunks are stored in Supabase.
# If pgvector/RAG is added later, replace this simple text search with a match_documents RPC.
@app.get("/api/knowledge/search")
def knowledge_search(q: str, limit: int = 8):
    if not q.strip():
        raise HTTPException(400, "Query is required")
    words = [w for w in q.lower().split() if len(w) > 2][:5]
    rows = supabase.table("knowledge_chunks").select("id,document_id,title,content,source").limit(100).execute().data or []
    scored = []
    for row in rows:
        text = (row.get("title", "") + " " + row.get("content", "")).lower()
        score = sum(text.count(w) for w in words)
        if score:
            scored.append((score, row))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [x[1] for x in scored[:limit]]

# Serve the static frontend.
@app.get("/login", include_in_schema=False)
@app.get("/signup", include_in_schema=False)
@app.get("/reset-password", include_in_schema=False)
@app.get("/student-dashboard", include_in_schema=False)
@app.get("/trainer-dashboard", include_in_schema=False)
@app.get("/admin-dashboard", include_in_schema=False)
def frontend_route():
    return FileResponse(BASE / "index.html")

app.mount("/", StaticFiles(directory=BASE, html=True), name="frontend")
