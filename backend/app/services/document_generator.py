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
            f"# 📘 Study Notes: {title}",
            f"*Generated on {date_str} via Sem-EL Automated Document Synthesis*",
            "\n---\n",
            "## 1. Learning Objectives & Core Inquiries",
        ]

        user_queries = [m.content.strip() for m in messages if m.role.lower() == "user"]
        for idx, q in enumerate(user_queries[:5], 1):
            q_clean = q.split("\n")[0][:140]
            doc.append(f"{idx}. **Question:** {q_clean}")

        doc.append("\n## 2. Key Principles & Conceptual Breakdown\n")

        all_assistant_text = "\n\n".join(m.content for m in messages if m.role.lower() == "assistant")
        bullet_points = self.extract_bullet_points(all_assistant_text, max_points=12)

        if bullet_points:
            for pt in bullet_points:
                doc.append(f"- {pt}")
        else:
            doc.append("- Review foundational concepts and verify implementation patterns.")

        # Extract Code Patterns & Implementation Reference
        code_blocks = []
        for m in messages:
            if m.role.lower() == "assistant":
                code_blocks.extend(self.extract_code_blocks(m.content))

        if code_blocks:
            doc.append("\n## 3. Code Patterns & Implementation Reference\n")
            for idx, (lang, code) in enumerate(code_blocks[:4], 1):
                doc.append(f"### Example {idx} ({lang})\n```{lang}\n{code}\n```\n")

        # Study Review Checklist
        doc.append("\n## 4. Self-Assessment & Review Checklist\n")
        doc.append("- [ ] Verify core algorithmic or architectural principles without looking at reference solutions.")
        doc.append("- [ ] Reproduce the key code structures or pattern implementations independently.")
        doc.append("- [ ] Identify edge cases, time/space complexity bottlenecks, and production safeguards.")

        return "\n".join(doc)

    def generate_executive_summary(self, messages: List[ChatMessage], title: str) -> str:
        date_str = datetime.now().strftime("%B %d, %Y")
        doc = [
            f"# 📋 Executive Summary: {title}",
            f"*Confidential Technical Briefing — {date_str}*",
            "\n---\n",
            "## 1. Problem Statement & Scope",
        ]

        user_msgs = [m.content.strip() for m in messages if m.role.lower() == "user"]
        primary_scope = user_msgs[0].split("\n")[0] if user_msgs else "Technical architecture evaluation"
        doc.append(f"The objective of this engagement was addressing the following technical problem:\n\n> {primary_scope}\n")

        doc.append("## 2. Architectural Findings & Key Solutions\n")
        all_assistant_text = "\n\n".join(m.content for m in messages if m.role.lower() == "assistant")
        bullets = self.extract_bullet_points(all_assistant_text, max_points=8)

        for b in bullets:
            doc.append(f"- **Finding:** {b}")

        doc.append("\n## 3. Complexity, Cost & Performance Tradeoffs\n")
        doc.append("- **Execution Latency:** Sub-millisecond deterministic processing for local stages.")
        doc.append("- **Resource Utilization:** Optimized memory footprint via non-blocking asynchronous I/O.")
        doc.append("- **Token Economy:** Pruned conversational overhead to prevent model billing inflation.")

        doc.append("\n## 4. Strategic Recommendations\n")
        doc.append("1. **Phase 1 Deployment:** Standardize the foundational architecture patterns approved in this discussion.")
        doc.append("2. **Verification Guardrails:** Implement automated test suites to validate invariants before production release.")
        doc.append("3. **Continuous Monitoring:** Monitor error rates, throughput latency, and failure fallbacks under peak load.")

        return "\n".join(doc)

    def generate_decision_log(self, messages: List[ChatMessage], title: str) -> str:
        date_str = datetime.now().strftime("%B %d, %Y")
        doc = [
            f"# 🎯 Architecture Decision Record & Action Items",
            f"**Project:** {title} | **Date:** {date_str}",
            "\n---\n",
            "## 1. Architectural Decisions (ADR)\n",
        ]

        # Extract major headings as decisions
        headings = []
        for m in messages:
            headings.extend(self.clean_markdown_headings(m.content))

        if headings:
            for idx, h in enumerate(headings[:5], 1):
                doc.append(f"### ADR-0{idx}: {h}")
                doc.append(f"- **Status:** Accepted")
                doc.append(f"- **Context:** Derived from consensus during technical review.")
                doc.append(f"- **Consequences:** Ensures clean modularity and verifiable behavior.\n")
        else:
            doc.append("### ADR-01: Technical Baseline Adoption")
            doc.append("- **Status:** Accepted")
            doc.append("- **Consequences:** Maintain standard architectural style throughout implementation.\n")

        doc.append("## 2. Action Items Checklist\n")
        doc.append("- [ ] Refactor existing implementations to match the verified patterns.")
        doc.append("- [ ] Implement boundary tests and fuzz test cases against unexpected inputs.")
        doc.append("- [ ] Document API schemas and request/response contracts.")
        doc.append("- [ ] Configure CI/CD pipeline linters and build verification gates.")

        doc.append("\n## 3. Unresolved Questions & Follow-ups\n")
        doc.append("- Benchmark system under simulated concurrent traffic.")
        doc.append("- Evaluate external API rate limits and resilience fallbacks.")

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
