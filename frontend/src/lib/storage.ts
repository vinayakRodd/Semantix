export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  platform: string;
  messageCount: number;
  timestamp: string;
}

const STORAGE_KEY = "meghuchat_history_v1";

const DEFAULT_PRESETS: HistoryItem[] = [
  {
    id: "preset-fastapi",
    url: "sample://fastapi-architecture",
    title: "Python Async FastAPI Architecture",
    platform: "ChatGPT-4o",
    messageCount: 4,
    timestamp: "Preset",
  },
  {
    id: "preset-claude",
    url: "sample://claude-design-system",
    title: "Dark Design Systems & Radix",
    platform: "Claude 3.5",
    messageCount: 2,
    timestamp: "Preset",
  },
  {
    id: "preset-biweekly",
    url: "https://chatgpt.com/share/6ae37b26-33fc-83ee-8bb6-d4b75eacf0bd",
    title: "LeetCode Biweekly Contest Topics",
    platform: "ChatGPT",
    messageCount: 2,
    timestamp: "Preset",
  },
  {
    id: "preset-gcd",
    url: "https://chatgpt.com/share/6ae3806f-6bc0-83ee-99d2-36736c538615",
    title: "Optimize GCD Splits O(N)",
    platform: "ChatGPT",
    messageCount: 14,
    timestamp: "Preset",
  },
];

export function getChatHistory(): HistoryItem[] {
  if (typeof window === "undefined") {
    return DEFAULT_PRESETS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with default presets on first visit
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRESETS));
      return DEFAULT_PRESETS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRESETS;
  } catch {
    return DEFAULT_PRESETS;
  }
}

export function saveChatToHistory(chat: {
  url: string;
  title: string;
  platform: string;
  messageCount: number;
}): HistoryItem[] {
  if (typeof window === "undefined") return DEFAULT_PRESETS;

  try {
    const current = getChatHistory();
    // Filter out existing entry with same url so it moves to top
    const filtered = current.filter(
      (item) => item.url.trim().toLowerCase() !== chat.url.trim().toLowerCase()
    );

    const newItem: HistoryItem = {
      id: `history-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: chat.url.trim(),
      title: chat.title.trim() || "Shared Conversation",
      platform: chat.platform || "ChatGPT",
      messageCount: chat.messageCount,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Prepend to top and keep maximum 25 items
    const updated = [newItem, ...filtered].slice(0, 25);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_PRESETS;
  }
}

export function deleteChatFromHistory(id: string): HistoryItem[] {
  if (typeof window === "undefined") return DEFAULT_PRESETS;

  try {
    const current = getChatHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_PRESETS;
  }
}

export function clearChatHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch {
    return [];
  }
}
