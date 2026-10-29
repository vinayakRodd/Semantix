"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Copy, Check, Hash, Sparkles } from "lucide-react";
import { FetchChatResponse } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatMessageItem } from "@/components/chat-message-item";

interface ChatViewerProps {
  data: FetchChatResponse;
  onClear: () => void;
}

export function ChatViewer({ data, onClear }: ChatViewerProps) {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyTranscript = () => {
    const transcript = data.messages
      .map(
        (m) =>
          `[${m.role.toUpperCase()}${m.timestamp ? ` - ${m.timestamp}` : ""}]\n${m.content}\n`
      )
      .join("\n---\n\n");

    navigator.clipboard.writeText(
      `# ${data.title}\nSource: ${data.url}\n\n${transcript}`
    );
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
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
      <div className="rounded-2xl border border-emerald-500/40 bg-zinc-950/80 p-4 sm:p-5 shadow-2xl neon-glow-card backdrop-blur-xl w-full min-w-0 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neon" className="gap-1.5 font-mono">
                <Sparkles className="h-3 w-3 text-[#00ff88]" />
                {data.platform}
              </Badge>
              <Badge variant="secondary" className="gap-1 font-mono text-zinc-400 border-zinc-800">
                <Hash className="h-3 w-3 text-emerald-400" />
                {data.message_count} {data.message_count === 1 ? "turn" : "turns"}
              </Badge>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white break-words">
              {data.title}
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyTranscript}
              className="gap-1.5 text-xs border-emerald-500/40 text-emerald-300 hover:text-[#00ff88] hover:border-emerald-400 hover:shadow-[0_0_12px_rgba(0,255,136,0.25)]"
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-zinc-900/90 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400 hover:text-[#00ff88] transition-all hover:shadow-[0_0_10px_rgba(0,255,136,0.2)]"
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
      </div>

      {/* Message Stream with AnimatePresence */}
      <div className="space-y-4 w-full min-w-0 max-w-full">
        <AnimatePresence>
          {data.messages.map((message, idx) => (
            <ChatMessageItem key={idx} message={message} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
