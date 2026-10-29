import re
import time
from typing import List, Tuple
import tiktoken

from backend.app.schemas import ChatMessage, CompressionMetrics, CompressChatResponse

# Cost per token based on GPT-4o standard pricing ($2.50 / 1M input, $10.00 / 1M output)
INPUT_PRICE_PER_TOKEN = 2.50 / 1_000_000
OUTPUT_PRICE_PER_TOKEN = 10.00 / 1_000_000

# Common conversational opening fluff patterns
OPENING_FILLER_REGEX = re.compile(
    r"^(?:(?:Sure|Certainly|Of course|I'd be happy to help|I would be glad to help|Great question|No problem|Alright|Hello|Hey there|Hi)[!,.]?\s*)+",
    re.IGNORECASE,
)

# Common conversational closing fluff patterns
CLOSING_FILLER_REGEX = re.compile(
    r"(?:\n\s*)*(?:Hope this helps[!.]?|Let me know if you (?:have any (?:other )?questions|need (?:further|more) (?:help|details)|want to explore more)[!.]?|Feel free to ask (?:follow-up )?questions[!.]?)\s*$",
    re.IGNORECASE,
)

# Trivial acknowledgments that carry negligible semantic information
TRIVIAL_TURNS = {
    "ok",
    "okay",
    "k",
    "thanks",
    "thank you",
    "thanks!",
    "thank you!",
    "got it",
    "gotcha",
    "cool",
    "nice",
    "great",
    "understood",
}


class CompressionService:
    def __init__(self):
        try:
            self.encoder = tiktoken.get_encoding("o200k_base")
        except Exception:
            self.encoder = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        if not text:
            return 0
        return len(self.encoder.encode(text, disallowed_special=()))

    def compress_text(self, text: str, role: str) -> str:
        """Deterministic local compression without semantic loss."""
        if not text:
            return ""

        compressed = text

        # Strip conversational pleasantries from assistant responses
        if role.lower() == "assistant":
            compressed = OPENING_FILLER_REGEX.sub("", compressed)
            compressed = CLOSING_FILLER_REGEX.sub("", compressed)

        # Normalize multiple blank lines (3+ to 2)
        compressed = re.sub(r"\n{3,}", "\n\n", compressed)

        # Normalize trailing whitespace on lines
        compressed = re.sub(r"[ \t]+$", "", compressed, flags=re.MULTILINE)

        return compressed.strip()

    def process(self, messages: List[ChatMessage]) -> CompressChatResponse:
        start_time = time.perf_counter()

        original_input_tokens = 0
        original_output_tokens = 0
        compressed_input_tokens = 0
        compressed_output_tokens = 0

        compressed_messages: List[ChatMessage] = []

        for msg in messages:
            content = msg.content or ""
            role = msg.role.lower()

            # Calculate original tokens
            tokens = self.count_tokens(content)
            if role == "assistant":
                original_output_tokens += tokens
            else:
                original_input_tokens += tokens

            # Skip standalone low-entropy conversational ping-pong turns
            clean_check = content.strip().lower()
            if clean_check in TRIVIAL_TURNS and len(messages) > 2:
                continue

            # Compress content
            compressed_content = self.compress_text(content, role)
            if not compressed_content:
                continue

            comp_tokens = self.count_tokens(compressed_content)
            if role == "assistant":
                compressed_output_tokens += comp_tokens
            else:
                compressed_input_tokens += comp_tokens

            compressed_messages.append(
                ChatMessage(
                    role=msg.role,
                    content=compressed_content,
                    timestamp=msg.timestamp,
                    model=msg.model,
                )
            )

        end_time = time.perf_counter()
        elapsed_ms = round((end_time - start_time) * 1000, 2)

        total_original = original_input_tokens + original_output_tokens
        total_compressed = compressed_input_tokens + compressed_output_tokens
        tokens_saved = max(0, total_original - total_compressed)

        reduction_percentage = (
            round((tokens_saved / total_original) * 100, 2) if total_original > 0 else 0.0
        )

        original_cost = (
            original_input_tokens * INPUT_PRICE_PER_TOKEN
            + original_output_tokens * OUTPUT_PRICE_PER_TOKEN
        )
        compressed_cost = (
            compressed_input_tokens * INPUT_PRICE_PER_TOKEN
            + compressed_output_tokens * OUTPUT_PRICE_PER_TOKEN
        )
        cost_saved = max(0.0, original_cost - compressed_cost)

        metrics = CompressionMetrics(
            original_tokens=total_original,
            compressed_tokens=total_compressed,
            tokens_saved=tokens_saved,
            reduction_percentage=reduction_percentage,
            original_cost_usd=round(original_cost, 6),
            compressed_cost_usd=round(compressed_cost, 6),
            cost_saved_usd=round(cost_saved, 6),
            processing_time_ms=elapsed_ms,
        )

        return CompressChatResponse(
            success=True,
            metrics=metrics,
            compressed_messages=compressed_messages,
        )


compression_service = CompressionService()
