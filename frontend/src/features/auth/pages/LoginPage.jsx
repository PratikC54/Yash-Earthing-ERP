import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, KeyRound } from "lucide-react";
import authService from "../../../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("admin@yashgroup.com");
  const [password, setPassword] = useState("YashERP@2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate("/pq/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.login(email.trim(), password);
      const from = location.state?.from?.pathname ? `${location.state.from.pathname}${location.state.from.search || ""}` : (typeof location.state?.from === "string" ? location.state.from : "/pq/dashboard");
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@yashgroup.com");
    setPassword("YashERP@2026");
    setError("");
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#070e1e] p-4 font-sans text-[#f1f5f9] select-none">
      <div className="w-full max-w-md bg-[#0b172d] border border-[#1e2a4a] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-sky-400 p-[2px] shadow-lg shadow-blue-950/60">
            <div className="w-full h-full bg-[#0b172d] rounded-[14px] flex items-center justify-center">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 text-2xl">
                YG
              </span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Yash Group ERP</h1>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2DD4BF] bg-[#2DD4BF]/10 px-2 py-0.5 rounded border border-[#2DD4BF]/20">
                V3 — ENTERPRISE CONTROL
              </span>
            </div>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Sign in to access Production, Quality & Dispatch modules
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#94a3b8] font-semibold mb-1.5">
              Authorized Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@yashgroup.com"
                className="w-full bg-[#070e1e] border border-[#1e2a4a] rounded-xl px-3.5 py-2.5 pl-9 text-xs text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#3b82f6] transition"
              />
              <Mail className="w-4 h-4 text-[#475569] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[#94a3b8] font-semibold mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#070e1e] border border-[#1e2a4a] rounded-xl px-3.5 py-2.5 pl-9 text-xs text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#3b82f6] transition font-mono"
              />
              <Lock className="w-4 h-4 text-[#475569] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-900/40 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                <span>Sign In to ERP Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick-Fill Helper */}
        <div className="pt-4 border-t border-[#1e2a4a]/80 text-center space-y-2">
          <div className="text-[11px] text-[#64748b]">
            Development Authorized Credentials
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10182f] border border-[#1e2a4a] text-[11px] text-[#2DD4BF] hover:bg-[#1e2a4a]/50 transition cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>admin@yashgroup.com · YashERP@2026</span>
          </button>
        </div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-[#64748b]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Role-Based Access Control Active</span>
        </div>
      </div>
    </div>
  );
}
