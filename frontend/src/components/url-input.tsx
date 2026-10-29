"use client";

import React, { useState } from "react";
import { Link2, Sparkles, Loader2, ArrowRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SampleChatOption } from "@/lib/api";

interface UrlInputProps {
  onFetch: (url: string) => Promise<void>;
  isLoading: boolean;
  samples: SampleChatOption[];
}

export function UrlInput({ onFetch, isLoading, samples }: UrlInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onFetch(url.trim());
    }
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    onFetch(sampleUrl);
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500/70">
            <Link2 className="h-4 w-4" />
          </div>
          <Input
            type="text"
            placeholder="Paste public shared LLM chat URL (e.g. https://chatgpt.com/share/...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="pl-11 pr-10 text-sm shadow-xl border-emerald-500/30 bg-zinc-950/90 focus-visible:border-[#00ff88] focus-visible:ring-[#00ff88]/30"
          />
          {url && !isLoading && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-emerald-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          type="submit"
          disabled={!url.trim() || isLoading}
          variant="neon"
          className="h-12 px-6 gap-2 shrink-0 font-bold"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#00ff88]" />
              <span className="text-[#00ff88]">Fetching...</span>
            </>
          ) : (
            <>
              <span className="text-[#00ff88]">Fetch Chat</span>
              <ArrowRight className="h-4 w-4 text-[#00ff88]" />
            </>
          )}
        </Button>
      </form>

      {/* Quick Sample Links with Neon Green Accents */}
      {samples.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-zinc-400">
          <span className="flex items-center gap-1 font-semibold text-emerald-400 neon-text-glow">
            <Sparkles className="h-3.5 w-3.5 text-[#00ff88]" /> Quick test:
          </span>
          {samples.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectSample(s.url)}
              disabled={isLoading}
              className="rounded-lg border border-emerald-500/30 bg-zinc-950/80 px-3 py-1 text-zinc-300 hover:border-[#00ff88] hover:text-[#00ff88] hover:bg-emerald-500/10 transition-all text-xs disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(0,255,136,0.2)]"
            >
              {s.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
