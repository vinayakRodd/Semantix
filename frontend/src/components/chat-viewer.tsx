"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Copy,
  Check,
  Hash,
  Sparkles,
  Zap,
  DollarSign,
  Clock,
  Loader2,
  TrendingDown,
} from "lucide-react";
import {
  FetchChatResponse,
  ChatMessage,
  CompressionMetrics,
  compressChatFromBackend,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatMessageItem } from "@/components/chat-message-item";

interface ChatViewerProps {
  data: FetchChatResponse;
  onClear: () => void;
}

export function ChatViewer({ data, onClear }: ChatViewerProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [metrics, setMetrics] = useState<CompressionMetrics | null>(null);
  const [compressedMessages, setCompressedMessages] = useState<ChatMessage[] | null>(null);
  const [viewMode, setViewMode] = useState<"original" | "compressed">("original");
  const [compressionError, setCompressionError] = useState<string | null>(null);

  const handleCopyTranscript = () => {
    const targetMessages = viewMode === "compressed" && compressedMessages ? compressedMessages : data.messages;
    const transcript = targetMessages
      .map(
        (m) =>
          `[${m.role.toUpperCase()}${m.timestamp ? ` - ${m.timestamp}` : ""}]\n${m.content}\n`
      )
      .join("\n---\n\n");

    navigator.clipboard.writeText(
      `# ${data.title} (${viewMode.toUpperCase()})\nSource: ${data.url}\n\n${transcript}`
    );
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleRunCompression = async () => {
    setIsCompressing(true);
    setCompressionError(null);
    try {
      const result = await compressChatFromBackend(data.messages);
      if (result.success && result.metrics) {
        setMetrics(result.metrics);
        setCompressedMessages(result.compressed_messages);
        setViewMode("compressed"); // Automatically switch to view compressed result
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCompressionError(err.message);
      } else {
        setCompressionError("Failed to calculate compression metrics.");
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const displayedMessages = viewMode === "compressed" && compressedMessages ? compressedMessages : data.messages;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full min-w-0 max-w-full space-y-6 overflow-hidden"
    >
      {/* Header Bar with Neon Green Glowing Card */}
      <div className="rounded-2xl border border-emerald-500/40 bg-zinc-950/80 p-4 sm:p-5 shadow-2xl neon-glow-card backdrop-blur-xl w-full min-w-0 max-w-full overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neon" className="gap-1.5 font-mono">
                <Sparkles className="h-3 w-3 text-[#00ff88]" />
                {data.platform}
              </Badge>
              <Badge variant="secondary" className="gap-1 font-mono text-zinc-400 border-zinc-800">
                <Hash className="h-3 w-3 text-emerald-400" />
                {displayedMessages.length} {displayedMessages.length === 1 ? "turn" : "turns"}
              </Badge>
              {viewMode === "compressed" && (
                <Badge variant="success" className="gap-1 font-mono text-xs">
                  <Zap className="h-3 w-3 text-[#00ff88]" />
                  Compressed View
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white break-words">
              {data.title}
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* The Compression & Metrics Action Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunCompression}
              disabled={isCompressing}
              className="gap-1.5 text-xs font-bold border-emerald-500/50 bg-emerald-950/20 text-[#00ff88] hover:bg-emerald-500/10 hover:border-[#00ff88] hover:shadow-[0_0_15px_rgba(0,255,136,0.3)] cursor-pointer"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00ff88]" />
                  <span>Computing Metrics...</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 text-[#00ff88]" />
                  <span>Compress & Evaluate</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyTranscript}
              className="gap-1.5 text-xs border-emerald-500/30 text-emerald-300 hover:text-[#00ff88] hover:border-emerald-400"
            >
              {copiedAll ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#00ff88]" />
                  <span className="text-[#00ff88]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Full Chat</span>
                </>
              )}
            </Button>

            {data.url.startsWith("http") && (
              <a
                href={data.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-zinc-900/90 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400 hover:text-[#00ff88] transition-all"
              >
                <span>Original Link</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-xs text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* View Switcher Tabs (when compressed data is available) */}
        {compressedMessages && (
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
            <span className="text-xs font-mono text-zinc-500">View:</span>
            <button
              onClick={() => setViewMode("original")}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                viewMode === "original"
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Original ({data.messages.length} turns)
            </button>
            <button
              onClick={() => setViewMode("compressed")}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "compressed"
                  ? "bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,136,0.15)]"
                  : "text-zinc-400 hover:text-[#00ff88]"
              }`}
            >
              <Zap className="h-3 w-3" />
              Compressed ({compressedMessages.length} turns)
            </button>
          </div>
        )}
      </div>

      {/* Error state if compression fails */}
      {compressionError && (
        <div className="p-3.5 rounded-xl border border-rose-900/50 bg-rose-950/20 text-xs text-rose-300">
          {compressionError}
        </div>
      )}

      {/* Live Animated Metrics Bar HUD */}
      <AnimatePresence>
        {metrics && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full"
          >
            <div className="rounded-2xl border border-emerald-500/40 bg-zinc-950/90 p-4 sm:p-5 shadow-2xl neon-glow-card backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#00ff88] animate-ping" />
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#00ff88] neon-text-glow">
                    Live Evaluation Metrics & Savings
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  Tiktoken Engine (o200k_base)
                </span>
              </div>

              {/* 3 Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. Token Reduction */}
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-zinc-900/50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <TrendingDown className="h-3.5 w-3.5 text-[#00ff88]" />
                      Token Reduction
                    </span>
                    <span className="text-xs font-bold text-[#00ff88] bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      -{metrics.reduction_percentage}%
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white flex items-baseline gap-1.5">
                    <span>{metrics.tokens_saved.toLocaleString()}</span>
                    <span className="text-xs text-zinc-400 font-normal">tokens saved</span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    {metrics.original_tokens.toLocaleString()} → {metrics.compressed_tokens.toLocaleString()} tokens
                  </div>
                </div>

                {/* 2. Cost Savings */}
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-zinc-900/50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                      Cost Savings
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      GPT-4o rates
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-[#00ff88] flex items-baseline gap-1">
                    <span>+${metrics.cost_saved_usd.toFixed(4)}</span>
                    <span className="text-xs text-zinc-400 font-normal">saved</span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    ${metrics.original_cost_usd.toFixed(4)} → ${metrics.compressed_cost_usd.toFixed(4)} USD
                  </div>
                </div>

                {/* 3. Latency Timer */}
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-zinc-900/50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      Processing Time
                    </span>
                    <span className="text-[10px] text-[#00ff88] font-mono">
                      Ultra Fast
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white flex items-baseline gap-1.5">
                    <span>{metrics.processing_time_ms}</span>
                    <span className="text-xs text-zinc-400 font-normal">ms latency</span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Deterministic non-blocking execution
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Stream with AnimatePresence */}
      <div className="space-y-4 w-full min-w-0 max-w-full">
        <AnimatePresence mode="popLayout">
          {displayedMessages.map((message, idx) => (
            <ChatMessageItem key={`${viewMode}-${idx}`} message={message} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
