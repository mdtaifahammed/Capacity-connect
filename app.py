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

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Capacity Connect", "backend": "Supabase"}

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
