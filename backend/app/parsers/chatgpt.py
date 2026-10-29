import json
import re
from typing import List, Tuple, Optional
import httpx
from bs4 import BeautifulSoup

from backend.app.schemas import ChatMessage, FetchChatResponse
from backend.app.parsers.base import BaseChatParser


class ChatGPTParser(BaseChatParser):
    def can_handle(self, url: str) -> bool:
        clean = url.strip().lower()
        return ("chatgpt.com/share/" in clean or "chat.openai.com/share/" in clean)

    async def parse(self, url: str) -> FetchChatResponse:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=15.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise ValueError(f"HTTP request failed with status code {resp.status_code}")
            html = resp.text

        soup = BeautifulSoup(html, "html.parser")
        default_title = "Shared ChatGPT Conversation"
        if soup.title and soup.title.string:
            clean_title = soup.title.string.replace("ChatGPT - ", "").replace("ChatGPT", "").strip()
            if clean_title:
                default_title = clean_title

        title: Optional[str] = None
        messages: List[ChatMessage] = []

        # Strategy 1: Modern ChatGPT uses React Router / Remix streamController.enqueue
        stream_title, stream_messages = self._parse_react_router_stream(soup)
        if stream_messages:
            title = stream_title
            messages = stream_messages

        # Strategy 2: Legacy Next.js __NEXT_DATA__
        if not messages:
            next_data_script = soup.find("script", id="__NEXT_DATA__")
            if next_data_script and next_data_script.string:
                try:
                    data = json.loads(next_data_script.string)
                    page_props = data.get("props", {}).get("pageProps", {})
                    server_response = page_props.get("serverResponse", {})
                    chat_data = server_response.get("data", {})

                    if "title" in chat_data:
                        title = chat_data["title"]

                    if "linear_conversation" in chat_data:
                        for item in chat_data["linear_conversation"]:
                            role = item.get("message", {}).get("author", {}).get("role", "unknown")
                            parts = item.get("message", {}).get("content", {}).get("parts", [])
                            text = "\n\n".join([str(p) for p in parts if isinstance(p, str)])
                            if text:
                                messages.append(ChatMessage(role=role, content=text))
                    elif "mapping" in chat_data:
                        mapping = chat_data["mapping"]
                        nodes = []
                        for _, node in mapping.items():
                            msg = node.get("message")
                            if msg and msg.get("content") and msg.get("author"):
                                role = msg["author"].get("role")
                                parts = msg["content"].get("parts", [])
                                content = "\n\n".join([str(p) for p in parts if isinstance(p, str)])
                                if role in ("user", "assistant") and content.strip():
                                    create_time = msg.get("create_time") or 0
                                    nodes.append((create_time, role, content))
                        nodes.sort(key=lambda x: x[0])
                        for _, role, content in nodes:
                            messages.append(ChatMessage(role=role, content=content))
                except Exception:
                    pass

        # Strategy 3: Next.js App Router chunks (self.__next_f.push)
        if not messages:
            for script in soup.find_all("script"):
                s_text = script.string or ""
                if "self.__next_f.push" in s_text and "linear_conversation" in s_text:
                    try:
                        matches = re.findall(r'"parts":\s*(\[[^\]]+\])', s_text)
                        for match in matches:
                            try:
                                parts = json.loads(match)
                                text = "\n\n".join([p for p in parts if isinstance(p, str)])
                                if text.strip():
                                    messages.append(ChatMessage(role="assistant", content=text))
                            except Exception:
                                continue
                    except Exception:
                        pass

        # Strategy 4: Scrape HTML message wrappers
        if not messages:
            msg_containers = soup.find_all(attrs={"data-message-author-role": True})
            for container in msg_containers:
                role = container.get("data-message-author-role", "assistant")
                content = container.get_text(separator="\n", strip=True)
                if content:
                    messages.append(ChatMessage(role=role, content=content))

        # Final Fallback: Meta tags if all parsing failed
        if not messages:
            og_title = soup.find("meta", property="og:title")
            og_desc = soup.find("meta", property="og:description")
            if og_title and og_title.get("content"):
                title = og_title["content"]
            desc_text = og_desc["content"] if og_desc and og_desc.get("content") else ""
            if desc_text:
                messages.append(ChatMessage(role="assistant", content=desc_text))
            else:
                raise ValueError(
                    "Could not extract conversation content from this ChatGPT share URL (it may be private, expired, or Cloudflare challenge-protected)."
                )

        # Deduplicate consecutive identical messages
        deduped: List[ChatMessage] = []
        for msg in messages:
            if deduped and deduped[-1].role == msg.role and deduped[-1].content.strip() == msg.content.strip():
                continue
            deduped.append(msg)
        messages = deduped

        final_title = title or default_title
        return FetchChatResponse(
            success=True,
            title=final_title,
            platform="ChatGPT",
            url=url,
            messages=messages,
            message_count=len(messages),
            metadata={"source": "chatgpt_share"}
        )

    def _parse_react_router_stream(self, soup: BeautifulSoup) -> Tuple[Optional[str], List[ChatMessage]]:
        """Parses the React Router / Remix streamController.enqueue payload used in modern ChatGPT."""
        for s in soup.find_all("script"):
            text = s.text or s.string or ""
            if "streamController.enqueue(" not in text:
                continue
            try:
                start_idx = text.find("streamController.enqueue(") + len("streamController.enqueue(")
                end_idx = text.rfind(")")
                arg = text[start_idx:end_idx].strip()
                data = json.loads(arg)
                inner = json.loads(data) if isinstance(data, str) else data
                if not isinstance(inner, list):
                    continue

                def resolve_val(v):
                    if isinstance(v, int) and 0 <= v < len(inner):
                        return inner[v]
                    return v

                def get_field_map(d):
                    res = {}
                    if not isinstance(d, dict):
                        return res
                    for k, v in d.items():
                        if k.startswith("_"):
                            idx = int(k[1:])
                            if 0 <= idx < len(inner):
                                res[inner[idx]] = resolve_val(v)
                    return res

                # 1. Title Extraction
                title = None
                if "title" in inner:
                    t_idx = inner.index("title")
                    t_key = f"_{t_idx}"
                    for el in inner:
                        if isinstance(el, dict) and t_key in el:
                            t_val = resolve_val(el[t_key])
                            if isinstance(t_val, str) and t_val.strip():
                                title = t_val.strip()
                                break

                # 2. Extract linear_conversation items
                messages: List[ChatMessage] = []
                if "linear_conversation" in inner:
                    lin_idx = inner.index("linear_conversation")
                    items_val = resolve_val(inner[lin_idx + 1])
                    if isinstance(items_val, list):
                        for node_idx in items_val:
                            node = get_field_map(resolve_val(node_idx))
                            msg_obj = get_field_map(node.get("message"))
                            if not msg_obj:
                                continue

                            author_obj = get_field_map(msg_obj.get("author"))
                            role = author_obj.get("role")

                            content_obj = get_field_map(msg_obj.get("content"))
                            parts_raw = content_obj.get("parts")
                            if isinstance(parts_raw, int) and 0 <= parts_raw < len(inner):
                                parts_list = inner[parts_raw]
                            elif isinstance(parts_raw, list):
                                parts_list = parts_raw
                            else:
                                parts_list = [parts_raw] if parts_raw else []

                            text_parts = []
                            for p in parts_list:
                                p_val = resolve_val(p)
                                if isinstance(p_val, str) and p_val.strip():
                                    text_parts.append(p_val)

                            content = "\n\n".join(text_parts).strip()
                            if role in ("user", "assistant") and content:
                                messages.append(ChatMessage(role=role, content=content))

                if messages:
                    return title, messages

            except Exception:
                continue

        return None, []
