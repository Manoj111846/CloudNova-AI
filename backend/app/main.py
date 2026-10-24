from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env", override=True)

# Import after loading .env so authentication settings are available.
from backend.app.auth import get_current_user, init_auth_db, router as auth_router
from backend.app.schemas import ChatRequest, ChatResponse
from backend.app.services.ai_service import generate_reply

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_auth_db()
    yield

app = FastAPI(title="CloudNova AI API", version="0.2.0", lifespan=lifespan)
frontend = ROOT / "frontend"
app.mount("/assets", StaticFiles(directory=frontend / "assets"), name="assets")
app.include_router(auth_router)

@app.get("/", include_in_schema=False)
def home():
    return FileResponse(frontend / "index.html")

@app.get("/login", include_in_schema=False)
def login_page():
    return FileResponse(frontend / "login.html")

@app.get("/signup", include_in_schema=False)
def signup_page():
    return FileResponse(frontend / "signup.html")

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "CloudNova AI", "version": "0.2.0"}

@app.post("/api/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, request: Request):
    get_current_user(request)
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Message cannot be empty.")
    reply, mode = generate_reply(message)
    return ChatResponse(reply=reply, mode=mode)
