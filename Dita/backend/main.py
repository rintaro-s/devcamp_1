from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import uuid
import json

# --- Pydantic Models ---
class OpinionIn(BaseModel):
    text: str
    parent_node: str | None = None

class OpinionOut(BaseModel):
    id: str
    text: str
    parent_node: str | None
    opinion_type: str
    summary: str
    spectrum_scores: dict[str, int]
    author: str | None = "あなた"

class AvatarIn(BaseModel):
    name: str
    parent_node: str | None = None

# --- FastAPI App ---
app = FastAPI()

# --- CORS Middleware ---
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5001",
    "http://localhost:5002",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LM Studio Configuration ---
LMSTUDIO_API_URL = "http://localhost:1234/v1/chat/completions"
LMSTUDIO_MODEL = "local-model" # Use "local-model" for LM Studio

# --- System Prompts ---
ANALYZE_SYSTEM_PROMPT = """
You are an expert debate analyst. A user has submitted an opinion. Your task is to analyze it and provide a structured JSON output. The JSON object must contain the following keys:
- "opinion_type": Classify the opinion as one of the following strings: 'agreement', 'counterargument', 'question', or 'clarification'.
- "summary": A concise, one-sentence summary of the user's core argument.
- "spectrum_scores": A JSON object with scores from 0 to 100 for "logicality", "emotion", "novelty", and "concreteness".
Do not include any other text or explanations in your response, only the raw JSON object.
"""

def get_avatar_prompt(avatar_name: str) -> str:
    prompts = {
        "ソクラテス": "You are Socrates. Respond to the user's last point by asking a probing, philosophical question that challenges their assumptions. Your response should be in the persona of Socrates. Structure your output as a JSON object with the same keys as the debate analyst.",
        "スティーブ・ジョブズ": "You are Steve Jobs. Respond to the user's last point with a visionary, product-focused, and slightly arrogant counterargument. Your response should be in the persona of Steve Jobs. Structure your output as a JSON object with the same keys as the debate analyst.",
        "未来の歴史家": "You are a historian from the year 2200. Provide a long-term, historical perspective on the user's last point. Your response should be in the persona of a future historian. Structure your output as a JSON object with the same keys as the debate analyst."
    }
    return prompts.get(avatar_name, ANALYZE_SYSTEM_PROMPT) # Default to analyst if name is unknown

# --- API Endpoints ---
@app.post("/analyze-opinion", response_model=OpinionOut)
async def analyze_opinion(opinion: OpinionIn):
    payload = {
        "model": LMSTUDIO_MODEL,
        "messages": [
            {"role": "system", "content": ANALYZE_SYSTEM_PROMPT},
            {"role": "user", "content": opinion.text}
        ],
        "temperature": 0.7,
        "response_format": {"type": "json_object"},
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(LMSTUDIO_API_URL, json=payload)
            response.raise_for_status()
            
            llm_response_data = json.loads(response.json()["choices"][0]["message"]["content"])

            return OpinionOut(
                id=str(uuid.uuid4()),
                text=opinion.text,
                parent_node=opinion.parent_node,
                **llm_response_data
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Error connecting to LM Studio: {e}")
    except (json.JSONDecodeError, KeyError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {e}")


@app.post("/invoke-avatar", response_model=OpinionOut)
async def invoke_avatar(req: AvatarIn):
    system_prompt = get_avatar_prompt(req.name)
    payload = {
        "model": LMSTUDIO_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            # In a real app, you'd pass the recent conversation history here
            {"role": "user", "content": "Based on the last point, what is your opinion?"} 
        ],
        "temperature": 0.8,
        "response_format": {"type": "json_object"},
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(LMSTUDIO_API_URL, json=payload)
            response.raise_for_status()

            llm_response_data = json.loads(response.json()["choices"][0]["message"]["content"])
            
            # The LLM generates the core text, so we use its summary as the main text
            generated_text = llm_response_data.get("summary", "No text generated.")

            return OpinionOut(
                id=str(uuid.uuid4()),
                text=generated_text,
                parent_node=req.parent_node,
                author=req.name,
                **llm_response_data
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Error connecting to LM Studio: {e}")
    except (json.JSONDecodeError, KeyError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {e}")