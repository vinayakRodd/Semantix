import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from backend.app.schemas import (
    FetchChatRequest,
    FetchChatResponse,
    SampleChatOption,
    CompressChatRequest,
    CompressChatResponse,
    SegmentTopicsRequest,
    SegmentTopicsResponse,
    GenerateDocumentRequest,
    GenerateDocumentResponse,
)
from backend.app.parsers.manager import parser_manager
from backend.app.services.compression import compression_service
from backend.app.services.segmentation import dialogue_segmentation_service
from backend.app.services.document_generator import document_generator_service

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("semantix_backend")

app = FastAPI(
    title="Semantix LLM Dialogue & Synthesis Matrix Backend",
    description="Asynchronous Python FastAPI service to fetch, parse, compress, and synthesize shared LLM conversations",
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
        "service": "semantix-backend",
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


@app.post("/api/compress-chat", response_model=CompressChatResponse)
async def compress_chat(payload: CompressChatRequest):
    """
    Evaluates token count via tiktoken, strips conversational fluff and low-entropy turns,
    and calculates reduction %, cost savings (USD), and latency (ms).
    """
    if not payload.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message array cannot be empty."
        )

    try:
        result = compression_service.process(payload.messages)
        return result
    except Exception as exc:
        logger.error(f"Error during conversation compression: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process compression metrics: {str(exc)}"
        )


@app.post("/api/segment-topics", response_model=SegmentTopicsResponse)
async def segment_topics(payload: SegmentTopicsRequest):
    """
    Analyzes conversation turns via deterministic NLP / TF-IDF keyword graphs
    and segments them into coherent, labeled subtopic clusters.
    """
    if not payload.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message array cannot be empty."
        )

    try:
        result = dialogue_segmentation_service.segment(payload.messages)
        return result
    except Exception as exc:
        logger.error(f"Error during dialogue segmentation: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to segment dialogue topics: {str(exc)}"
        )


@app.post("/api/generate-document", response_model=GenerateDocumentResponse)
async def generate_document(payload: GenerateDocumentRequest):
    """
    Synthesizes the conversation into structured documents:
    'study_notes', 'executive_summary', or 'decision_log'.
    """
    if not payload.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message array cannot be empty."
        )

    try:
        result = document_generator_service.generate(
            messages=payload.messages,
            doc_type=payload.document_type,
            title=payload.title,
        )
        return result
    except Exception as exc:
        logger.error(f"Error during document generation: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate structured document: {str(exc)}"
        )
