"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Cpu,
  User,
  Activity,
  Check,
  Globe,
  Binary,
  Layers,
  Sparkles,
  Loader2,
} from "lucide-react";

interface StageInfo {
  name: "Fetching" | "Parsing" | "Processing" | "Loading";
  step: string;
  desc: string;
  icon: React.ElementType;
}

const STAGES: StageInfo[] = [
  {
    name: "Fetching",
    step: "01",
    desc: "Fetching conversation stream from remote server...",
    icon: Globe,
  },
  {
    name: "Parsing",
    step: "02",
    desc: "Parsing Turbo-stream & extracting dialogue turns...",
    icon: Binary,
  },
  {
    name: "Processing",
    step: "03",
    desc: "Processing turn hierarchies, code patterns & GenUI widgets...",
    icon: Layers,
  },
  {
    name: "Loading",
    step: "04",
    desc: "Loading interactive dialogue matrix into viewport...",
    icon: Sparkles,
  },
];

export function ChatLoadingSkeleton() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1100);

    return () => clearInterval(timer);
  }, []);

  const currentStage = STAGES[stageIndex];
  const CurrentIcon = currentStage.icon;
  const progressPercent = ((stageIndex + 1) / STAGES.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-6"
    >
      {/* Dynamic Multi-Stage Loader Card */}
      <div className="rounded-2xl border border-emerald-500/40 bg-zinc-950/85 p-5 sm:p-6 shadow-[0_0_40px_rgba(0,255,136,0.12)] backdrop-blur-xl space-y-5">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/50 bg-zinc-950 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.25)]">
              <Loader2 className="h-4 w-4 animate-spin text-[#00ff88]" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-wider text-[#00ff88] uppercase flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5" />
                <span>Dialogue Ingestion Stream</span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Synchronizing shared conversation tokens
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-[#00ff88]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
            </span>
            <span>Live Stream</span>
          </div>
        </div>

        {/* 4 Step Badges: Fetching, Parsing, Processing, Loading */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCurrent = idx === stageIndex;
            const isCompleted = idx < stageIndex;

            return (
              <div
                key={stage.name}
                className={`relative flex items-center gap-2 rounded-xl border p-2.5 transition-all duration-300 font-mono ${
                  isCurrent
                    ? "border-[#00ff88] bg-emerald-500/15 text-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.25)] font-bold"
                    : isCompleted
                    ? "border-emerald-500/40 bg-zinc-900/60 text-emerald-400 font-medium"
                    : "border-zinc-800/80 bg-zinc-900/20 text-zinc-600 font-normal"
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs ${
                    isCurrent
                      ? "bg-zinc-950 text-[#00ff88] border border-emerald-500/50"
                      : isCompleted
                      ? "bg-emerald-500/20 text-[#00ff88]"
                      : "bg-zinc-900 text-zinc-600"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs truncate">{stage.name}</span>
                    {isCurrent && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00ff88] animate-ping" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Stage Text Display */}
        <div className="flex items-center justify-between px-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-xs font-mono"
            >
              <CurrentIcon className="h-3.5 w-3.5 text-[#00ff88] animate-pulse" />
              <span className="font-bold text-[#00ff88]">{currentStage.name}:</span>
              <span className="text-zinc-300">{currentStage.desc}</span>
            </motion.div>
          </AnimatePresence>

          <span className="text-xs font-mono text-emerald-400/80 font-bold hidden sm:inline">
            {stageIndex + 1} / {STAGES.length}
          </span>
        </div>

        {/* Animated Neon Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden relative border border-emerald-500/20">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-[#00ff88] to-green-300"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
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
          <div className="h-20 w-full bg-zinc-900/90 rounded-xl border border-emerald-500/20 mt-2 flex items-center justify-center">
            <span className="text-xs font-mono text-emerald-400/80 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 animate-spin" />
              <span>Decoding AST dialogue stream & code patterns...</span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
