"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  BookOpen,
  CheckSquare,
  Download,
  Copy,
  Check,
  Loader2,
  Clock,
  Sparkles,
  FileDown,
} from "lucide-react";
import {
  ChatMessage,
  GenerateDocumentResponse,
  generateDocumentFromBackend,
} from "@/lib/api";
import { MarkdownContent } from "@/components/markdown-content";

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  conversationTitle: string;
}

type DocType = "study_notes" | "executive_summary" | "decision_log";

const DOC_TYPES = [
  {
    id: "study_notes" as DocType,
    label: "Study Notes",
    desc: "Key principles, syntax & code patterns",
    icon: BookOpen,
  },
  {
    id: "executive_summary" as DocType,
    label: "Executive Summary",
    desc: "Architecture, problem statement & tradeoffs",
    icon: FileText,
  },
  {
    id: "decision_log" as DocType,
    label: "Decision Log & Tasks",
    desc: "Accepted ADRs & action checklist",
    icon: CheckSquare,
  },
];

export function DocumentModal({
  isOpen,
  onClose,
  messages,
  conversationTitle,
}: DocumentModalProps) {
  const [activeType, setActiveType] = useState<DocType>("study_notes");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [docData, setDocData] = useState<GenerateDocumentResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate or re-generate when modal opens or activeType changes
  useEffect(() => {
    if (!isOpen || !messages || messages.length === 0) return;

    let isMounted = true;
    async function fetchDoc() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await generateDocumentFromBackend(
          messages,
          activeType,
          conversationTitle
        );
        if (isMounted && res.success) {
          setDocData(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to generate document.");
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDoc();
    return () => {
      isMounted = false;
    };
  }, [isOpen, activeType, messages, conversationTitle]);

  const handleCopy = () => {
    if (!docData) return;
    navigator.clipboard.writeText(docData.markdown_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (extension: "md" | "txt") => {
    if (!docData) return;
    const mimeType = extension === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
    const blob = new Blob([docData.markdown_content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const safeTitle = (conversationTitle || "document")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .replace(/_+/g, "_");
    const filename = `${safeTitle}_${activeType}.${extension}`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-50 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-emerald-500/40 bg-[#080a09] text-zinc-100 shadow-[0_0_50px_rgba(0,255,136,0.2)] backdrop-blur-3xl overflow-hidden"
          >
            {/* Top Modal Header */}
            <div className="flex items-center justify-between border-b border-emerald-500/20 px-6 py-4.5 bg-zinc-950/80">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/50 bg-zinc-950 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.25)]">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
                    <span>Sem-EL Document Generator</span>
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-[#00ff88]">
                      Module 4
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Deterministic synthesis & structured file exporter
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-emerald-500/40 hover:text-[#00ff88] transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Document Type Selector Tabs */}
            <div className="border-b border-zinc-800/80 bg-zinc-950/50 px-6 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DOC_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isActive = activeType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveType(t.id)}
                      className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                        isActive
                          ? "border-[#00ff88] bg-emerald-500/15 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.2)] font-bold"
                          : "border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:border-emerald-500/30 hover:text-zinc-200"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-mono">{t.label}</div>
                        <div className="truncate text-[10px] opacity-75 font-normal">
                          {t.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Preview & Content Area */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#00ff88]" />
                  <span className="text-xs font-mono text-emerald-400/90 animate-pulse">
                    Synthesizing {DOC_TYPES.find((d) => d.id === activeType)?.label}...
                  </span>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/20 text-xs text-rose-300">
                  {error}
                </div>
              ) : docData ? (
                <div className="space-y-4">
                  {/* Meta pill row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-zinc-950/80 p-3 text-xs font-mono">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Sparkles className="h-3.5 w-3.5 text-[#00ff88]" />
                      <span>Word Count: <strong className="text-white">{docData.word_count.toLocaleString()}</strong> words</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Generated in <strong>{docData.generation_time_ms} ms</strong></span>
                    </div>
                  </div>

                  {/* Formatted Markdown Body */}
                  <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/50 p-6 shadow-inner">
                    <MarkdownContent content={docData.markdown_content} />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Bottom Modal Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-500/20 bg-zinc-950/90 px-6 py-4">
              <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                Format: Clean Markdown (.md) compatible with Notion, Obsidian, GitHub
              </span>

              <div className="flex items-center gap-2 ml-auto">
                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!docData || isLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-zinc-900 px-4 py-2 text-xs font-mono font-medium text-emerald-300 hover:border-emerald-400 hover:text-[#00ff88] transition-all cursor-pointer disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#00ff88]" />
                      <span className="text-[#00ff88]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Document</span>
                    </>
                  )}
                </button>

                {/* Download .txt */}
                <button
                  type="button"
                  onClick={() => handleDownloadFile("txt")}
                  disabled={!docData || isLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-300 hover:border-zinc-700 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                  title="Download as plain text (.txt)"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>.txt</span>
                </button>

                {/* Download .md (Primary Neon Action) */}
                <button
                  type="button"
                  onClick={() => handleDownloadFile("md")}
                  disabled={!docData || isLoading}
                  className="flex items-center gap-2 rounded-xl border border-[#00ff88] bg-zinc-950 px-5 py-2 text-xs font-mono font-bold text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.25)] hover:bg-emerald-500/10 hover:shadow-[0_0_25px_rgba(0,255,136,0.4)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
