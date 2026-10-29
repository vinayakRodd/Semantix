from typing import List
from backend.app.schemas import FetchChatResponse, SampleChatOption
from backend.app.parsers.base import BaseChatParser
from backend.app.parsers.samples import SampleChatParser, SAMPLE_CHATS
from backend.app.parsers.chatgpt import ChatGPTParser
from backend.app.parsers.generic import GenericChatParser


class ParserManager:
    def __init__(self):
        self.parsers: List[BaseChatParser] = [
            SampleChatParser(),
            ChatGPTParser(),
            GenericChatParser(),  # Fallback
        ]

    async def parse_url(self, url: str) -> FetchChatResponse:
        url = url.strip()
        if not url:
            raise ValueError("URL cannot be empty")

        for parser in self.parsers:
            if parser.can_handle(url):
                try:
                    return await parser.parse(url)
                except Exception as exc:
                    # If specific parser failed, let next fallback try if applicable
                    if isinstance(parser, GenericChatParser):
                        raise exc
                    continue

        raise ValueError(f"Unable to parse conversation from {url}")

    def get_sample_options(self) -> List[SampleChatOption]:
        return [
            SampleChatOption(
                id="fastapi-architecture",
                title="Python Async Architecture (ChatGPT-4o)",
                platform="ChatGPT",
                url="sample://fastapi-architecture",
                description="FastAPI, Pydantic v2 & Async httpx client discussion"
            ),
            SampleChatOption(
                id="claude-design-system",
                title="Dark Design Systems (Claude 3.5 Sonnet)",
                platform="Claude",
                url="sample://claude-design-system",
                description="Dark mode elevation, borders, typography & Radix styling"
            )
        ]


# Singleton instance
parser_manager = ParserManager()
