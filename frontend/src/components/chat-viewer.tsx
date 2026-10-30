"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Copy,
  Check,
  Hash,
  Zap,
  DollarSign,
  Clock,
  Loader2,
  TrendingDown,
  Layers,
  Tag,
  Filter,
  ChevronDown,
  SlidersHorizontal,
  Eye,
  FileText,
  Terminal,
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
import { DocumentModal } from "@/components/document-modal";

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

  // Document Generator Modal State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Topic Segmentation States (Multi-select toggling & collapsible)
  const [topics, setTopics] = useState<TopicSegment[]>(data.topics || []);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isTopicsExpanded, setIsTopicsExpanded] = useState(true);

  // Feature Filters Popover State
  const [isFeatureFilterOpen, setIsFeatureFilterOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "assistant">("all");
  const [showTopicBadges, setShowTopicBadges] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);
  const [showMetricsHud, setShowMetricsHud] = useState(true);
  const filterDropdownRef = React.useRef<HTMLDivElement>(null);

  // Document-level click outside & escape key listener for Feature Filters dropdown
  useEffect(() => {
    if (!isFeatureFilterOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFeatureFilterOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFeatureFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFeatureFilterOpen]);

  // Fetch topic segmentation automatically if not already pre-loaded
  useEffect(() => {
    let isMounted = true;

    if (data.topics && data.topics.length > 0) {
      setTopics(data.topics);
      setSelectedTopicIds([]);
      return;
    }

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
  }, [data.messages, data.topics]);

  const handleToggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) => {
      if (prev.includes(topicId)) {
        return prev.filter((id) => id !== topicId);
      } else {
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
        setViewMode("compressed");
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

  // Filter messages based on multi-selected toggled topics AND role filter
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
    .filter(({ message, originalIndex }) => {
      // 1. Topic filtering
      if (allowedTurnIndices && !allowedTurnIndices.has(originalIndex)) {
        return false;
      }
      // 2. Role filtering
      if (roleFilter !== "all" && message.role.toLowerCase() !== roleFilter) {
        return false;
      }
      return true;
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
    if (!showTopicBadges || !topics || topics.length <= 1) return undefined;
    const found = topics.find((t) => t.turn_indices.includes(index));
    return found ? found.title : undefined;
  };

  const hasCustomFilters = roleFilter !== "all" || !showTopicBadges || !showMetadata || !showMetricsHud;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full min-w-0 max-w-full space-y-6 overflow-visible"
    >
      {/* Header Bar with Neon Green Glowing Card */}
      <div className="rounded-2xl border border-emerald-500/40 bg-zinc-950/80 p-4 sm:p-5 shadow-2xl neon-glow-card backdrop-blur-xl w-full min-w-0 max-w-full space-y-4 relative z-30 overflow-visible">
        {/* Full-Width Header: Status Badges & Title (Immune to horizontal squishing) */}
        <div className="space-y-2.5 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neon" className="gap-1.5 font-mono whitespace-nowrap shrink-0">
              <Terminal className="h-3 w-3 text-[#00ff88]" />
              {data.platform}
            </Badge>
            <Badge variant="secondary" className="gap-1 font-mono text-zinc-300 border-zinc-800 whitespace-nowrap shrink-0">
              <Hash className="h-3 w-3 text-emerald-400" />
              {displayedEntries.length} of {data.message_count} {data.message_count === 1 ? "turn" : "turns"}
            </Badge>
            {viewMode === "compressed" && (
              <Badge variant="success" className="gap-1 font-mono text-xs whitespace-nowrap shrink-0">
                <Zap className="h-3 w-3 text-[#00ff88]" />
                Compressed View
              </Badge>
            )}
            {topics.length > 1 && (
              <Badge variant="outline" className="gap-1 font-mono text-xs border-emerald-500/40 text-[#00ff88] whitespace-nowrap shrink-0">
                <Layers className="h-3 w-3" />
                {topics.length} Subtopics
              </Badge>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white break-words leading-snug w-full">
            {data.title}
          </h2>
        </div>

        {/* Full-Width Action & Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 w-full">
          {/* View switcher on the left */}
          <div className="flex items-center gap-2">
            {compressedMessages && (
              <div className="flex items-center gap-1 rounded-xl bg-zinc-900/90 p-1 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setViewMode("original")}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === "original"
                      ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Original ({data.messages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("compressed")}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    viewMode === "compressed"
                      ? "bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,136,0.15)] font-bold"
                      : "text-zinc-400 hover:text-[#00ff88]"
                  }`}
                >
                  <Zap className="h-3 w-3" />
                  Compressed ({compressedMessages.length})
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons on the right */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Feature Filters Dropdown Button */}
            <div ref={filterDropdownRef} className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFeatureFilterOpen(!isFeatureFilterOpen)}
                className={`gap-1.5 text-xs font-mono transition-all cursor-pointer ${
                  hasCustomFilters
                    ? "border-[#00ff88] text-[#00ff88] bg-emerald-500/15 shadow-[0_0_12px_rgba(0,255,136,0.25)]"
                    : "border-emerald-500/30 text-emerald-300 hover:text-[#00ff88] hover:border-emerald-400"
                }`}
                title="Toggle viewing features and filters"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Feature Filters</span>
                {hasCustomFilters && (
                  <span className="h-2 w-2 rounded-full bg-[#00ff88] animate-pulse" />
                )}
              </Button>

              {/* Feature Filters Popover Panel */}
              <AnimatePresence>
                {isFeatureFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 z-50 w-80 rounded-2xl border-2 border-emerald-500/50 bg-[#080a09] p-4 shadow-[0_0_35px_rgba(0,255,136,0.3)] backdrop-blur-3xl space-y-4"
                  >
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00ff88] flex items-center gap-1.5 neon-text-glow">
                          <Eye className="h-3.5 w-3.5" />
                          Feature Controls
                        </span>
                        {hasCustomFilters && (
                          <button
                            type="button"
                            onClick={() => {
                              setRoleFilter("all");
                              setShowTopicBadges(true);
                              setShowMetadata(true);
                              setShowMetricsHud(true);
                            }}
                            className="text-[10px] font-mono text-zinc-500 hover:text-emerald-300 transition-colors cursor-pointer"
                          >
                            Reset Defaults
                          </button>
                        )}
                      </div>

                      {/* 1. Role Filter Toggle */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-zinc-400">
                          Filter by Speaker Role:
                        </label>
                        <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-900 p-1 border border-zinc-800">
                          <button
                            type="button"
                            onClick={() => setRoleFilter("all")}
                            className={`rounded-lg py-1 text-[11px] font-mono transition-all cursor-pointer ${
                              roleFilter === "all"
                                ? "bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40 font-bold"
                                : "text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoleFilter("user")}
                            className={`rounded-lg py-1 text-[11px] font-mono transition-all cursor-pointer ${
                              roleFilter === "user"
                                ? "bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40 font-bold"
                                : "text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            User
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoleFilter("assistant")}
                            className={`rounded-lg py-1 text-[11px] font-mono transition-all cursor-pointer ${
                              roleFilter === "assistant"
                                ? "bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40 font-bold"
                                : "text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            Assistant
                          </button>
                        </div>
                      </div>

                      {/* 2. macOS Style Feature Toggles */}
                      <div className="space-y-1 pt-2 border-t border-zinc-800/80">
                        <MacToggle
                          checked={showTopicBadges}
                          onChange={setShowTopicBadges}
                          label="Subtopic Badges on Turns"
                        />
                        <MacToggle
                          checked={showMetadata}
                          onChange={setShowMetadata}
                          label="Timestamps & Model Tags"
                        />
                        <MacToggle
                          checked={showMetricsHud}
                          onChange={setShowMetricsHud}
                          label="Live Metrics HUD Card"
                        />
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Analyse Action Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDocModalOpen(true)}
              className="gap-1.5 text-xs font-bold border-emerald-500/50 bg-emerald-950/20 text-[#00ff88] hover:bg-emerald-500/10 hover:border-[#00ff88] hover:shadow-[0_0_15px_rgba(0,255,136,0.3)] cursor-pointer whitespace-nowrap"
            >
              <FileText className="h-3.5 w-3.5 text-[#00ff88]" />
              <span>Analyse</span>
            </Button>

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
              className="text-xs text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 whitespace-nowrap"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Error state if compression fails */}
      {compressionError && (
        <div className="p-3.5 rounded-xl border border-rose-900/50 bg-rose-950/20 text-xs text-rose-300">
          {compressionError}
        </div>
      )}

      {/* Live Animated Metrics Bar HUD */}
      <AnimatePresence>
        {showMetricsHud && metrics && (
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

      {/* Phase 2: Clickable Topic Filter Chips Bar (Collapsible with Dropdown Arrow) */}
      {topics.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-emerald-500/30 bg-zinc-950/80 p-4 shadow-xl neon-glow-card backdrop-blur-md space-y-3"
        >
          {/* Collapsible Header with Dropdown Arrow */}
          <div
            onClick={() => setIsTopicsExpanded(!isTopicsExpanded)}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 group-hover:text-[#00ff88] transition-colors">
              <Filter className="h-3.5 w-3.5 text-[#00ff88]" />
              <span>Multi-Select Subtopics (Toggable)</span>
              {isLoadingTopics && <Loader2 className="h-3 w-3 animate-spin text-[#00ff88]" />}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                {isAllSelected
                  ? `Showing all ${data.message_count} turns`
                  : `Filtered to ${displayedEntries.length} turns (${selectedTopicIds.length} of ${topics.length} selected)`}
              </span>

              {/* Animated Dropdown Chevron Arrow */}
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 group-hover:border-emerald-500/40 group-hover:text-[#00ff88] transition-all"
                title={isTopicsExpanded ? "Collapse subtopics bar" : "Expand subtopics bar"}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isTopicsExpanded ? "rotate-180 text-[#00ff88]" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Collapsible Subtopics Body */}
          <AnimatePresence initial={false}>
            {isTopicsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden space-y-3 pt-1"
              >
                {/* Filter Pills Carousel (Multi-select toggling) */}
                <div className="flex flex-wrap items-center gap-2">
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
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] font-mono text-zinc-500 border-t border-zinc-900">
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
          </AnimatePresence>
        </motion.div>
      )}

      {/* Message Stream with AnimatePresence & Filtering */}
      <div className="space-y-4 w-full min-w-0 max-w-full">
        <AnimatePresence>
          {displayedEntries.map(({ message, originalIndex }) => (
            <ChatMessageItem
              key={`${viewMode}-${originalIndex}`}
              message={message}
              topicLabel={getTopicLabelForTurn(originalIndex)}
              showMetadata={showMetadata}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Document Generator & Exporter Modal */}
      <DocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        messages={displayedEntries.map((e) => e.message)}
        conversationTitle={data.title}
      />
    </motion.div>
  );
}

function MacToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between cursor-pointer select-none group py-1.5"
    >
      <span className="text-xs font-mono text-zinc-300 group-hover:text-white transition-colors">
        {label}
      </span>
      {/* macOS capsule track */}
      <div
        className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
          checked
            ? "bg-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.45)]"
            : "bg-zinc-800 border border-zinc-700/80"
        }`}
      >
        {/* macOS circular slider knob */}
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full shadow-md transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-5 bg-zinc-950" : "translate-x-1 bg-zinc-400"
          }`}
        />
      </div>
    </div>
  );
}
