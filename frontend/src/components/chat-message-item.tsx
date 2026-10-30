"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Cpu, Copy, Check } from "lucide-react";
import { ChatMessage } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/markdown-content";
import { cn } from "@/lib/utils";

interface ChatMessageItemProps {
  message: ChatMessage;
  topicLabel?: string;
  showMetadata?: boolean;
}

export const ChatMessageItem = React.memo(function ChatMessageItem({
  message,
  topicLabel,
  showMetadata = true,
}: ChatMessageItemProps) {
  const isUser = message.role.toLowerCase() === "user";
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn(
        "group relative flex gap-4 rounded-2xl p-4 sm:p-5 transition-all duration-200 w-full min-w-0 max-w-full overflow-hidden",
        isUser
          ? "bg-zinc-950/50 border border-zinc-800/90 hover:border-zinc-700/80"
          : "bg-zinc-950/80 border border-emerald-500/30 neon-glow-card hover:border-emerald-400/50"
      )}
    >
      {/* Avatar Icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border font-semibold text-xs shadow-md mt-0.5",
          isUser
            ? "bg-zinc-900 border-zinc-700 text-zinc-400"
            : "bg-zinc-950 border border-emerald-500/50 text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.25)]"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Cpu className="h-4 w-4 text-[#00ff88]" />
        )}
      </div>

      {/* Message Content Container */}
      <div className="flex-1 min-w-0 max-w-full overflow-hidden space-y-2">
        {/* Header row: Role, timestamp, model, copy action */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span
              className={cn(
                "text-xs font-semibold tracking-wide capitalize",
                isUser ? "text-zinc-300" : "text-[#00ff88] font-mono neon-text-glow"
              )}
            >
              {isUser ? "You / User" : "Assistant"}
            </span>

            {showMetadata && message.model && (
              <Badge variant="neon" className="text-[10px] py-0 px-2 truncate max-w-[150px]">
                {message.model}
              </Badge>
            )}

            {topicLabel && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 truncate max-w-[220px]">
                {topicLabel}
              </span>
            )}

            {showMetadata && message.timestamp && (
              <span className="text-[11px] text-zinc-500 shrink-0 font-mono">
                {message.timestamp}
              </span>
            )}
          </div>

          <button
            onClick={handleCopyMessage}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-zinc-500 hover:text-[#00ff88] hover:bg-emerald-500/10 shrink-0 cursor-pointer"
            title="Copy entire message"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#00ff88]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Formatted Message Body with strict word wrap & horizontal overflow safety */}
        <div className="text-sm min-w-0 max-w-full overflow-hidden break-words [overflow-wrap:anywhere]">
          <MarkdownContent content={message.content} />
        </div>
      </div>
    </motion.div>
  );
});
