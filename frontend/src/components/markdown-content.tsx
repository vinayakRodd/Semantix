"use client";

import React, { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  Check,
  Copy,
  GitBranch,
  Search,
  GitMerge,
  Network,
  Layers,
  Binary,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  Workflow,
  Code,
  ImageIcon,
  ExternalLink,
} from "lucide-react";

interface MarkdownContentProps {
  content: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  topics: Array<{ name: string; days?: string }>;
}

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupItem {
  id: string;
  options: RadioOption[];
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  // Pre-process Canvas / DIL / GenUI markup and unindent outside code
  const { processedText, checklists, radioGroups } = preprocessCanvasContent(content);

  const customComponents: Components = {
    // Code blocks
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !className && typeof children === "string" && !children.includes("\n");

      if (isInline) {
        return (
          <code
            className="rounded bg-zinc-900/90 px-1.5 py-0.5 font-mono text-[13px] text-[#00ff88] border border-emerald-500/30 break-all [overflow-wrap:anywhere]"
            {...props}
          >
            {children}
          </code>
        );
      }

      const codeString = String(children).replace(/\n$/, "");
      const language = match ? match[1] : "code";

      return <CodeBlock language={language} code={codeString} />;
    },

    // Paragraphs rendered as <div> to avoid DOM nesting violations and horizontal overflow
    p({ children }) {
      return (
        <div className="leading-relaxed text-zinc-300 my-2 break-words [overflow-wrap:anywhere]">
          {children}
        </div>
      );
    },

    // Tables with horizontal scrolling container and neon green header border
    table({ children }) {
      return (
        <div className="my-5 w-full max-w-full overflow-x-auto rounded-xl border border-emerald-500/30 bg-zinc-950/70 shadow-lg">
          <table className="w-full text-left text-sm text-zinc-200 divide-y divide-zinc-800">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }) {
      return (
        <thead className="bg-zinc-900/95 text-xs font-mono font-semibold uppercase tracking-wider text-[#00ff88] border-b border-emerald-500/30">
          {children}
        </thead>
      );
    },
    th({ children }) {
      return (
        <th className="px-4 py-3 font-semibold text-emerald-300 border-b border-emerald-500/30 whitespace-nowrap">
          {children}
        </th>
      );
    },
    tbody({ children }) {
      return (
        <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
          {children}
        </tbody>
      );
    },
    tr({ children }) {
      return (
        <tr className="hover:bg-emerald-500/5 transition-colors">
          {children}
        </tr>
      );
    },
    td({ children }) {
      return <td className="px-4 py-3 text-zinc-300 break-words">{children}</td>;
    },

    // Headings
    h1({ children }) {
      return (
        <h1 className="text-2xl font-bold text-white pt-4 pb-1 border-b border-zinc-800 break-words">
          {children}
        </h1>
      );
    },
    h2({ children }) {
      return (
        <h2 className="text-xl font-bold text-white pt-4 pb-1 break-words">
          {children}
        </h2>
      );
    },
    h3({ children }) {
      return (
        <h3 className="text-lg font-semibold text-white pt-3 pb-1 break-words">
          {children}
        </h3>
      );
    },
    h4({ children }) {
      return (
        <h4 className="text-base font-semibold text-emerald-400 pt-2 break-words">
          {children}
        </h4>
      );
    },

    // Horizontal rule
    hr({ ...props }) {
      return <hr className="border-emerald-500/20 my-4 w-full" {...props} />;
    },

    // Lists
    ul({ children }) {
      return <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-300 break-words my-2">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="list-decimal list-inside space-y-1.5 pl-2 text-zinc-300 break-words my-2">{children}</ol>;
    },
    li({ children }) {
      return <li className="leading-relaxed break-words [overflow-wrap:anywhere]">{children}</li>;
    },

    // Links with neon green styling
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-[#00ff88] hover:text-[#44ffaa] underline underline-offset-2 break-all [overflow-wrap:anywhere] transition-colors"
        >
          {children}
        </a>
      );
    },

    // Blockquotes
    blockquote({ children }) {
      return (
        <blockquote className="border-l-2 border-[#00ff88] pl-4 py-1 text-zinc-400 italic bg-emerald-500/5 rounded-r-lg my-3 break-words">
          {children}
        </blockquote>
      );
    },

    // Button element (GenUI / ChatGPT button)
    button({ children, ...props }) {
      const attrs = props as Record<string, string | undefined>;
      const isBlock = attrs["data-block"] === "true";
      return (
        <button
          type="button"
          className={`my-3 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all px-5 py-2.5 bg-zinc-950 text-[#00ff88] border border-emerald-500/50 hover:bg-emerald-500/10 hover:border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.2)] hover:shadow-[0_0_25px_rgba(0,255,136,0.35)] cursor-pointer ${
            isBlock ? "w-full" : ""
          }`}
        >
          <span>{children}</span>
        </button>
      );
    },

    // Canvas <div> processor
    div({ children, ...props }) {
      const attrs = props as Record<string, string | undefined>;
      const canvas = attrs["data-canvas"];

      // 1. AsyncImage Screenshot Reference
      if (canvas === "asyncimage") {
        const query = attrs["query"] || "Visual Reference";
        const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;

        return (
          <div className="my-3 inline-block max-w-full">
            <a
              href={searchUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl border border-emerald-500/30 bg-zinc-950/80 hover:border-[#00ff88] hover:bg-emerald-500/5 transition-all shadow-md hover:shadow-[0_0_15px_rgba(0,255,136,0.18)]"
              title={`Search screenshot: ${query}`}
            >
              <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-[#00ff88] group-hover:scale-105 transition-transform">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 group-hover:text-[#00ff88]">
                  <span>Screenshot Reference</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </div>
                <div className="text-xs text-zinc-400 truncate max-w-[280px] sm:max-w-[420px]">
                  {query}
                </div>
              </div>
            </a>
          </div>
        );
      }

      // 2. Interactive RadioGroup
      if (canvas === "radiogroup") {
        const id = attrs["data-id"] || "";
        const item = radioGroups.find((r) => r.id === id);
        if (!item) return null;
        return <InteractiveRadioGroup options={item.options} />;
      }

      // 3. Canvas Box
      if (canvas === "box") {
        const isIconBox =
          attrs["size"] === "44px" ||
          attrs["radius"] === "full" ||
          (attrs["background"] === "surface-secondary" && attrs["border"] === undefined && attrs["align"] === "center" && !attrs["width"]);
        const isFlex1 = attrs["flex"] === "1";
        const isSecondaryStep = attrs["background"] === "surface-secondary" || attrs["background"] === "surface";
        const isCenter = attrs["align"] === "center";

        // Icon badge (44px x 44px)
        if (isIconBox) {
          return (
            <div className="h-11 w-11 min-w-[44px] min-h-[44px] shrink-0 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-center text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.15)]">
              {children}
            </div>
          );
        }

        // Text column inside a row
        if (isFlex1) {
          return (
            <div className="flex-1 min-w-0 space-y-1">
              {children}
            </div>
          );
        }

        // Step box inside a cycle/diagram (like Step 1, Step 2, Step 3 in Section 3)
        if (isSecondaryStep && attrs["width"] === "100%") {
          return (
            <div className="w-full my-2.5 rounded-xl bg-zinc-900/60 border border-emerald-500/30 p-4 text-center space-y-1.5 shadow-lg hover:border-emerald-500/50 transition-all">
              {children}
            </div>
          );
        }

        // Outer card container
        return (
          <div
            className={`my-4 rounded-2xl border border-emerald-500/30 bg-zinc-950/60 p-4 sm:p-5 shadow-xl w-full max-w-full space-y-3.5 neon-glow-card ${
              isCenter ? "flex flex-col items-center text-center" : ""
            }`}
          >
            {children}
          </div>
        );
      }

      if (canvas === "row") {
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 my-2.5 w-full max-w-full">
            {children}
          </div>
        );
      }

      if (canvas === "checklistwidget") {
        const id = attrs["data-id"] || "";
        const item = checklists.find((c) => c.id === id);
        if (!item) return null;
        return <InteractiveChecklist key={id} title={item.title} topics={item.topics} />;
      }

      if (canvas === "title") {
        return <div className="font-bold text-white text-base break-words my-1">{children}</div>;
      }

      return <div className="leading-relaxed text-zinc-300 my-1">{children}</div>;
    },

    // Canvas <span> processor
    span({ children, ...props }) {
      const attrs = props as Record<string, string | undefined>;
      const canvas = attrs["data-canvas"];

      if (canvas === "icon") {
        const iconName = String(attrs["data-name"] || "");
        return <CanvasIcon name={iconName} />;
      }

      if (canvas === "badge") {
        const isSuccess = attrs["color"] === "success";
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border shrink-0 ${
              isSuccess
                ? "bg-emerald-500/20 text-[#00ff88] border-emerald-500/50 shadow-[0_0_10px_rgba(0,255,136,0.2)]"
                : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
            }`}
          >
            {children}
          </span>
        );
      }

      if (canvas === "text") {
        const isSecondary = attrs["color"] === "secondary";
        const isSm = attrs["size"] === "sm" || attrs["size"] === "xs";
        return (
          <span
            className={`${isSecondary ? "text-zinc-400 text-xs block" : "text-zinc-200 text-sm"} ${
              isSm ? "text-xs" : ""
            } break-words`}
          >
            {children}
          </span>
        );
      }

      return <span>{children}</span>;
    },
  };

  return (
    <div className="space-y-4 leading-relaxed text-zinc-200 text-sm w-full min-w-0 max-w-full overflow-hidden break-words [overflow-wrap:anywhere]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={customComponents}
      >
        {processedText}
      </ReactMarkdown>
    </div>
  );
}

function CanvasIcon({ name }: { name: string }) {
  const iconProps = { className: "h-5 w-5 text-[#00ff88] shrink-0" };

  switch (name) {
    case "check-circle":
      return <CheckCircle2 {...iconProps} />;
    case "workflow":
      return <Workflow {...iconProps} />;
    case "code":
      return <Code {...iconProps} />;
    case "git-branch":
      return <GitBranch {...iconProps} />;
    case "search":
      return <Search {...iconProps} />;
    case "git-merge":
      return <GitMerge {...iconProps} />;
    case "network":
      return <Network {...iconProps} />;
    case "layers":
      return <Layers {...iconProps} />;
    case "binary":
      return <Binary {...iconProps} />;
    case "arrow-down":
      return <ArrowDown className="h-4 w-4 text-[#00ff88]/80 my-1 mx-auto block" />;
    case "sparkles":
      return <Sparkles {...iconProps} />;
    default:
      return <Sparkles {...iconProps} />;
  }
}

function preprocessCanvasContent(raw: string): {
  processedText: string;
  checklists: ChecklistItem[];
  radioGroups: RadioGroupItem[];
} {
  const checklists: ChecklistItem[] = [];
  const radioGroups: RadioGroupItem[] = [];

  let text = raw;

  // 1. Process 7-day checklist widget if present
  const topicsMatch = text.match(/topics\s*=\s*(\[\s*\{[\s\S]*?\}\s*\])/);
  if (topicsMatch) {
    try {
      const jsonStr = topicsMatch[1]
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ')
        .replace(/'/g, '"');
      const topics = JSON.parse(jsonStr);

      const checklistId = "checklist-1";
      checklists.push({
        id: checklistId,
        title: "7-Day Revision Checklist",
        topics,
      });

      text = text.replace(
        /\{@body[\s\S]*?\{\/each\}\s*<\/box>/g,
        `\n\n<div data-canvas="checklistwidget" data-id="${checklistId}"></div>\n\n`
      );
    } catch {
      // ignore
    }
  }

  // 2. Strip dangling Svelte template artifacts
  text = text.replace(/\{@body[\s\S]*?\}/g, "");
  text = text.replace(/\{#(?:each|if)[\s\S]*?\}/g, "");
  text = text.replace(/\{\/(?:each|if)\}/g, "");

  // 3. Process <radio-group> and <radio>
  let radioGroupCounter = 0;
  text = text.replace(/<radio-group\b([^>]*)>([\s\S]*?)<\/radio-group>/gi, (match, attrs, content) => {
    const id = `radio-group-${++radioGroupCounter}`;
    const options: RadioOption[] = [];
    const rRegex = /<radio\b([^>]*)>([\s\S]*?)<\/radio>/gi;
    let rMatch;
    while ((rMatch = rRegex.exec(content)) !== null) {
      const valMatch = rMatch[1].match(/value="([^"]+)"/);
      const value = valMatch ? valMatch[1] : rMatch[2].trim();
      const label = rMatch[2].trim();
      options.push({ value, label });
    }
    radioGroups.push({ id, options });
    return `\n\n<div data-canvas="radiogroup" data-id="${id}"></div>\n\n`;
  });

  // 4. Sanitize <button> onClick containing arrow functions or GenUI strings
  text = text.replace(/<button\b([\s\S]*?)onClick="(?:\(\)\s*=>\s*GenUI[\s\S]*?|[^"]*)"\s*>/gi, (match, prefix) => {
    const isBlock = prefix.includes("block");
    return `<button ${isBlock ? "data-block=\"true\"" : ""}>`;
  });

  // 5. Transform Canvas & GenUI XML tags into clean, well-delimited HTML tags
  text = text.replace(/<AsyncImage\b([^>]*?)\/?>/gi, "\n\n<div data-canvas=\"asyncimage\" $1></div>\n\n");
  text = text.replace(/<box\b([^>]*)>/g, "\n\n<div data-canvas=\"box\" $1>\n\n");
  text = text.replace(/<\/box>/g, "\n\n</div>\n\n");
  text = text.replace(/<row\b([^>]*)>/g, "\n\n<div data-canvas=\"row\" $1>\n\n");
  text = text.replace(/<\/row>/g, "\n\n</div>\n\n");
  text = text.replace(/<divider\b[^>]*\/?>/g, "\n\n<hr data-canvas=\"divider\" />\n\n");
  text = text.replace(/<icon\s+name="?([^"\s>]+)"?[^>]*\/?>/g, "\n\n<span data-canvas=\"icon\" data-name=\"$1\"></span>\n\n");
  text = text.replace(/<badge\b([^>]*)>/g, "<span data-canvas=\"badge\" $1>");
  text = text.replace(/<\/badge>/g, "</span>");
  text = text.replace(/<text\b([^>]*)>/g, "<span data-canvas=\"text\" $1>");
  text = text.replace(/<\/text>/g, "</span>");
  text = text.replace(/<title\b([^>]*)>/g, "<div data-canvas=\"title\" $1>");
  text = text.replace(/<\/title>/g, "</div>");
  text = text.replace(/<link\b([^>]*)>/g, "<a $1>");
  text = text.replace(/<\/link>/g, "</a>");
  text = text.replace(/<cite\b[^>]*\/?>/g, "");

  // 6. Split by fenced code blocks to preserve actual code formatting
  const segments = text.split(/(```[\s\S]*?```)/g);

  const processed = segments
    .map((seg) => {
      if (seg.startsWith("```")) {
        return seg;
      }

      let s = seg;

      // CRITICAL: Un-indent lines that have 2+ leading spaces outside fenced code.
      s = s.replace(/^[ \t]+/gm, "");

      // Clean JSX attribute expressions like padding={3} -> padding="3"
      s = s.replace(/([a-zA-Z0-9_-]+)=\{([^{}]+)\}/g, (match, attr, val) => {
        if (attr === "onChange" || attr === "key") return "";
        return `${attr}="${val.replace(/"/g, "&quot;")}"`;
      });

      // Escape non-allowed tags (e.g. C++ templates like <int>, <char>, <vector<int>>)
      const allowedTags = /^(a|p|span|div|b|i|strong|em|code|pre|ul|ol|li|table|thead|tbody|tr|th|td|h1|h2|h3|h4|h5|h6|hr|br|img|blockquote|sub|sup|button)$/i;

      s = s.replace(/<(\/?)([a-zA-Z0-9_-]+)(\s*[^>]*)>/g, (match, slash, tag, rest) => {
        if (allowedTags.test(tag)) {
          return match;
        }
        return `&lt;${slash}${tag}${rest}&gt;`;
      });

      return s;
    })
    .join("");

  return { processedText: processed, checklists, radioGroups };
}

function InteractiveRadioGroup({ options }: { options: RadioOption[] }) {
  const [selected, setSelected] = useState<string>(options[0]?.value || "");

  return (
    <div className="my-3 space-y-2 w-full max-w-md">
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelected(opt.value)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
              isSelected
                ? "bg-emerald-950/30 border-[#00ff88] text-white shadow-[0_0_15px_rgba(0,255,136,0.18)]"
                : "bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-emerald-500/40 hover:text-zinc-200"
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                isSelected
                  ? "border-[#00ff88] bg-zinc-950 shadow-[0_0_8px_rgba(0,255,136,0.5)]"
                  : "border-zinc-700 bg-zinc-900"
              }`}
            >
              {isSelected && <div className="h-2 w-2 rounded-full bg-[#00ff88]" />}
            </div>
            <span className="text-sm font-medium">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function InteractiveChecklist({
  title,
  topics,
}: {
  title: string;
  topics: Array<{ name: string; days?: string }>;
}) {
  const [completed, setCompleted] = useState<number[]>([]);

  const toggle = (idx: number) => {
    setCompleted((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const progressPercent = topics.length > 0 ? (completed.length / topics.length) * 100 : 0;

  return (
    <div className="my-5 w-full max-w-full overflow-hidden rounded-2xl border border-emerald-500/40 bg-zinc-950/80 p-4 sm:p-5 shadow-2xl neon-glow-card backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-bold text-white text-base flex items-center gap-2 truncate font-mono">
          <Sparkles className="h-4 w-4 text-[#00ff88] shrink-0" />
          <span className="truncate">{title}</span>
        </h4>
        <span className="text-xs font-mono font-semibold text-[#00ff88] bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,255,136,0.15)]">
          {completed.length} / {topics.length} completed
        </span>
      </div>

      {/* Neon Progress Bar */}
      <div className="h-2 w-full rounded-full bg-zinc-900 border border-emerald-500/20 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-[#00ff88] to-green-400 transition-all duration-300 shadow-[0_0_12px_rgba(0,255,136,0.4)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2 pt-1 w-full max-w-full">
        {topics.map((topic, i) => {
          const isDone = completed.includes(i);
          return (
            <button
              key={topic.name}
              type="button"
              onClick={() => toggle(i)}
              className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isDone
                  ? "bg-emerald-950/30 border-emerald-500/50 text-[#f0fdf4] shadow-[0_0_12px_rgba(0,255,136,0.1)]"
                  : "bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:border-emerald-500/40 hover:bg-zinc-900/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    isDone
                      ? "bg-[#00ff88] border-[#00ff88] text-zinc-950"
                      : "border-zinc-700 bg-zinc-900"
                  }`}
                >
                  {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <span
                  className={`text-sm font-medium break-words [overflow-wrap:anywhere] ${
                    isDone ? "line-through text-emerald-400/60" : "text-zinc-200"
                  }`}
                >
                  {topic.name}
                </span>
              </div>
              {topic.days && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-900 text-emerald-300 border border-emerald-500/30 shrink-0 ml-2">
                  {topic.days}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-4 w-full max-w-full overflow-hidden rounded-xl border border-emerald-500/30 bg-[#090c0a] font-mono text-xs shadow-xl">
      <div className="flex items-center justify-between border-b border-emerald-500/20 bg-zinc-950/80 px-4 py-2 text-zinc-400">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#00ff88] neon-text-glow">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-zinc-400 hover:bg-emerald-500/10 hover:text-[#00ff88] transition-colors shrink-0 cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#00ff88]" />
              <span className="text-[#00ff88]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="w-full max-w-full overflow-x-auto p-4 leading-relaxed text-zinc-200">
        <code className="block w-full">{code}</code>
      </pre>
    </div>
  );
}
