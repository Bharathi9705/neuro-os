import os
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
@app.post("/auth/login")
async def login(request: AuthRequest):
    """Simple authentication endpoint"""
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    return {"access_token": f"token_{request.email}", "token_type": "bearer", "email": request.email}

@app.post("/auth/signup")
async def signup(request: AuthRequest):
    """Simple signup endpoint"""
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    return {"access_token": f"token_{request.email}", "token_type": "bearer", "email": request.email}

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
            model="llama-3.3-70b-versatile",
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
        # Placeholder image URL - in production use Replicate or Hugging Face
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
