import re
from typing import List, Set, Optional
from collections import Counter

from backend.app.schemas import ChatMessage, TopicSegment, SegmentTopicsResponse

STOP_WORDS: Set[str] = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
    "from", "up", "about", "into", "over", "after", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "can", "could", "will", "would",
    "shall", "should", "may", "might", "must", "it", "its", "you", "your", "i", "my", "we",
    "our", "they", "them", "their", "this", "that", "these", "those", "what", "which", "who",
    "whom", "whose", "why", "how", "when", "where", "bro", "like", "just", "also", "here",
    "there", "then", "so", "as", "if", "not", "no", "yes", "than", "more", "first", "second",
    "want", "know", "think", "mean", "good", "very", "box", "size", "secondary", "align",
    "padding", "radius", "border", "surface", "color", "icon", "true", "false", "row", "width",
    "height", "code", "file", "text", "badge", "divider", "title", "link", "cite", "button",
    "day", "use", "make", "need", "get", "one", "two", "see", "any", "all", "let", "call"
}


class DialogueSegmentationService:
    @staticmethod
    def clean_text_for_nlp(text: str) -> str:
        """Removes XML/HTML tags and code fences so layout markup doesn't skew keywords."""
        if not text:
            return ""
        # Remove code blocks
        t = re.sub(r"```[\s\S]*?```", " ", text)
        # Remove HTML/XML tags
        t = re.sub(r"<[^>]+>", " ", t)
        return t

    @staticmethod
    def extract_keywords(text: str, top_n: int = 4) -> List[str]:
        clean = DialogueSegmentationService.clean_text_for_nlp(text)
        words = re.findall(r"\b[a-zA-Z]{3,}\b", clean.lower())
        filtered = [w for w in words if w not in STOP_WORDS]
        counts = Counter(filtered)
        return [w for w, _ in counts.most_common(top_n)]

    @staticmethod
    def extract_heading(text: str) -> Optional[str]:
        """Finds prominent markdown headings (e.g. ## 1. What depth of AI knowledge...)."""
        m = re.search(r"^##?\s+([^\n]+)", text, re.MULTILINE)
        if m:
            clean = m.group(1).strip()
            # Clean leading numbers like 1. 2. or Step 1:
            clean = re.sub(r"^(?:Step\s*\d+:?|\d+\.?)\s*", "", clean, flags=re.IGNORECASE).strip()
            # Remove trailing punctuation or markdown artifacts
            clean = clean.split("—")[0].strip()
            if 3 < len(clean) <= 50:
                return clean
        return None

    def segment(self, messages: List[ChatMessage]) -> SegmentTopicsResponse:
        if not messages:
            return SegmentTopicsResponse(success=True, total_topics=0, topics=[])

        total_turns = len(messages)

        # For very short conversations (1 to 3 turns), treat as a single coherent topic
        if total_turns <= 3:
            full_text = "\n".join(m.content for m in messages)
            keywords = self.extract_keywords(full_text, top_n=4)
            heading = None
            for m in messages:
                h = self.extract_heading(m.content)
                if h:
                    heading = h
                    break
            title = heading if heading else (" & ".join(k.title() for k in keywords[:2]) if keywords else "Conversation Overview")
            
            single_topic = TopicSegment(
                id="topic-1",
                title=title,
                turn_indices=list(range(total_turns)),
                turn_count=total_turns,
                keywords=keywords,
            )
            return SegmentTopicsResponse(success=True, total_topics=1, topics=[single_topic])

        # Step 1: Extract keyword sets and headings per turn
        turn_keywords = [set(self.extract_keywords(m.content, top_n=10)) for m in messages]
        turn_headings = [self.extract_heading(m.content) for m in messages]

        # Step 2: Detect shift boundaries
        clusters: List[List[int]] = []
        current_cluster: List[int] = [0]

        for i in range(1, total_turns):
            prev_kw = turn_keywords[i - 1]
            curr_kw = turn_keywords[i]

            # Jaccard lexical overlap
            union = prev_kw | curr_kw
            intersection = prev_kw & curr_kw
            overlap = len(intersection) / len(union) if union else 0.0

            curr_role = messages[i].role.lower()
            curr_heading = turn_headings[i]

            # Boundary heuristic:
            # - User initiates a new query with low keyword overlap to previous topic
            # - Or assistant introduces a prominent new heading and cluster has reached reasonable length
            is_user_topic_shift = curr_role == "user" and overlap < 0.06 and len(current_cluster) >= 2
            is_major_section_shift = curr_heading is not None and overlap < 0.10 and len(current_cluster) >= 3

            if is_user_topic_shift or is_major_section_shift:
                clusters.append(current_cluster)
                current_cluster = [i]
            else:
                current_cluster.append(i)

        if current_cluster:
            clusters.append(current_cluster)

        # Step 3: Post-processing to merge tiny clusters (<2 turns) into previous cluster
        merged_clusters: List[List[int]] = []
        for c in clusters:
            if merged_clusters and len(c) < 2 and len(merged_clusters[-1]) < 8:
                merged_clusters[-1].extend(c)
            else:
                merged_clusters.append(c)

        if not merged_clusters:
            merged_clusters = [list(range(total_turns))]

        # Step 4: Build TopicSegment models with clean titles
        topic_segments: List[TopicSegment] = []
        for idx, indices in enumerate(merged_clusters):
            cluster_text = "\n".join(messages[i].content for i in indices)
            keywords = self.extract_keywords(cluster_text, top_n=4)

            # Find best heading in cluster
            best_heading = None
            for i in indices:
                h = turn_headings[i]
                if h:
                    best_heading = h
                    break

            if best_heading:
                title = best_heading
            elif len(keywords) >= 2:
                title = f"{keywords[0].title()} & {keywords[1].title()} Discussion"
            elif len(keywords) == 1:
                title = f"{keywords[0].title()} Discussion"
            else:
                title = f"Topic Section {idx + 1}"

            topic_segments.append(
                TopicSegment(
                    id=f"topic-{idx + 1}",
                    title=title,
                    turn_indices=indices,
                    turn_count=len(indices),
                    keywords=keywords,
                )
            )

        return SegmentTopicsResponse(
            success=True,
            total_topics=len(topic_segments),
            topics=topic_segments,
        )


dialogue_segmentation_service = DialogueSegmentationService()
