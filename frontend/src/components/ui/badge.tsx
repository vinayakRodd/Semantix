import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "neon";
}

export function Badge({
  className,
  variant = "neon",
  ...props
}: BadgeProps) {
  const variantStyles = {
    neon: "bg-emerald-500/15 text-[#00ff88] border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,136,0.15)]",
    default: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    secondary: "bg-zinc-900 text-zinc-300 border-zinc-800",
    outline: "border-emerald-500/30 text-emerald-400 bg-transparent",
    success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
