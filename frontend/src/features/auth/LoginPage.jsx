import { useState } from 'react'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  Zap,
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
  const [rememberMe, setRememberMe] = useState(true)
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
    <div className="min-h-screen w-full bg-[#0d1424] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-[#141d30]/95 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10">
        
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3.5">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Meridian ERP</h1>
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mt-1">
            Yash Earthing Cloud Portal
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Enter your credentials to access your ERP dashboard
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-red-950/50 border border-red-500/40 flex items-start gap-2.5 text-red-200 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Corporate Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@yashgroup.com"
                className="w-full bg-[#0d1424] text-slate-100 placeholder-slate-500 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0d1424] text-slate-100 placeholder-slate-500 text-sm pl-9 pr-10 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Helper */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 bg-[#0d1424] text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>Remember session</span>
            </label>
            <span className="text-slate-500 hover:text-slate-400 cursor-default">
              Encrypted SSL v3
            </span>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-blue-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to ERP</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast-Fill helper pills */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fast-Fill Test Credentials</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoCredentials('admin@yashgroup.com', 'YashERP@2026')}
              className="px-2.5 py-1.5 bg-[#0d1424] hover:bg-slate-800/80 border border-slate-700/80 rounded-lg text-left transition group cursor-pointer"
            >
              <div className="text-xs font-semibold text-white group-hover:text-cyan-300">
                System Admin
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                admin@yashgroup.com
              </div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('pratik.senapati@yashgroup.com', 'YashERP@2026')}
              className="px-2.5 py-1.5 bg-[#0d1424] hover:bg-slate-800/80 border border-slate-700/80 rounded-lg text-left transition group cursor-pointer"
            >
              <div className="text-xs font-semibold text-white group-hover:text-cyan-300">
                Sales Manager
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                pratik.senapati@yashgroup.com
              </div>
            </button>
          </div>
        </div>

        {/* Registration navigation link */}
        <div className="mt-6 pt-4 text-center border-t border-slate-800/80">
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
