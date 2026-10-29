export interface ChatMessage {
  role: "user" | "assistant" | "system" | string;
  content: string;
  timestamp?: string;
  model?: string;
}

export interface FetchChatResponse {
  success: boolean;
  title: string;
  platform: string;
  url: string;
  messages: ChatMessage[];
  message_count: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface SampleChatOption {
  id: string;
  title: string;
  platform: string;
  url: string;
  description: string;
}

export interface CompressionMetrics {
  original_tokens: number;
  compressed_tokens: number;
  tokens_saved: number;
  reduction_percentage: number;
  original_cost_usd: number;
  compressed_cost_usd: number;
  cost_saved_usd: number;
  processing_time_ms: number;
}

export interface CompressChatResponse {
  success: boolean;
  metrics: CompressionMetrics;
  compressed_messages: ChatMessage[];
  error?: string;
}

export interface TopicSegment {
  id: string;
  title: string;
  turn_indices: number[];
  turn_count: number;
  keywords: string[];
}

export interface SegmentTopicsResponse {
  success: boolean;
  total_topics: number;
  topics: TopicSegment[];
  error?: string;
}

export interface GenerateDocumentResponse {
  success: boolean;
  document_type: string;
  title: string;
  markdown_content: string;
  word_count: number;
  generation_time_ms: number;
  error?: string;
}

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchChatFromBackend(url: string): Promise<FetchChatResponse> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/fetch-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    let errorDetail = `Error ${response.status}: Failed to fetch conversation`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function compressChatFromBackend(
  messages: ChatMessage[]
): Promise<CompressChatResponse> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/compress-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    let errorDetail = `Error ${response.status}: Failed to compute compression metrics`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function segmentTopicsFromBackend(
  messages: ChatMessage[]
): Promise<SegmentTopicsResponse> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/segment-topics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    let errorDetail = `Error ${response.status}: Failed to segment dialogue topics`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function generateDocumentFromBackend(
  messages: ChatMessage[],
  documentType: string = "study_notes",
  title?: string
): Promise<GenerateDocumentResponse> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/generate-document`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      document_type: documentType,
      title,
    }),
  });

  if (!response.ok) {
    let errorDetail = `Error ${response.status}: Failed to generate document`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function fetchSampleOptions(): Promise<SampleChatOption[]> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/samples`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [
      {
        id: "fastapi-architecture",
        title: "FastAPI Async Architecture",
        platform: "ChatGPT",
        url: "sample://fastapi-architecture",
        description: "Python FastAPI and Async I/O conversation",
      },
      {
        id: "claude-design-system",
        title: "Dark Design Systems",
        platform: "Claude",
        url: "sample://claude-design-system",
        description: "Dark mode design tokens and depth layers",
      },
    ];
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
