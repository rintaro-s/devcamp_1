from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import httpx
import json
import re
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000", # Your frontend origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Problem(BaseModel):
    id: int
    title: str
    description: str
    input_format: str
    output_format: str
    sample_input: str
    sample_output: str
    test_cases: List[Dict[str, str]] = [] # [{"input": "...", "output": "..."}]

class Submission(BaseModel):
    problem_id: int
    language: str
    code: str

# In-memory storage for problems and submissions (for demonstration)
problems_db: List[Problem] = []
next_problem_id = 1

@app.get("/")
async def read_root():
    return {"message": "Welcome to Proger Backend!"}

@app.get("/problems", response_model=List[Problem])
async def get_problems():
    return problems_db

@app.post("/problems", response_model=Problem)
async def create_problem(problem: Problem):
    global next_problem_id
    problem.id = next_problem_id
    next_problem_id += 1
    problems_db.append(problem)
    return problem

@app.post("/submit")
async def submit_code(submission: Submission):
    problem = next((p for p in problems_db if p.id == submission.problem_id), None)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # --- Code Execution in Sandbox ---
    # This calls a placeholder function. In a real system, this would
    # involve a secure sandboxed environment (e.g., Docker containers)
    # to execute the user's code against the problem's test cases.
    from .sandbox import execute_code_in_sandbox
    
    sandbox_result = await execute_code_in_sandbox(
        language=submission.language,
        code=submission.code,
        test_cases=problem.test_cases # Pass test cases to the sandbox
    )

    execution_success = sandbox_result.get("success", False)
    execution_output = sandbox_result.get("output", "")
    execution_error = sandbox_result.get("error", "")
    
    # --- LLM Integration using httpx (for LM Studio or similar local LLM API) ---
    LLM_API_URL = "http://localhost:1234/v1/chat/completions" # Default LM Studio endpoint

    prompt_messages = [
        {"role": "system", "content": "You are an expert competitive programming judge. Review the provided code and execution results. Provide a score out of 100, constructive comments, and specific improvement suggestions. Respond in JSON format only."},
        {"role": "user", "content": f'''"
        Problem Title: {problem.title}
        Problem Description: {problem.description}
        Submitted Language: {submission.language}
        Submitted Code:
        ```
        {submission.code}
        ```
        Simulated Execution Success: {execution_success}
        Simulated Execution Output: {execution_output}
        Simulated Execution Error: {execution_error}

        Please provide a review in the following JSON format:
        {{
            "score": <integer_score_out_of_100>,
            "comments": "<string_constructive_comments>",
            "improvements": ["<string_suggestion_1>", "<string_suggestion_2>", ...]
        }}
        '''}
    ]

    llm_review = {
        "score": 0,
        "comments": "LLM review failed or could not be parsed.",
        "improvements": ["Check LLM API connection.", "Ensure LLM provides valid JSON."],
        "execution_details": {
            "success": execution_success,
            "output": execution_output,
            "error": execution_error,
            "language": submission.language,
            "problem_id": submission.problem_id
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                LLM_API_URL,
                json={
                    "messages": prompt_messages,
                    "temperature": 0.7,
                    "max_tokens": 500,
                    # "model": "local-model" # Specify model if needed by your LM Studio setup
                },
                timeout=30.0 # Increased timeout for LLM response
            )
            response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
            llm_response_content = response.json()["choices"][0]["message"]["content"]
            
            # Attempt to parse the JSON content from the LLM's response
            # LLMs sometimes include markdown or extra text, so we try to extract the JSON part
            import json
            import re
            json_match = re.search(r'```json\n(.*)\n```', llm_response_content, re.DOTALL)
            if json_match:
                parsed_review = json.loads(json_match.group(1))
            else:
                parsed_review = json.loads(llm_response_content) # Try direct parse if no markdown

            llm_review["score"] = parsed_review.get("score", 0)
            llm_review["comments"] = parsed_review.get("comments", "No comments from LLM.")
            llm_review["improvements"] = parsed_review.get("improvements", [])

    except httpx.RequestError as e:
        llm_review["comments"] = f"LLM API request failed: {e}"
        llm_review["improvements"] = ["Ensure LM Studio is running and accessible at http://localhost:1234."]
    except httpx.HTTPStatusError as e:
        llm_review["comments"] = f"LLM API returned an error: {e.response.status_code} - {e.response.text}"
        llm_review["improvements"] = ["Check LM Studio logs for errors."]
    except json.JSONDecodeError as e:
        llm_review["comments"] = f"Failed to parse LLM response JSON: {e}. Raw response: {llm_response_content}"
        llm_review["improvements"] = ["Adjust LLM prompt to ensure valid JSON output."]
    except KeyError as e:
        llm_review["comments"] = f"Unexpected LLM response format: Missing key {e}. Raw response: {llm_response_content}"
        llm_review["improvements"] = ["Adjust LLM prompt to ensure expected JSON structure."]
    except Exception as e:
        llm_review["comments"] = f"An unexpected error occurred during LLM review: {e}"
        llm_review["improvements"] = ["Review backend logs."]

    return {"status": "Submission processed", "review": llm_review}