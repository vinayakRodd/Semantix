import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "neon";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "neon", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variantStyles = {
      neon:
        "bg-zinc-950/90 text-[#00ff88] border border-emerald-500/50 font-bold hover:bg-emerald-500/10 hover:border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.2)] hover:shadow-[0_0_25px_rgba(0,255,136,0.35)]",
      default:
        "bg-zinc-950/90 text-[#00ff88] border border-emerald-500/50 font-bold hover:bg-emerald-500/10 hover:border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.2)] hover:shadow-[0_0_25px_rgba(0,255,136,0.35)]",
      secondary:
        "bg-zinc-950 text-emerald-300 hover:bg-zinc-900 border border-emerald-500/30 shadow-sm",
      outline:
        "border border-emerald-500/40 bg-zinc-950/80 text-emerald-400 hover:bg-emerald-500/10 hover:border-[#00ff88] hover:text-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.15)]",
      ghost:
        "text-zinc-400 hover:bg-emerald-500/10 hover:text-[#00ff88]",
      destructive:
        "bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900 shadow-sm",
    };

    const sizeStyles = {
      default: "h-11 px-5 py-2",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-12 rounded-xl px-6 text-base font-bold",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
