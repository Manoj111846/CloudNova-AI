import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, Field, EmailStr
from pwdlib import PasswordHash
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "cloudnova.db"
router = APIRouter(prefix="/api/auth", tags=["Authentication"])
password_hash = PasswordHash.recommended()
SESSION_COOKIE = "cloudnova_session"
SESSION_MAX_AGE = 60 * 60 * 24 * 7

class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

def get_secret() -> str:
    return os.getenv("SESSION_SECRET", "").strip()

def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection

def init_auth_db():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

def serializer():
    secret = get_secret()
    if not secret:
        raise HTTPException(status_code=500, detail="Server authentication is not configured.")
    return URLSafeTimedSerializer(secret)

def create_session_token(user_id: int) -> str:
    return serializer().dumps({"user_id": user_id}, salt="cloudnova-auth")

def set_session(response: Response, user_id: int):
    response.set_cookie(
        SESSION_COOKIE, create_session_token(user_id), httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="lax", max_age=SESSION_MAX_AGE, path="/",
    )

def get_current_user(request: Request):
    token = request.cookies.get(SESSION_COOKIE)
    if not token or not get_secret():
        raise HTTPException(status_code=401, detail="Please log in first.")
    try:
        data = serializer().loads(token, salt="cloudnova-auth", max_age=SESSION_MAX_AGE)
    except (BadSignature, SignatureExpired):
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    with get_connection() as connection:
        user = connection.execute(
            "SELECT id, name, email FROM users WHERE id = ?", (data.get("user_id"),)
        ).fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Account not found.")
    return dict(user)

@router.post("/signup", status_code=201)
def signup(payload: SignupRequest, response: Response):
    name = payload.name.strip()
    email = str(payload.email).strip().lower()
    if not name:
        raise HTTPException(status_code=422, detail="Enter a valid name.")
    hashed = password_hash.hash(payload.password)
    try:
        with get_connection() as connection:
            cursor = connection.execute(
                "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
                (name, email, hashed, datetime.now(timezone.utc).isoformat()),
            )
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    set_session(response, user_id)
    return {"message": "Account created successfully.", "user": {"id": user_id, "name": name, "email": email}}

@router.post("/login")
def login(payload: LoginRequest, response: Response):
    email = str(payload.email).strip().lower()
    with get_connection() as connection:
        user = connection.execute(
            "SELECT id, name, email, password_hash FROM users WHERE email = ?", (email,)
        ).fetchone()
    if not user or not password_hash.verify(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    set_session(response, user["id"])
    return {"message": "Logged in successfully.", "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"message": "Logged out successfully."}

@router.get("/me")
def me(request: Request):
    return {"user": get_current_user(request)}
