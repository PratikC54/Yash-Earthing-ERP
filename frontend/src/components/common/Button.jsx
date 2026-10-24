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
      "bg-[#d4ff00] hover:bg-[#c2ed00] text-black font-black shadow-xs focus:ring-lime-400/50 border border-lime-400",
    secondary:
      "bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 shadow-xs focus:ring-slate-300",
    outline:
      "bg-transparent hover:bg-slate-100 text-slate-700 font-bold border border-slate-300",
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-xs focus:ring-rose-500/50 border border-transparent",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent",
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
