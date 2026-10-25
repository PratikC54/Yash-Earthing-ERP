import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import authService from "../../../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Automatically redirect if already logged in with valid token
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate("/pq/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate login requests on rapid clicks
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.login(email.trim(), password);
      const from = location.state?.from?.pathname
        ? `${location.state.from.pathname}${location.state.from.search || ""}`
        : typeof location.state?.from === "string"
        ? location.state.from
        : "/pq/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      if (
        status === 502 ||
        status === 503 ||
        status === 504 ||
        err?.code === "ERR_NETWORK" ||
        err?.code === "ECONNREFUSED"
      ) {
        setError(
          "Unable to connect to the backend server (502 Bad Gateway). Please ensure the backend API server is running on port 5000."
        );
      } else if (status === 401 || status === 400) {
        setError(
          err?.response?.data?.message ||
          "Invalid email or password. Please verify your credentials."
        );
      } else if (status === 403) {
        setError(
          err?.response?.data?.message ||
          "Account access is restricted or awaiting administrator approval."
        );
      } else {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          "An unexpected error occurred during login. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@yashgroup.com");
    setPassword("YashERP@2026");
    setError("");
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fafaf9] p-4 sm:p-6 font-sans text-slate-800 select-none antialiased">
      {/* Top Branding matching Yash Group ERP Enterprise V3 */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-black text-[#d4ff00] ring-2 ring-[#d4ff00] flex items-center justify-center shadow-md font-black text-xl tracking-wider shrink-0">
          YG
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] tracking-tight leading-snug">
            Yash Group ERP
          </h1>
          <p className="text-xs text-slate-600 font-extrabold tracking-wider uppercase">
            V3 · Enterprise Commercial Control
          </p>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-[#0f172a]">Sign In to Workspace</h2>
          <p className="text-xs text-slate-600 font-medium">
            Sign in to access Production, Quality & Dispatch modules
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Official Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@yashgroup.com"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 transition text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 transition text-xs font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#d4ff00] hover:bg-[#bbf400] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-[#bef264] shadow-md shadow-lime-900/10 cursor-pointer transition disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to System</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Autofill */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Autofill Admin Demo Credentials</span>
          </button>
          <p className="text-[10px] text-center text-slate-400 font-medium">
            Production & Quality Operations Control System
          </p>
        </div>
      </div>

      {/* ISO Compliance Footer */}
      <div className="mt-8 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>ISO 9001:2015 Compliant · Yash Earthing Solutions Pvt Ltd</span>
      </div>
    </div>
  );
}
