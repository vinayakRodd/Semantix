from typing import List, Optional, Dict, Any
from pydantic import BaseModel, HttpUrl, Field


class FetchChatRequest(BaseModel):
    url: str = Field(..., description="The URL of the shared LLM conversation or sample identifier")


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' | 'assistant' | 'system'")
    content: str = Field(..., description="The message body / markdown text")
    timestamp: Optional[str] = Field(None, description="Message timestamp if available")
    model: Optional[str] = Field(None, description="Model identifier if available")


class FetchChatResponse(BaseModel):
    success: bool = True
    title: str = "Shared Conversation"
    platform: str = "generic"
    url: str
    messages: List[ChatMessage]
    message_count: int
    metadata: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None


class SampleChatOption(BaseModel):
    id: str
    title: str
    platform: str
    url: str
    description: str
