import { useState } from 'react'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  KeyRound,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from './useAuth'

export default function LoginPage({ onNavigateToRegister, onLoginSuccess, onPendingApproval }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email || !password) {
      setErrorMessage('Please provide both email and password')
      return
    }

    setLoading(true)
    try {
      const res = await login(email, password)
      if (res.isPending) {
        if (onPendingApproval) {
          onPendingApproval(res.data)
        }
      } else {
        if (onLoginSuccess) {
          onLoginSuccess(res.data)
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to authenticate. Please check your credentials.'
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setErrorMessage('')
  }

  return (
    <div className="min-h-screen w-full bg-[#070e1e] flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased text-slate-200">
      {/* Top Branding matching Yash Group ERP Enterprise V3 */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-xl shadow-blue-500/25 font-black text-white text-lg tracking-wider">
          YG
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight leading-snug">
            Yash Group ERP
          </h1>
          <p className="text-xs text-cyan-400 font-medium tracking-wide">
            V3 · Enterprise Commercial Control
          </p>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0e172e] border border-[#1b2a4e] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">Sign In to Workspace</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access Module 1 Sales, CRM & Order Control Tower
          </p>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start space-x-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Corporate Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@yashgroup.com"
                className="w-full bg-[#081022] text-slate-100 placeholder-slate-500 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#081022] text-slate-100 placeholder-slate-500 text-xs pl-10 pr-11 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-md transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-2">
                <LogIn className="w-4 h-4" />
                <span>Sign In to Dashboard</span>
              </span>
            )}
          </button>
        </form>

        {/* Demo Fast-Fill helper pills */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fast-Fill Test Roles</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoCredentials('admin@yashgroup.com', 'YashERP@2026')}
              className="px-2 py-1.5 bg-[#081022] hover:bg-slate-800/80 border border-slate-700/80 rounded-xl text-left transition group cursor-pointer"
            >
              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                Admin
              </div>
              <div className="text-[9px] text-slate-400 truncate">
                admin@yashgroup.com
              </div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('pratik.senapati@yashgroup.com', 'YashERP@2026')}
              className="px-2 py-1.5 bg-[#081022] hover:bg-slate-800/80 border border-slate-700/80 rounded-xl text-left transition group cursor-pointer"
            >
              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                Manager
              </div>
              <div className="text-[9px] text-slate-400 truncate">
                pratik.senapati@...
              </div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('rukhsar.shaikh@yashgroup.com', 'YashERP@2026')}
              className="px-2 py-1.5 bg-[#081022] hover:bg-slate-800/80 border border-slate-700/80 rounded-xl text-left transition group cursor-pointer"
            >
              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                Back Officer
              </div>
              <div className="text-[9px] text-slate-400 truncate">
                rukhsar.shaikh@...
              </div>
            </button>
          </div>
        </div>

        {/* Registration navigation link */}
        <div className="mt-5 pt-4 text-center border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Don't have an enterprise account?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 transition ml-1 cursor-pointer"
            >
              <span>Register here</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </p>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-slate-500">
        © 2026 Yash Earthing Solutions Pvt Ltd. Enterprise Cloud Edition.
      </div>
    </div>
  )
}
