import uuid
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import pandas as pd
from pipeline import (
    check_heartbeat_status,
    complete_pipeline,
    extract_review_attributes,
    match_with_description,
    categorize_attributes,
    organize_results,
    test_model
)
from formatting_utils import (
    step1_markdown,
    step2_markdown,
    step3_markdown
)
from pydantic import BaseModel, Field
from typing import Dict, Any, List

api_key_configured = False
configured_api_key = None
MAX_WORKERS = 15 # set to 1 for serial operations

# Structure: { session_id: { "input": {...}, "step1_result": {...}, "step2_result": {...}, ... } }
session_data: Dict[str, Dict[str, Any]] = {}

app = FastAPI()

async def check_configuration():
    if not api_key_configured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API key not configured. Please configure via /configure endpoint first."
        )

async def get_session(session_id: str = Depends(lambda session_id: session_id)):
    session = session_data.get(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---Models---
class ApiKeyRequest(BaseModel):
    api_key: str = Field(..., min_length=1)

class StartSessionRequest(BaseModel):
    seller_description: str
    reviews: list[str]

class SessionIdRequest(BaseModel):
    session_id: str

# --- Endpoints ---
@app.post("/configure")
async def configure_api(request: ApiKeyRequest):
    """Configure the Gemini API key."""
    global api_key_configured, configured_api_key
    try:
        genai.configure(api_key=request.api_key)
        test_model.generate_content('test', generation_config=genai.types.GenerationConfig(max_output_tokens=1))
        
        api_key_configured = True
        configured_api_key = request.api_key

        # Reset to default value after successful configuration
        global MAX_WORKERS
        MAX_WORKERS = 15
        return {"message": "API key configured successfully."}
    except Exception as e:
        api_key_configured = False
        configured_api_key = None
        error_detail = f"Invalid API key or configuration failed: {str(e)}"
        if "API key not valid" in str(e):
            error_detail = "Invalid API Key provided."
        elif "RESOURCE_EXHAUSTED" in str(e):
             error_detail = "API quota exceeded. Please check your Gemini account."

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_detail)


@app.get("/heartbeat", dependencies=[Depends(check_configuration)])
async def get_heartbeat():
    """Check API status after configuration."""
    return {"status": check_heartbeat_status()}

@app.post("/start_session", dependencies=[Depends(check_configuration)])
async def start_session(request: StartSessionRequest):
    """Starts a new analysis session and returns a session ID."""
    session_id = str(uuid.uuid4())
    session_data[session_id] = {
        "input": request.dict(),
        "step1_extract": None,
        "step2_match": None,
        "step3_categorize": None,
        "step4_organize": None,
    }
    print(f"Started session: {session_id}")
    return {"session_id": session_id}

@app.get("/set_num_worker")
async def set_num_workers():
    """Enable/Disable parallel processing"""
    global MAX_WORKERS

    if MAX_WORKERS == 1:
        MAX_WORKERS = 15
    elif MAX_WORKERS == 15:
        MAX_WORKERS = 1

    return {"message": f"Parallel processing {'enabled' if MAX_WORKERS == 15 else 'disabled'}."}

@app.post("/extract", dependencies=[Depends(check_configuration)])
async def extract_attributes_session(request: SessionIdRequest):
    """Step 1: Extract factual details for a given session."""
    session = await get_session(request.session_id)
    if not session: # just in case, though get_session should handle it
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.get("step1_extract"):
        print(f"Using cached extraction for session: {request.session_id}")
        return session["step1_extract"]

    try:
        print(f"Running extraction for session: {request.session_id}")
        reviews = session["input"]["reviews"]
        extracted_attributes = extract_review_attributes(reviews, num_workers=MAX_WORKERS)
        markdown_output = step1_markdown(extracted_attributes)
        result = {"extracted_attributes": extracted_attributes, "markdown": markdown_output}
        session["step1_extract"] = result # caching the result
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@app.post("/match", dependencies=[Depends(check_configuration)])
async def match_attributes_session(request: SessionIdRequest):
    """Step 2: Match extracted attributes for a given session."""
    session = await get_session(request.session_id)
    if not session:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.get("step2_match"):
        print(f"Using cached matching for session: {request.session_id}")
        return session["step2_match"] # Return cached result

    if not session.get("step1_extract"):
        raise HTTPException(status_code=400, detail="Extraction step must be completed first for this session.")

    try:
        print(f"Running matching for session: {request.session_id}")
        seller_description = session["input"]["seller_description"]
        extracted_attributes = session["step1_extract"]["extracted_attributes"]
        all_dataframes = match_with_description(seller_description, extracted_attributes, num_workers=MAX_WORKERS)

        # serializable format (list of dicts)
        serializable_dataframes = [df.to_dict('records') for df in all_dataframes]
        markdown_output = step2_markdown(serializable_dataframes) # Use serializable format for markdown

        result = {"all_dataframes": serializable_dataframes, "markdown": markdown_output}
        session["step2_match"] = result # Cache the result
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")

@app.post("/categorize", dependencies=[Depends(check_configuration)])
async def categorize_session(request: SessionIdRequest):
    """Step 3: Group attributes into categories for a given session."""
    session = await get_session(request.session_id)
    if not session:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.get("step3_categorize"):
        print(f"Using cached categorization for session: {request.session_id}")
        return session["step3_categorize"] # Return cached result

    if not session.get("step2_match"):
        raise HTTPException(status_code=400, detail="Matching step must be completed first for this session.")

    try:
        print(f"Running categorization for session: {request.session_id}")
        serializable_dataframes = session["step2_match"]["all_dataframes"]

        # --- Robust DataFrame Reconstruction ---
        dataframes = []
        for i, df_dict in enumerate(serializable_dataframes):
            try:
                # Attempt to create DataFrame, handle empty dict list specifically
                if isinstance(df_dict, list): # It should be list of records
                     df = pd.DataFrame(df_dict)
                     dataframes.append(df)
                else:
                     # Log unexpected format if it's not a list (as expected from to_dict('records'))
                     print(f"Warning: Expected list of dicts for DataFrame #{i}, but got {type(df_dict)}. Skipping.")
                     dataframes.append(pd.DataFrame()) # Append empty DF to maintain list length if needed downstream
            except Exception as df_error:
                print(f"Error reconstructing DataFrame #{i} from dict: {df_dict}. Error: {str(df_error)}")
                # Append an empty DataFrame to avoid breaking downstream logic expecting a list
                dataframes.append(pd.DataFrame())
        # --- End Robust Reconstruction ---

        categories, _ = categorize_attributes(dataframes)
        # Check if categorize_attributes returned an error
        if isinstance(categories, dict) and categories.get('error'):
             raise Exception(f"Categorization pipeline step failed: {categories.get('error')}")

        results = organize_results(dataframes, categories) # organize_results expects list of DFs
        # Check if organize_results implicitly failed (e.g., returned unexpected structure) - basic check
        if not isinstance(results, dict) or not all(k in results for k in ["missing", "matching", "contradictory", "partially_matching"]):
             raise Exception("Organize results step produced invalid output structure.")

        markdown_output = step3_markdown(results)

        final_result = {"results": results, "markdown": markdown_output}
        session["step3_categorize"] = final_result # Cache the result
        return final_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Categorization failed: {str(e)}")


@app.post("/full_pipeline", dependencies=[Depends(check_configuration)])
async def analyze_product(request: StartSessionRequest): # Reuse StartSessionRequest model
    """Run the complete pipeline in one call (no session state used)."""
    try:
        results = complete_pipeline(request.seller_description, request.reviews)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
