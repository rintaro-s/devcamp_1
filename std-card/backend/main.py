from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import requests
import json
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware

app = FastAPI()

# Add CORS middleware
origins = [
    "http://localhost",
    "http://localhost:5173", # Frontend URL
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# In-memory storage for flashcards
# In a real application, this would be a database
flashcards_db = []
card_id_counter = 0

class Flashcard(BaseModel):
    id: int = None
    question: str
    answer: str

# LM Studio API configuration
LM_STUDIO_API_URL = "http://localhost:1234/v1/chat/completions"

@app.get("/")
async def read_root():
    return {"message": "フラッシュカードAIツールへようこそ！"}

@app.post("/generate-card/")
async def generate_card(query: Dict[str, str]):
    global card_id_counter
    user_query = query.get("query", "")

    if not user_query:
        raise HTTPException(status_code=400, detail="クエリが提供されていません。")

    # Prompt for the LLM to generate a flashcard in JSON format
    # Instruct the LLM to output ONLY the JSON, no other text.
    prompt = f"""以下のトピックについて、質問と回答の形式で暗記カードを生成してください。回答は簡潔にしてください。出力はJSON形式のみで、他のテキストは含めないでください。JSONのキーは "question" と "answer" としてください。

トピック: {user_query}

例:
{{"question": "日本の首都は？", "answer": "東京"}}
"""

    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "messages": [
            {
                "role": "system",
                "content": "あなたは暗記カードを生成するAIアシスタントです。"
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7,
        "max_tokens": 1500, # Adjust as needed
        "stream": False
    }

    try:
        response = requests.post(LM_STUDIO_API_URL, headers=headers, json=payload)
        response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
        lm_studio_response = response.json()

        # Extract content from the LLM response
        llm_content = lm_studio_response["choices"][0]["message"]["content"]
        
        # Attempt to parse the JSON content
        try:
            card_data = json.loads(llm_content)
            question = card_data.get("question")
            answer = card_data.get("answer")

            if not question or not answer:
                raise ValueError("LLMからの応答が期待されるJSON形式ではありませんでした。")

            card_id_counter += 1
            new_card = Flashcard(id=card_id_counter, question=question, answer=answer)
            return new_card
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail=f"LLMからの応答をJSONとして解析できませんでした: {llm_content}")
        except ValueError as ve:
            raise HTTPException(status_code=500, detail=f"LLM応答の解析エラー: {ve}")

    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="LM Studioサーバーに接続できません。LM Studioが実行中であることを確認してください。")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="LM Studioサーバーからの応答がタイムアウトしました。")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"LM Studio APIリクエストエラー: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"予期せぬエラーが発生しました: {e}")

@app.post("/save-card/")
async def save_card(card: Flashcard):
    if card.id is None:
        global card_id_counter
        card_id_counter += 1
        card.id = card_id_counter
    flashcards_db.append(card.dict())
    return {"message": "カードが正常に保存されました！", "card": card}

@app.get("/cards/", response_model=List[Flashcard])
async def get_all_cards():
    return flashcards_db

@app.get("/cards/{card_id}", response_model=Flashcard)
async def get_card(card_id: int):
    for card in flashcards_db:
        if card["id"] == card_id:
            return card
    raise HTTPException(status_code=404, detail="カードが見つかりません。")

@app.delete("/cards/{card_id}")
async def delete_card(card_id: int):
    global flashcards_db
    initial_len = len(flashcards_db)
    flashcards_db = [card for card in flashcards_db if card["id"] != card_id]
    if len(flashcards_db) < initial_len:
        return {"message": "カードが正常に削除されました！"}
    raise HTTPException(status_code=404, detail="カードが見つかりません。")
