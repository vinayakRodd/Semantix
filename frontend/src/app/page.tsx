"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Bot,
  Terminal,
  AlertCircle,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { UrlInput } from "@/components/url-input";
import { ChatLoadingSkeleton } from "@/components/chat-loading-skeleton";
import { ScrollToTop } from "@/components/scroll-to-top";
import {
  fetchChatFromBackend,
  fetchSampleOptions,
  checkBackendHealth,
  FetchChatResponse,
  SampleChatOption,
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
  const [samples, setSamples] = useState<SampleChatOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Load samples and check backend status on mount
  useEffect(() => {
    async function init() {
      const isHealthy = await checkBackendHealth();
      setBackendOnline(isHealthy);
      const sampleList = await fetchSampleOptions();
      setSamples(sampleList);
    }
    init();
  }, []);

  const handleFetchChat = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchChatFromBackend(url);
      setChatData(data);
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 border border-emerald-500/50 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.25)] font-bold">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white font-mono">
                Meghu<span className="text-[#00ff88] neon-text-glow">Chat</span>
              </span>
              <span className="ml-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-[#00ff88]">
                v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend connectivity indicator */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-zinc-950/90 px-3 py-1 text-xs font-mono shadow-sm">
              {backendOnline === null ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-zinc-500 animate-pulse" />
                  <span className="text-zinc-400">Connecting Backend...</span>
                </>
              ) : backendOnline ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00ff88]" />
                  <span className="text-[#00ff88] font-medium">Python API Online</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-amber-400">Python API Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 min-w-0 overflow-hidden">
        {/* Hero title & description */}
        <div className="text-center space-y-3.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.15)] font-mono">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next.js 16 + FastAPI Chat Inspector</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Fetch & Format <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] via-emerald-400 to-green-300 neon-text-glow">LLM Shared Chats</span>
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
            samples={samples}
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
              <EmptyState key="empty-state" onSelectSample={(url) => handleFetchChat(url)} />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer with Neon Green Accents */}
      <footer className="border-t border-emerald-500/20 py-6 text-center text-xs text-zinc-500 font-mono">
        <p>
          Built with Next.js, Tailwind CSS, <span className="text-[#00ff88]">Neon Green UI</span>, and Python FastAPI.
        </p>
      </footer>

      {/* Floating Scroll To Top Button */}
      <ScrollToTop />
    </div>
  );
}

function EmptyState({ onSelectSample }: { onSelectSample: (url: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-dashed border-emerald-500/30 bg-zinc-950/40 p-8 sm:p-12 text-center space-y-6 shadow-xl"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(0,255,136,0.15)]">
        <MessageSquare className="h-7 w-7 text-[#00ff88]" />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="text-base font-semibold text-zinc-100">
          No Conversation Loaded Yet
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Paste a shared chat link into the input box above or try our curated examples to view dialogue turns, code blocks, and markdown formatting.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
        <button
          onClick={() => onSelectSample("sample://fastapi-architecture")}
          className="group rounded-xl border border-emerald-500/20 bg-zinc-900/40 p-4 hover:border-[#00ff88] hover:bg-emerald-500/5 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(0,255,136,0.15)]"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00ff88] mb-1 font-mono">
            <Terminal className="h-3.5 w-3.5" />
            <span>Python FastAPI Architecture</span>
          </div>
          <p className="text-[12px] text-zinc-400 line-clamp-2">
            Inspect a 4-turn async Python backend discussion with syntax highlighted code blocks.
          </p>
        </button>

        <button
          onClick={() => onSelectSample("sample://claude-design-system")}
          className="group rounded-xl border border-emerald-500/20 bg-zinc-900/40 p-4 hover:border-[#00ff88] hover:bg-emerald-500/5 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(0,255,136,0.15)]"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-1 font-mono">
            <Layers className="h-3.5 w-3.5" />
            <span>Dark Mode Design Systems</span>
          </div>
          <p className="text-[12px] text-zinc-400 line-clamp-2">
            Inspect Claude&apos;s UI/UX recommendations for elevation and dark tokens.
          </p>
        </button>
      </div>
    </motion.div>
  );
}
