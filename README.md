# PRAISE
### _Product Review Attribute Insight Structuring Engine_

## Project Structure

```
app/
├── backend/         # Contains the FastAPI Python backend code
│   ├── main.py      # Main FastAPI application entry point
│   ├── pipeline.py  # Core processing logic
│   ├── prompts.py   # Prompts used for the model
│   ├── ...          # Other backend files (utils, model config, etc.)
├── frontend/        # Contains the frontend code
│   ├── src/         # Source files for the frontend application
│   ├── public/      # Static assets
│   ├── package.json # Frontend dependencies and scripts
│   ├── ...          # Other frontend config files (tailwind, postcss, tsconfig)
├── README.md        # This file
└── requirements.txt # Python dependencies for the backend
```

## Setup and Installation
Follow individual setup instructions or run the file `setup.sh` to automate the process.

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd app
    ```
2.  **Create and activate a virtual environment (optional but recommended):**
    ```bash
    python -m venv venv
    # On Windows
    venv\Scripts\activate
    # On macOS/Linux
    source venv/bin/activate
    ```
3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

## Features

*   **Backend API:** Built with FastAPI (Python) to handle requests and interact with Gemini.
*   **Frontend UI:** Developed with React and TypeScript, styled using Tailwind CSS.
*   **LLM:** Leverages Google's Gemini for multi step analysis.
*   **Data Handling:** Uses Pydantic for data validation in the backend.

## Program Logic

The core analysis is performed by the backend (`app/backend/pipeline.py`) through a multi-step process using the LLM:

1.  **Extract Attributes (`extract_review_attributes`)**: For each provided review, the model extracts factual product attributes mentioned.
2.  **Match with Description (`match_with_description`)**: The extracted attributes from each review are compared against the seller's product description. Each attribute is classified as `matching`, `missing`, `contradictory`, or `partially_matching`.
3.  **Categorize Attributes (`categorize_attributes`)**: All unique attributes identified across all reviews are grouped into logical categories (e.g., "Material", "Performance", etc.) by the model.
4.  **Organize Results (`organize_results`)**: The final output is structured by combining the matching status (from Step 2) and the category (from Step 3) for each attribute.

The FastAPI application (`app/backend/main.py`) serves as the interface, providing endpoints to:
*   Configure the API key (`/configure`).
*   Check API status (`/heartbeat`).
*   Create a unique session ID for each analysis (`/start_session`), by passing the seller decription and a list of reviews.
*   Run the analysis steps individually using sessions (`/extract`, `/match`, `/categorize`) by passing the session_id obtained from the previous step.

## Usage

1.  **Run the backend server:**
    *   Navigate to the `app/backend` directory.
    *   Start the Uvicorn server:
        ```bash
        uvicorn main:app --reload --port 8000
        ```
    *   The backend API will be available at `http://localhost:8000`.

2.  **Run the frontend development server:**
    *   Navigate to the `app/frontend` directory.
    *   Start the React server:
        ```bash
        npm start
        # or
        # yarn start
        ```
    *   Open your browser and go to `http://localhost:3000` (or the port specified by the server).