import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Reusable Button Component with Reference Navy Theme
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon: Icon,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-bold transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#070e1e] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98 select-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs sm:text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-[#3b82f6] hover:bg-blue-600 text-white shadow-sm focus:ring-[#3b82f6]/50 border border-transparent",
    secondary:
      "bg-[#10182f] hover:bg-slate-800/40 text-[#f1f5f9] border border-[#1e2a4a] shadow-xs focus:ring-[#3b82f6]/30",
    outline:
      "bg-transparent hover:bg-[#10182f] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#1e2a4a]",
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-xs focus:ring-rose-500/50 border border-transparent",
    ghost:
      "bg-transparent hover:bg-slate-800/40 text-[#94a3b8] hover:text-[#f1f5f9] border border-transparent",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
