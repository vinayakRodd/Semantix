"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  History,
  Bot,
  Settings,
  Sparkles,
  Cpu,
  ShieldCheck,
  Search,
  FileText,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (url: string) => void;
  onNewChat: () => void;
}

const RECENT_CHATS = [
  {
    id: "sample-fastapi",
    title: "Python Async FastAPI Architecture",
    platform: "ChatGPT-4o",
    url: "sample://fastapi-architecture",
  },
  {
    id: "sample-claude",
    title: "Dark Design Systems & Radix",
    platform: "Claude 3.5",
    url: "sample://claude-design-system",
  },
  {
    id: "biweekly-topics",
    title: "LeetCode Biweekly Contest Topics",
    platform: "ChatGPT",
    url: "https://chatgpt.com/share/6ae37b26-33fc-83ee-8bb6-d4b75eacf0bd",
  },
  {
    id: "gcd-splits",
    title: "Optimize GCD Splits O(N)",
    platform: "ChatGPT",
    url: "https://chatgpt.com/share/6ae3806f-6bc0-83ee-99d2-36736c538615",
  },
];

const SEM_EL_MODULES = [
  {
    num: "1",
    name: "Local Processing & Compression",
    status: "Active",
    active: true,
    icon: Cpu,
  },
  {
    num: "2",
    name: "Internal Factual Verification",
    status: "Standby",
    active: false,
    icon: ShieldCheck,
  },
  {
    num: "3",
    name: "External Fact-Checking",
    status: "Standby",
    active: false,
    icon: Search,
  },
  {
    num: "4",
    name: "Document Gen & Evaluation",
    status: "Active",
    active: true,
    icon: FileText,
  },
];

export function Sidebar({ isOpen, onClose, onSelectChat, onNewChat }: SidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          />

          {/* Sidebar Drawer */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col border-r border-emerald-500/30 bg-[#080a09]/95 text-zinc-100 shadow-[0_0_35px_rgba(0,255,136,0.18)] backdrop-blur-2xl"
          >
            {/* Top Branding & Close Header */}
            <div className="flex h-16 items-center justify-between border-b border-emerald-500/20 px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/50 bg-zinc-950 text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.3)]">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="font-mono text-sm font-bold tracking-tight text-white">
                  Meghu<span className="text-[#00ff88] neon-text-glow">Chat</span>
                </div>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.2 text-[10px] font-mono text-[#00ff88]">
                  v1.0
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-emerald-500/40 hover:text-[#00ff88] transition-colors cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Main Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
              {/* New Chat Action */}
              <button
                type="button"
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="group flex w-full items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-zinc-950/80 p-3 text-xs font-mono font-bold text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.15)] hover:bg-emerald-500/10 hover:border-[#00ff88] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 stroke-[3]" />
                  <span>New Conversation Inspect</span>
                </div>
                <Sparkles className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
              </button>

              {/* Recent Conversations / History Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400/80">
                  <History className="h-3.5 w-3.5" />
                  <span>Recent Conversations</span>
                </div>

                <div className="space-y-1">
                  {RECENT_CHATS.map((chat) => (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => {
                        onSelectChat(chat.url);
                        onClose();
                      }}
                      className="group flex w-full items-center justify-between rounded-xl border border-transparent p-2.5 text-left text-xs transition-all hover:border-emerald-500/30 hover:bg-zinc-900/60 cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5 pr-2">
                        <div className="truncate font-medium text-zinc-200 group-hover:text-[#00ff88]">
                          {chat.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                          <span>{chat.platform}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600 group-hover:text-[#00ff88] transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Sem-EL Pipeline Architecture Status */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 px-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400/80">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Sem-EL Pipeline Modules</span>
                </div>

                <div className="space-y-1.5">
                  {SEM_EL_MODULES.map((mod) => {
                    const IconComponent = mod.icon;
                    return (
                      <div
                        key={mod.num}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all ${
                          mod.active
                            ? "border-emerald-500/30 bg-emerald-950/20 text-zinc-200"
                            : "border-zinc-800/80 bg-zinc-950/40 text-zinc-500"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <IconComponent
                            className={`h-4 w-4 shrink-0 ${
                              mod.active ? "text-[#00ff88]" : "text-zinc-600"
                            }`}
                          />
                          <span className="truncate text-xs">{mod.name}</span>
                        </div>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-mono shrink-0 ${
                            mod.active
                              ? "bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40"
                              : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                          }`}
                        >
                          {mod.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom User Profile Section */}
            <div className="border-t border-emerald-500/20 bg-zinc-950/90 p-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-zinc-900/60 p-3 shadow-md hover:border-emerald-500/50 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  {/* User Avatar with Glowing Neon Online Dot */}
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/50 bg-zinc-950 text-sm font-bold font-mono text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.25)]">
                    VR
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ff88] opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-zinc-950 bg-[#00ff88]"></span>
                    </span>
                  </div>

                  {/* User Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-bold text-white">
                        Vinayak Rodd
                      </span>
                    </div>
                    <div className="truncate text-[10px] font-mono text-zinc-400">
                      vinayakrodd70@gmail.com
                    </div>
                  </div>
                </div>

                {/* Settings Action Button */}
                <button
                  type="button"
                  title="Profile Settings"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-emerald-500/40 hover:text-[#00ff88] hover:bg-emerald-500/10 transition-colors cursor-pointer shrink-0"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
