# Semantix: LLM Dialogue & Synthesis Matrix

A full-stack application to fetch, decode, format, and interactively view shared LLM conversations (ChatGPT public share links, Claude, Perplexity, etc.) in a dark cyberpunk neon-green theme.

Built with **Next.js 16 (App Router)**, **Tailwind CSS**, **Framer Motion**, and a **Python FastAPI** backend.

---

## Key Features

- **Modern ChatGPT Stream Extraction:**
  Reverse-engineers and decodes modern ChatGPT's React Router / Remix Turbo-stream protocol (`window.__reactRouterContext.streamController.enqueue`), extracting full multi-turn conversations, titles, roles, and timestamps.

- **Cyberpunk Neon Green Design System:**
  Deep black pitch palette (`#080a09`) with atmospheric radial glows, glowing neon green borders (`#00ff88`), and neon button and badge accents.

- **Interactive Canvas & GenUI Component Support:**
  Custom renderers for ChatGPT's rich dynamic widgets:
  - `<AsyncImage query="..." />`: Screenshot and image search cards with aspect-ratio preservation.
  - `<radio-group>` & `<radio>`: Interactive single-select radio button groups.
  - `<checkbox>` & 7-Day Checklist: Dynamic task list with real-time progress bars (`X/7 completed`).
  - `<box>` & `<row>`: Workflow diagrams, step cards, and icon badges.
  - `<icon name="...">`: Vector icons using Lucide.
  - GitHub Flavored Markdown Tables (`| ... |`): Styled with neon headers, zebra stripes, and responsive horizontal scrolling.

- **Framer Motion & Lazy Loading:**
  - Smooth page transitions using `<AnimatePresence mode="wait">`.
  - Viewport-based lazy loading (`whileInView`) for long multi-turn threads.
  - `ChatLoadingSkeleton` animated progress bar during backend extraction.
  - Component code-splitting via Next.js `dynamic()`.

---

## Architecture

```
MeghuProject/
├── backend/
│   ├── app/
│   │   ├── parsers/
│   │   │   ├── base.py         # Abstract parser interface
│   │   │   ├── chatgpt.py      # React Router Turbo-stream & Next.js ChatGPT parser
│   │   │   ├── generic.py      # OpenGraph and HTML fallback parser
│   │   │   ├── samples.py      # Preloaded sample conversations
│   │   │   └── manager.py      # Parser router singleton
│   │   ├── main.py             # FastAPI entrypoint, CORS & endpoints
│   │   └── schemas.py          # Pydantic DTOs
│   ├── requirements.txt
│   ├── run.py                  # Server launcher
│   └── test_backend.py         # Test suite
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx        # Main dashboard with lazy loading
    │   │   └── globals.css     # Neon green tokens & glows
    │   ├── components/
    │   │   ├── ui/             # Neon Button, Input, Badge primitives
    │   │   ├── chat-loading-skeleton.tsx
    │   │   ├── chat-message-item.tsx
    │   │   ├── chat-viewer.tsx
    │   │   ├── markdown-content.tsx # Canvas, GenUI & Markdown renderer
    │   │   └── url-input.tsx
    │   └── lib/
    │       ├── api.ts          # Backend API client
    │       └── utils.ts
    ├── package.json
    └── tsconfig.json
```

---

## Quick Start

### 1. Start the Python Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python run.py
```
*Backend runs on `http://localhost:8000`*

### 2. Start the Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## Testing & Verification

```bash
# Backend tests
PYTHONPATH=. backend/venv/bin/python backend/test_backend.py

# Frontend lint & build
cd frontend && npm run lint && npm run build
```
