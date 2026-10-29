import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from backend.app.schemas import (
    FetchChatRequest,
    FetchChatResponse,
    SampleChatOption,
)
from backend.app.parsers.manager import parser_manager

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("meghu_backend")

app = FastAPI(
    title="Meghu LLM Chat Viewer Backend",
    description="Asynchronous Python FastAPI service to fetch and parse shared LLM conversations",
    version="1.0.0",
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "*",  # Allow during local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "meghu-chat-backend",
        "version": "1.0.0"
    }


@app.get("/api/samples", response_model=List[SampleChatOption])
async def list_samples():
    """Returns sample LLM conversations that can be previewed without live fetching."""
    return parser_manager.get_sample_options()


@app.post("/api/fetch-chat", response_model=FetchChatResponse)
async def fetch_chat(payload: FetchChatRequest):
    """
    Receives an LLM share URL (ChatGPT, Claude, or sample) and returns
    the structured conversation thread with title, roles, and message content.
    """
    url = payload.url.strip()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL parameter is required and cannot be empty."
        )

    logger.info(f"Received request to fetch chat for URL: {url}")
    try:
        result = await parser_manager.parse_url(url)
        return result
    except Exception as exc:
        logger.error(f"Failed to parse chat from URL {url}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unable to extract conversation: {str(exc)}"
        )
