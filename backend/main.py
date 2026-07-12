import os
import json
import hashlib
import hmac
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import uvicorn

load_dotenv()

# Initialize Groq
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="NEURO-OS Backend Pro")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ Simple User Storage (JSON file — no DB needed) ============
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def hash_password(password: str, salt: str) -> str:
    # PBKDF2 — built into Python's standard library, no extra install needed
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()

def verify_password(password: str, salt: str, stored_hash: str) -> bool:
    computed = hash_password(password, salt)
    return hmac.compare_digest(computed, stored_hash)

# ============ Models ============
class ChatRequest(BaseModel):
    message: str
    agent: str = "general"

class ImageGenerationRequest(BaseModel):
    prompt: str

class AuthRequest(BaseModel):
    email: str
    password: str

# ============ Authentication ============
@app.post("/auth/signup")
async def signup(request: AuthRequest):
    """Real signup — stores a salted, hashed password."""
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    users = load_users()
    email_key = request.email.lower().strip()

    if email_key in users:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    salt = os.urandom(16).hex()
    users[email_key] = {
        "salt": salt,
        "hash": hash_password(request.password, salt),
    }
    save_users(users)

    return {"access_token": f"token_{email_key}", "token_type": "bearer", "email": email_key}

@app.post("/auth/login")
async def login(request: AuthRequest):
    """Real login — verifies password against stored hash."""
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Email and password required")

    users = load_users()
    email_key = request.email.lower().strip()

    user_record = users.get(email_key)
    if not user_record:
        raise HTTPException(status_code=401, detail="No account found with this email. Please sign up first.")

    if not verify_password(request.password, user_record["salt"], user_record["hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password")

    return {"access_token": f"token_{email_key}", "token_type": "bearer", "email": email_key}

# ============ Chat Endpoints ============
@app.get("/")
async def root():
    return {"message": "NEURO-OS Backend Pro is Running!", "version": "2.0"}

@app.get("/status")
async def status():
    return {"status": "online", "engine": "Groq (Llama 3.3)", "features": ["chat", "image-generation", "auth"]}

@app.post("/chat")
async def chat(request: ChatRequest):
    """Main chat endpoint powered by Groq Llama 3.3-70B"""
    try:
        system_prompt = {
            "general": "You are NEURO-OS, a helpful AI assistant. Provide clear, concise, and accurate responses.",
            "coding": "You are a coding expert. Provide well-structured code examples with explanations. Use markdown for code blocks.",
            "research": "You are a research assistant. Provide detailed, well-sourced information on various topics."
        }

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt.get(request.agent, system_prompt["general"])},
                {"role": "user", "content": request.message}
            ],
            model="llama-3.1-8b-instant",
        )

        return {"response": chat_completion.choices[0].message.content, "agent": request.agent}

    except Exception as e:
        print(f"Chat Error: {e}")
        return {"response": f"Error: {str(e)}", "agent": request.agent}

# ============ Image Generation ============
@app.post("/generate-image")
async def generate_image(request: ImageGenerationRequest):
    """Generate images using placeholder API"""
    try:
        image_url = f"https://via.placeholder.com/512x512?text={request.prompt[:30]}"
        return {"image_url": image_url, "prompt": request.prompt}

    except Exception as e:
        print(f"Image Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ Chat History ============
chat_history = {}

@app.post("/save-chat")
async def save_chat(user_id: str, chat_data: dict):
    """Save chat history for a user"""
    if user_id not in chat_history:
        chat_history[user_id] = []

    chat_history[user_id].append(chat_data)
    return {"status": "saved", "user_id": user_id}

@app.get("/get-chats/{user_id}")
async def get_chats(user_id: str):
    """Retrieve chat history for a user"""
    return {"chats": chat_history.get(user_id, [])}

# ============ Clear Endpoint ============
@app.post("/clear")
async def clear_chat():
    return {"status": "success"}

if __name__ == "__main__":
    print("--- NEURO-OS BACKEND PRO STARTING ON PORT 8001 ---")
    uvicorn.run(app, host="127.0.0.1", port=8001)