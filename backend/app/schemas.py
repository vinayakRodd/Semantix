from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


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


class CompressionMetrics(BaseModel):
    original_tokens: int = Field(..., description="Total tokens before compression")
    compressed_tokens: int = Field(..., description="Total tokens after compression")
    tokens_saved: int = Field(..., description="Absolute token reduction")
    reduction_percentage: float = Field(..., description="Percentage of tokens saved")
    original_cost_usd: float = Field(..., description="Estimated cost of original tokens (USD)")
    compressed_cost_usd: float = Field(..., description="Estimated cost of compressed tokens (USD)")
    cost_saved_usd: float = Field(..., description="Estimated money saved (USD)")
    processing_time_ms: float = Field(..., description="Processing latency in milliseconds")


class CompressChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="Conversation messages to evaluate and compress")


class CompressChatResponse(BaseModel):
    success: bool = True
    metrics: CompressionMetrics
    compressed_messages: List[ChatMessage]
    error: Optional[str] = None


class TopicSegment(BaseModel):
    id: str = Field(..., description="Unique identifier for the topic cluster")
    title: str = Field(..., description="Human-readable title for the topic")
    turn_indices: List[int] = Field(..., description="Indices of conversation turns belonging to this topic")
    turn_count: int = Field(..., description="Total number of turns in this topic")
    keywords: List[str] = Field(default_factory=list, description="Top keywords characterizing this topic")


class SegmentTopicsRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="Conversation messages to cluster into subtopics")


class SegmentTopicsResponse(BaseModel):
    success: bool = True
    total_topics: int
    topics: List[TopicSegment]
    error: Optional[str] = None
