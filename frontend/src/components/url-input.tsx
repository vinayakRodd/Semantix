"use client";

import React, { useState } from "react";
import { Link2, Loader2, ArrowRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UrlInputProps {
  onFetch: (url: string) => Promise<void>;
  isLoading: boolean;
}

export function UrlInput({ onFetch, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onFetch(url.trim());
    }
  };

  return (
    <div className="w-full">
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
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-emerald-400 transition-colors cursor-pointer"
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
    </div>
  );
}
