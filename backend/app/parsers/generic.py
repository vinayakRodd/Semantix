import re
from typing import List
import httpx
from bs4 import BeautifulSoup

from backend.app.schemas import ChatMessage, FetchChatResponse
from backend.app.parsers.base import BaseChatParser


class GenericChatParser(BaseChatParser):
    def can_handle(self, url: str) -> bool:
        return True  # Fallback handler for any web URL

    async def parse(self, url: str) -> FetchChatResponse:
        # Normalize URL
        target_url = url.strip()
        if not target_url.startswith(("http://", "https://")):
            target_url = "https://" + target_url

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=12.0) as client:
            resp = await client.get(target_url)
            if resp.status_code != 200:
                raise ValueError(f"HTTP request to {target_url} failed with status code {resp.status_code}")
            html = resp.text

        soup = BeautifulSoup(html, "html.parser")
        
        # Determine platform
        platform = "Web Conversation"
        if "claude.ai" in target_url:
            platform = "Claude"
        elif "perplexity.ai" in target_url:
            platform = "Perplexity"
        elif "v0.dev" in target_url:
            platform = "v0"
        elif "gemini.google" in target_url:
            platform = "Google Gemini"

        # Determine Title
        title = ""
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            title = og_title["content"].strip()
        elif soup.title and soup.title.string:
            title = soup.title.string.strip()
        if not title:
            title = f"Shared Chat from {platform}"

        messages: List[ChatMessage] = []

        # Try to find message-like sections (role / turn markers)
        role_elements = soup.find_all(lambda tag: tag.has_attr("data-role") or tag.has_attr("data-author"))
        for elem in role_elements:
            role = elem.get("data-role") or elem.get("data-author") or "user"
            text = elem.get_text(separator="\n", strip=True)
            if text:
                messages.append(ChatMessage(role=role, content=text))

        # Check Claude or Next.js embedded JSON scripts
        if not messages:
            for script in soup.find_all("script", type="application/json"):
                try:
                    s_text = script.string or ""
                    if "conversation" in s_text.lower() or "messages" in s_text.lower():
                        import json
                        data = json.loads(s_text)
                        # Traverse dict for messages
                        found = self._extract_messages_from_json(data)
                        if found:
                            messages.extend(found)
                            break
                except Exception:
                    continue

        # Check article / main or paragraph content if still empty
        if not messages:
            og_desc = soup.find("meta", property="og:description")
            if og_desc and og_desc.get("content"):
                messages.append(ChatMessage(role="assistant", content=og_desc["content"].strip()))

            main_content = soup.find("main") or soup.find("article")
            if main_content:
                paragraphs = [p.get_text(strip=True) for p in main_content.find_all(["p", "pre", "h2", "h3"])]
                text_blocks = [p for p in paragraphs if len(p) > 20]
                if text_blocks and not messages:
                    # Alternate or group
                    messages.append(ChatMessage(role="user", content="Extracted conversation content:"))
                    messages.append(ChatMessage(role="assistant", content="\n\n".join(text_blocks[:6])))

        if not messages:
            raise ValueError(
                f"Could not extract dialogue turns from {target_url}. The page may require authentication or Javascript rendering."
            )

        return FetchChatResponse(
            success=True,
            title=title,
            platform=platform,
            url=target_url,
            messages=messages,
            message_count=len(messages),
            metadata={"source": "generic_parser"}
        )

    def _extract_messages_from_json(self, obj) -> List[ChatMessage]:
        messages = []
        if isinstance(obj, dict):
            if "role" in obj and ("content" in obj or "text" in obj):
                content = obj.get("content") or obj.get("text")
                if isinstance(content, list):
                    content = "\n".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content])
                if content and str(content).strip():
                    messages.append(ChatMessage(role=str(obj["role"]), content=str(content)))
            for v in obj.values():
                messages.extend(self._extract_messages_from_json(v))
        elif isinstance(obj, list):
            for item in obj:
                messages.extend(self._extract_messages_from_json(item))
        return messages
