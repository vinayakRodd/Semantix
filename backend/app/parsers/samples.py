from typing import Dict, List
from backend.app.schemas import ChatMessage, FetchChatResponse, SampleChatOption
from backend.app.parsers.base import BaseChatParser

SAMPLE_CHATS: Dict[str, FetchChatResponse] = {
    "sample://fastapi-architecture": FetchChatResponse(
        success=True,
        title="Modern Python Async Architecture with FastAPI & Pydantic v2",
        platform="ChatGPT-4o",
        url="sample://fastapi-architecture",
        messages=[
            ChatMessage(
                role="user",
                content="How should I structure a clean, asynchronous FastAPI backend that integrates cleanly with a Next.js front-end?",
                timestamp="10:14 AM"
            ),
            ChatMessage(
                role="assistant",
                content="""Here is an industry-standard blueprint for structuring a **FastAPI** backend that pairs seamlessly with a **Next.js** frontend:

### 1. Directory Structure
```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   └── endpoints/    # Route controllers
│   ├── core/
│   │   ├── config.py         # Pydantic Settings
│   │   └── security.py       # Auth utilities
│   ├── models/               # Database ORM entities
│   ├── schemas/              # Pydantic DTOs
│   ├── services/             # Pure business logic
│   └── main.py               # FastAPI entrypoint & CORS
└── tests/
```

### 2. Key Principles
- **Strict DTO Validation:** Use `pydantic.BaseModel` for both request bodies and response schemas.
- **Async First:** Keep database calls and HTTP client requests non-blocking using `httpx.AsyncClient`.
- **CORS Configuration:** Explicitly allow your Next.js origins (`http://localhost:3000`).

Would you like an example of an asynchronous route using dependency injection?""",
                timestamp="10:14 AM",
                model="gpt-4o"
            ),
            ChatMessage(
                role="user",
                content="Yes please! Show me how to fetch external data with httpx asynchronously without blocking the event loop.",
                timestamp="10:15 AM"
            ),
            ChatMessage(
                role="assistant",
                content="""Here is how to create a resilient, non-blocking HTTP fetch service using `httpx.AsyncClient`:

```python
import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/fetch-external")
async def fetch_external_resource(target_url: str):
    headers = {"User-Agent": "SemantixBot/1.0"}
    timeout = httpx.Timeout(10.0, connect=5.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.get(target_url, headers=headers)
            response.raise_for_status()
            return {"status": "success", "data": response.json()}
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=f"External API error: {exc}")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Failed to reach host: {exc}")
```

### Why this is optimal:
1. `async with httpx.AsyncClient` manages connection pools properly.
2. It yields control back to the asyncio event loop while waiting for external I/O.
3. Structured error handling shields your API from unhandled upstream crashes.""",
                timestamp="10:15 AM",
                model="gpt-4o"
            )
        ],
        message_count=4,
        metadata={"category": "Backend Engineering", "tags": ["FastAPI", "Python", "Async"]}
    ),
    "sample://claude-design-system": FetchChatResponse(
        success=True,
        title="Building Dark-Themed Component Systems with Tailwind & Radix",
        platform="Claude 3.5 Sonnet",
        url="sample://claude-design-system",
        messages=[
            ChatMessage(
                role="user",
                content="What makes dark mode interfaces feel premium rather than just inverted gray?",
                timestamp="02:30 PM"
            ),
            ChatMessage(
                role="assistant",
                content="""Great question! Premium dark interfaces rely on **depth, atmospheric lighting, and deliberate contrast hierarchies** rather than simply turning backgrounds black `#000000`.

### 1. The Elevation Gradient
Instead of flat pure black everywhere:
- **Base Canvas:** Deep zinc/slate `#09090b` or `#0b0f17`
- **Surface / Cards:** `#121824` with a subtle `1px border border-white/[0.08]`
- **Overlays / Popovers:** `#182234` with soft ambient drop-shadows

### 2. Border Glows & Soft Highlights
Notice how modern tools (Linear, Raycast, Vercel) feel tactile:
```css
/* Subtle top inner highlight */
box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
```

### 3. Typography Hierarchy
- Primary text: `text-zinc-100` (soft off-white, easier on eyes than `#FFFFFF`)
- Secondary: `text-zinc-400`
- Muted / Meta: `text-zinc-500`

This creates rich visual layering without overwhelming contrast.""",
                timestamp="02:31 PM",
                model="claude-3-5-sonnet-20241022"
            )
        ],
        message_count=2,
        metadata={"category": "UI/UX Design", "tags": ["Dark Mode", "TailwindCSS", "Design Systems"]}
    )
}


class SampleChatParser(BaseChatParser):
    def can_handle(self, url: str) -> bool:
        clean = url.strip().lower()
        return clean.startswith("sample://") or clean in ("sample1", "sample2", "sample-fastapi", "sample-claude")

    async def parse(self, url: str) -> FetchChatResponse:
        clean = url.strip().lower()
        if "claude" in clean or "design" in clean:
            return SAMPLE_CHATS["sample://claude-design-system"]
        return SAMPLE_CHATS["sample://fastapi-architecture"]
