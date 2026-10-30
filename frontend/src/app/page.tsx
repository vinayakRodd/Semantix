"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Terminal,
  AlertCircle,
  Activity,
  Menu,
} from "lucide-react";
import { UrlInput } from "@/components/url-input";
import { ChatLoadingSkeleton } from "@/components/chat-loading-skeleton";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Sidebar } from "@/components/sidebar";
import {
  getChatHistory,
  saveChatToHistory,
  deleteChatFromHistory,
  clearChatHistory,
  HistoryItem,
} from "@/lib/storage";
import {
  fetchChatFromBackend,
  segmentTopicsFromBackend,
  TopicSegment,
  FetchChatResponse,
} from "@/lib/api";

// Lazy load ChatViewer with next/dynamic
const ChatViewer = dynamic(
  () => import("@/components/chat-viewer").then((mod) => mod.ChatViewer),
  {
    ssr: false,
    loading: () => <ChatLoadingSkeleton />,
  }
);

export default function Home() {
  const [chatData, setChatData] = useState<FetchChatResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>(() =>
    typeof window !== "undefined" ? getChatHistory() : []
  );

  const handleFetchChat = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setChatData(null);

    const startTime = Date.now();

    try {
      const data = await fetchChatFromBackend(url);

      // Pre-segment topics in the background while the loader is smoothly running
      let topics: TopicSegment[] = [];
      if (data.messages && data.messages.length > 1) {
        try {
          const segRes = await segmentTopicsFromBackend(data.messages);
          if (segRes.success && segRes.topics) {
            topics = segRes.topics;
          }
        } catch {
          // Graceful fallback
        }
      }

      // Smooth pacing so multi-stage loader cycles through Fetching -> Parsing -> Processing -> Loading
      // without violent sudden visual jerks
      const elapsed = Date.now() - startTime;
      const minDisplayMs = 1500;
      if (elapsed < minDisplayMs) {
        await new Promise((resolve) => setTimeout(resolve, minDisplayMs - elapsed));
      }

      setChatData({ ...data, topics });

      // Automatically store public link & conversation in browser localStorage
      const updatedHistory = saveChatToHistory({
        url: data.url,
        title: data.title,
        platform: data.platform,
        messageCount: data.messages.length,
      });
      setHistory(updatedHistory);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while fetching the conversation.");
      }
      setChatData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setChatData(null);
    setError(null);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteChatFromHistory(id);
    setHistory(updated);
  };

  const handleClearAllHistory = () => {
    clearChatHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#080a09] text-zinc-100 flex flex-col selection:bg-emerald-500/30 selection:text-[#00ff88]">
      {/* Neon Green atmospheric background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[550px] w-[900px] bg-neon-radial blur-3xl opacity-80" />
      </div>

      {/* Navigation Bar with Neon Green Accent */}
      <header className="sticky top-0 z-50 border-b border-emerald-500/20 bg-zinc-950/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/40 bg-zinc-950 text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.2)] hover:border-[#00ff88] hover:bg-emerald-500/10 transition-all cursor-pointer"
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 border border-emerald-500/50 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.25)] font-bold">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white font-mono">
                Semant<span className="text-[#00ff88] neon-text-glow">ix</span>
              </span>
              <span className="ml-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-[#00ff88]">
                v1.0
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 min-w-0">
        {/* Hero title & description */}
        <div className="text-center space-y-3.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.15)] font-mono">
            <Activity className="h-3.5 w-3.5" />
            <span>Next.js 16 + FastAPI Dialogue Matrix</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Inspect, Compress &amp; Verify <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] via-emerald-400 to-green-300 neon-text-glow">LLM Conversations</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Paste a public conversation link from ChatGPT, Claude, or Perplexity. Our Python backend extracts and parses the dialogue turns into structured, neon-accented dark markdown.
          </p>
        </div>

        {/* URL Input Box */}
        <div className="max-w-3xl mx-auto w-full">
          <UrlInput
            onFetch={handleFetchChat}
            isLoading={isLoading}
          />
        </div>

        {/* Error Alert with AnimatePresence */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="max-w-3xl mx-auto flex items-start gap-3 rounded-2xl border border-rose-900/60 bg-rose-950/20 p-4 text-rose-300 shadow-lg"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-rose-200">Unable to Fetch Conversation</p>
                <p className="text-rose-300/90 leading-relaxed">{error}</p>
                <p className="text-xs text-rose-400/80 pt-1">
                  Tip: Try one of the quick test sample links above if the URL is protected by Cloudflare bot verification.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic / Lazy Loaded View with AnimatePresence */}
        <div className="max-w-3xl mx-auto w-full min-w-0">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <ChatLoadingSkeleton key="loading-skeleton" />
            ) : chatData ? (
              <ChatViewer key="chat-viewer" data={chatData} onClear={handleClear} />
            ) : (
              <EmptyState key="empty-state" />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer with Neon Green Accents */}
      <footer className="border-t border-emerald-500/20 py-6 text-center text-xs text-zinc-500 font-mono">
        <p>
          Semantix • Built with Next.js, Tailwind CSS, <span className="text-[#00ff88]">Neon Green UI</span>, and Python FastAPI.
        </p>
      </footer>

      {/* Floating Scroll To Top Button */}
      <ScrollToTop />

      {/* Left Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectChat={(url) => handleFetchChat(url)}
        onNewChat={handleClear}
        history={history}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearHistory={handleClearAllHistory}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-dashed border-emerald-500/30 bg-zinc-950/40 p-8 sm:p-12 text-center space-y-4 shadow-xl"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(0,255,136,0.15)]">
        <MessageSquare className="h-7 w-7 text-[#00ff88]" />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="text-base font-semibold text-zinc-100">
          No Conversation Loaded Yet
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Paste a public shared chat link into the input box above to inspect dialogue turns, evaluate compression metrics, and synthesize documents.
        </p>
      </div>
    </motion.div>
  );
}
