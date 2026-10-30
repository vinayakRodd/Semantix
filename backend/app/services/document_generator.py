import re
import time
from typing import List, Optional, Tuple
from datetime import datetime

from backend.app.schemas import ChatMessage, GenerateDocumentResponse


class DocumentGeneratorService:
    @staticmethod
    def extract_code_blocks(text: str) -> List[Tuple[str, str]]:
        """Extracts (language, code) from markdown text."""
        matches = re.findall(r"```(\w*)\n([\s\S]*?)```", text)
        return [(lang or "code", code.strip()) for lang, code in matches if code.strip()]

    @staticmethod
    def clean_markdown_headings(text: str) -> List[str]:
        """Finds clean markdown headings."""
        headings = []
        for line in text.split("\n"):
            line = line.strip()
            if line.startswith("#"):
                clean = re.sub(r"^#+\s*", "", line).strip()
                if clean and len(clean) > 3:
                    headings.append(clean)
        return headings

    @staticmethod
    def extract_bullet_points(text: str, max_points: int = 10) -> List[str]:
        """Extracts key bullet points from text."""
        points = []
        for line in text.split("\n"):
            line = line.strip()
            if line.startswith(("- ", "* ", "1. ", "2. ", "3. ", "4. ", "5. ")):
                clean = re.sub(r"^(?:[-*]|\d+\.)\s*", "", line).strip()
                # Remove XML tags if any
                clean = re.sub(r"<[^>]+>", "", clean).strip()
                if clean and len(clean) > 10 and clean not in points:
                    points.append(clean)
                    if len(points) >= max_points:
                        break
        return points

    def generate_study_notes(self, messages: List[ChatMessage], title: str) -> str:
        date_str = datetime.now().strftime("%B %d, %Y")
        doc = [
            f"# 📘 Notes: {title}",
            f"*Generated on {date_str}*",
            "\n---\n",
            "## 1. Core Inquiries & Questions\n",
        ]

        user_queries = [m.content.strip() for m in messages if m.role.lower() == "user"]
        if user_queries:
            doc.append("**Questions Explored:**\n")
            for idx, q in enumerate(user_queries[:5], 1):
                q_clean = q.split("\n")[0][:140]
                doc.append(f"{idx}. {q_clean}")

        doc.append("\n## 2. Key Principles & Core Concepts\n")

        all_assistant_text = "\n\n".join(m.content for m in messages if m.role.lower() == "assistant")
        bullet_points = self.extract_bullet_points(all_assistant_text, max_points=12)

        if bullet_points:
            for pt in bullet_points:
                doc.append(f"- {pt}")
        else:
            doc.append("- Review key discussion points and foundational concepts.")

        # Extract Reference Examples if any
        code_blocks = []
        for m in messages:
            if m.role.lower() == "assistant":
                code_blocks.extend(self.extract_code_blocks(m.content))

        if code_blocks:
            doc.append("\n## 3. Reference Examples & Details\n")
            for idx, (lang, code) in enumerate(code_blocks[:4], 1):
                doc.append(f"### Example {idx} ({lang})\n```{lang}\n{code}\n```\n")

        return "\n".join(doc)

    def generate_executive_summary(self, messages: List[ChatMessage], title: str) -> str:
        date_str = datetime.now().strftime("%B %d, %Y")
        doc = [
            f"# 📋 Summary: {title}",
            f"*Discussion Briefing — {date_str}*",
            "\n---\n",
            "## 1. Objective & Scope",
        ]

        user_msgs = [m.content.strip() for m in messages if m.role.lower() == "user"]
        primary_scope = user_msgs[0].split("\n")[0] if user_msgs else "General discussion overview"
        doc.append(f"The primary inquiry addressed in this discussion was:\n\n> {primary_scope}\n")

        doc.append("## 2. Key Findings & Insights\n")
        all_assistant_text = "\n\n".join(m.content for m in messages if m.role.lower() == "assistant")
        bullets = self.extract_bullet_points(all_assistant_text, max_points=8)

        if bullets:
            doc.append("**Key Takeaways:**\n")
            for b in bullets:
                doc.append(f"- {b}")

        doc.append("\n## 3. Analysis & Considerations\n")
        doc.append("- **Core Focus:** Clarified primary questions and identified fundamental principles.")
        doc.append("- **Depth & Coherence:** Detailed reasoning provided with practical examples and structure.")
        doc.append("- **Actionable Clarity:** Established consistent direction and concise outcomes.")

        return "\n".join(doc)

    def generate_decision_log(self, messages: List[ChatMessage], title: str) -> str:
        date_str = datetime.now().strftime("%B %d, %Y")
        doc = [
            f"# 🎯 Decisions: {title}",
            f"**Topic:** {title} | **Date:** {date_str}",
            "\n---\n",
            "## Key Decisions & Takeaways\n",
        ]

        # Extract major headings as decisions
        headings = []
        for m in messages:
            headings.extend(self.clean_markdown_headings(m.content))

        if headings:
            for idx, h in enumerate(headings[:5], 1):
                doc.append(f"### Decision {idx}: {h}")
                doc.append(f"- **Status:** Accepted")
                doc.append(f"- **Context:** Established from dialogue consensus and core takeaways.")
                doc.append(f"- **Outcome:** Provides clear alignment and defined direction.\n")
        else:
            doc.append("### Decision 1: Primary Direction & Consensus")
            doc.append("- **Status:** Accepted")
            doc.append("- **Context:** Established from primary discussion consensus.")
            doc.append("- **Outcome:** Maintains clear alignment and consistent direction throughout.\n")

        return "\n".join(doc)

    def generate(self, messages: List[ChatMessage], doc_type: str, title: Optional[str] = None) -> GenerateDocumentResponse:
        start_time = time.perf_counter()
        doc_type_clean = (doc_type or "study_notes").lower().strip()
        doc_title = title.strip() if title and title.strip() else "Technical Review"

        if doc_type_clean == "executive_summary":
            content = self.generate_executive_summary(messages, doc_title)
        elif doc_type_clean == "decision_log":
            content = self.generate_decision_log(messages, doc_title)
        else:
            doc_type_clean = "study_notes"
            content = self.generate_study_notes(messages, doc_title)

        end_time = time.perf_counter()
        latency_ms = round((end_time - start_time) * 1000, 2)
        words = len(content.split())

        return GenerateDocumentResponse(
            success=True,
            document_type=doc_type_clean,
            title=doc_title,
            markdown_content=content,
            word_count=words,
            generation_time_ms=latency_ms,
        )


document_generator_service = DocumentGeneratorService()
