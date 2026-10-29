"use client";

import React, { useState, useEffect } from "react";
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
  Layers,
  Tag,
  Filter,
} from "lucide-react";
import {
  FetchChatResponse,
  ChatMessage,
  CompressionMetrics,
  TopicSegment,
  compressChatFromBackend,
  segmentTopicsFromBackend,
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

  // Topic Segmentation States (Multi-select toggling)
  const [topics, setTopics] = useState<TopicSegment[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  // Fetch topic segmentation automatically when messages load
  useEffect(() => {
    let isMounted = true;
    async function loadTopics() {
      if (!data.messages || data.messages.length <= 1) {
        setTopics([]);
        return;
      }
      setIsLoadingTopics(true);
      try {
        const res = await segmentTopicsFromBackend(data.messages);
        if (isMounted && res.success && res.topics) {
          setTopics(res.topics);
          setSelectedTopicIds([]); // Default to all topics active
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setIsLoadingTopics(false);
      }
    }
    loadTopics();
    return () => {
      isMounted = false;
    };
  }, [data.messages]);

  const handleToggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) => {
      if (prev.includes(topicId)) {
        // Toggle off
        return prev.filter((id) => id !== topicId);
      } else {
        // Toggle on
        return [...prev, topicId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedTopicIds([]);
  };

  const isAllSelected = selectedTopicIds.length === 0 || selectedTopicIds.length === topics.length;

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

  // Base messages based on view mode (original vs compressed)
  const baseMessages = viewMode === "compressed" && compressedMessages ? compressedMessages : data.messages;

  // Filter messages based on multi-selected toggled topics
  const allowedTurnIndices = React.useMemo(() => {
    if (isAllSelected) return null; // show all
    const indices = new Set<number>();
    for (const t of topics) {
      if (selectedTopicIds.includes(t.id)) {
        t.turn_indices.forEach((idx) => indices.add(idx));
      }
    }
    return indices;
  }, [isAllSelected, selectedTopicIds, topics]);

  const displayedEntries = baseMessages
    .map((message, originalIndex) => ({ message, originalIndex }))
    .filter(({ originalIndex }) => {
      if (!allowedTurnIndices) return true;
      return allowedTurnIndices.has(originalIndex);
    });

  const activeKeywords = React.useMemo(() => {
    const kwSet = new Set<string>();
    for (const t of topics) {
      if (isAllSelected || selectedTopicIds.includes(t.id)) {
        t.keywords.forEach((k) => kwSet.add(k));
      }
    }
    return Array.from(kwSet).slice(0, 8);
  }, [isAllSelected, selectedTopicIds, topics]);

  const getTopicLabelForTurn = (index: number): string | undefined => {
    if (!topics || topics.length <= 1) return undefined;
    const found = topics.find((t) => t.turn_indices.includes(index));
    return found ? found.title : undefined;
  };

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
                {displayedEntries.length} of {data.message_count} {data.message_count === 1 ? "turn" : "turns"}
              </Badge>
              {viewMode === "compressed" && (
                <Badge variant="success" className="gap-1 font-mono text-xs">
                  <Zap className="h-3 w-3 text-[#00ff88]" />
                  Compressed View
                </Badge>
              )}
              {topics.length > 1 && (
                <Badge variant="outline" className="gap-1 font-mono text-xs border-emerald-500/40 text-[#00ff88]">
                  <Layers className="h-3 w-3" />
                  {topics.length} Subtopics
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
                  <span className="text-[#00ff88]">Transcript Copied!</span>
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

      {/* Phase 2: Clickable Topic Filter Chips Bar */}
      {topics.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-emerald-500/30 bg-zinc-950/80 p-4 shadow-xl neon-glow-card backdrop-blur-md space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              <Filter className="h-3.5 w-3.5 text-[#00ff88]" />
              <span>Multi-Select Subtopics (Toggable)</span>
              {isLoadingTopics && <Loader2 className="h-3 w-3 animate-spin text-[#00ff88]" />}
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              {isAllSelected
                ? `Showing all ${data.message_count} turns`
                : `Filtered to ${displayedEntries.length} turns (${selectedTopicIds.length} of ${topics.length} selected)`}
            </span>
          </div>

          {/* Filter Pills Carousel (Multi-select toggling) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* "All Turns" Toggle Chip */}
            <button
              type="button"
              onClick={handleSelectAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                isAllSelected
                  ? "bg-emerald-500/20 text-[#00ff88] border border-emerald-500/60 shadow-[0_0_12px_rgba(0,255,136,0.25)] font-bold"
                  : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:border-emerald-500/30 hover:text-zinc-200"
              }`}
            >
              {isAllSelected && <Check className="h-3 w-3 stroke-[3] text-[#00ff88]" />}
              <span>All Turns</span>
              <span className="text-[10px] opacity-75 font-normal">({data.message_count})</span>
            </button>

            {/* Individual Subtopic Cluster Toggable Chips */}
            {topics.map((topic, idx) => {
              const isSelected = selectedTopicIds.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleToggleTopic(topic.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500/25 text-[#00ff88] border border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.35)] font-bold"
                      : "bg-zinc-900/70 border border-zinc-800 text-zinc-300 hover:border-emerald-500/40 hover:text-[#00ff88] hover:bg-emerald-500/5"
                  }`}
                  title={isSelected ? "Click to deselect topic" : "Click to add topic to filter"}
                >
                  <span className="flex items-center gap-1.5">
                    {isSelected ? (
                      <Check className="h-3 w-3 stroke-[3] text-[#00ff88] shrink-0" />
                    ) : (
                      <span className="text-[10px] text-emerald-400 opacity-80 shrink-0">{idx + 1}.</span>
                    )}
                    <span className="truncate max-w-[180px] sm:max-w-[260px]">{topic.title}</span>
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded border shrink-0 ${
                      isSelected
                        ? "bg-emerald-500/20 text-[#00ff88] border-emerald-500/40"
                        : "bg-zinc-800/80 text-zinc-400 border-zinc-700/60"
                    }`}
                  >
                    {topic.turn_count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Topics Keywords Pill */}
          {activeKeywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono text-zinc-500 border-t border-zinc-900">
              <span className="flex items-center gap-1 text-emerald-400/70">
                <Tag className="h-3 w-3" /> Topic Keywords:
              </span>
              {activeKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px]"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Message Stream with AnimatePresence & Filtering */}
      <div className="space-y-4 w-full min-w-0 max-w-full">
        <AnimatePresence mode="popLayout">
          {displayedEntries.map(({ message, originalIndex }) => (
            <ChatMessageItem
              key={`${viewMode}-${originalIndex}`}
              message={message}
              topicLabel={getTopicLabelForTurn(originalIndex)}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
