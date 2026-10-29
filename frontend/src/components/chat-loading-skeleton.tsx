"use client";

import React from "react";
import { motion } from "framer-motion";
import { Terminal, Cpu, User, Activity } from "lucide-react";

export function ChatLoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-6"
    >
      {/* Loading Header Pill */}
      <div className="rounded-2xl border border-emerald-500/40 bg-zinc-950/80 p-5 shadow-2xl neon-glow-card backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full bg-[#00ff88] animate-ping" />
            <span className="text-xs font-mono font-semibold tracking-wider text-[#00ff88] uppercase flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5" />
              Fetching & Parsing Shared Chat
            </span>
          </div>
          <span className="text-xs font-mono text-emerald-400/80 animate-pulse">
            Analyzing Stream...
          </span>
        </div>

        {/* Animated Neon Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden relative border border-emerald-500/20">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-[#00ff88] to-green-400"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Simulated User Turn Skeleton */}
      <div className="flex gap-4 rounded-2xl p-5 border border-zinc-800 bg-zinc-900/30 animate-pulse">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500">
          <User className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-3.5 w-24 bg-zinc-800 rounded-md" />
          <div className="h-4 w-3/4 bg-zinc-800/80 rounded-md" />
        </div>
      </div>

      {/* Simulated Assistant Turn Skeleton */}
      <div className="flex gap-4 rounded-2xl p-5 border border-emerald-500/30 bg-zinc-950/60 neon-glow-card animate-pulse">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-zinc-950 border border-emerald-500/50 flex items-center justify-center text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.2)]">
          <Cpu className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-28 bg-emerald-500/20 rounded-md" />
            <div className="h-4 w-16 bg-emerald-500/30 rounded-full" />
          </div>
          <div className="h-4 w-full bg-zinc-800/70 rounded-md" />
          <div className="h-4 w-5/6 bg-zinc-800/70 rounded-md" />
          <div className="h-24 w-full bg-zinc-900/90 rounded-xl border border-emerald-500/20 mt-2 flex items-center justify-center">
            <span className="text-xs font-mono text-emerald-400/70 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Parsing markdown & code blocks...
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
