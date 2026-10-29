from abc import ABC, abstractmethod
from typing import Optional
from backend.app.schemas import FetchChatResponse


class BaseChatParser(ABC):
    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """Return True if this parser is designed for the given URL."""
        pass

    @abstractmethod
    async def parse(self, url: str) -> FetchChatResponse:
        """Fetch and parse the conversation from the given URL."""
        pass
