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
    <div className="min-h-screen w-full bg-[#fafaf9] flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased text-slate-800">
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
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        <div className="mb-6">
          <h2 className="text-xl font-black text-[#0f172a]">Sign In to Workspace</h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Access Module 1 Sales, CRM & Order Control Tower
          </p>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs flex items-start space-x-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#d4ff00] focus:border-black transition shadow-xs font-semibold"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
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
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#d4ff00] focus:border-black transition shadow-xs font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 p-1 rounded-md transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#d4ff00] hover:bg-[#bbf400] text-black font-black text-xs border border-[#bef264] shadow-sm flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-2">
                <LogIn className="w-4 h-4 text-black" />
                <span>Sign In to Dashboard</span>
              </span>
            )}
          </button>
        </form>

        {/* Demo Fast-Fill helper pills */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-slate-700" />
            <span>Fast-Fill Test Roles</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoCredentials('admin@yashgroup.com', 'YashERP@2026')}
              className="px-2.5 py-2 bg-slate-50 hover:bg-[#f7fee7] hover:border-[#bef264] border border-slate-200 rounded-xl text-left transition group cursor-pointer shadow-xs"
            >
              <div className="text-xs font-black text-slate-900 group-hover:text-black">
                Admin
              </div>
              <div className="text-[9.5px] text-slate-500 font-medium truncate">
                admin@yashgroup.com
              </div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('pratik.senapati@yashgroup.com', 'YashERP@2026')}
              className="px-2.5 py-2 bg-slate-50 hover:bg-[#f7fee7] hover:border-[#bef264] border border-slate-200 rounded-xl text-left transition group cursor-pointer shadow-xs"
            >
              <div className="text-xs font-black text-slate-900 group-hover:text-black">
                Manager
              </div>
              <div className="text-[9.5px] text-slate-500 font-medium truncate">
                pratik.senapati@...
              </div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('rukhsar.shaikh@yashgroup.com', 'YashERP@2026')}
              className="px-2.5 py-2 bg-slate-50 hover:bg-[#f7fee7] hover:border-[#bef264] border border-slate-200 rounded-xl text-left transition group cursor-pointer shadow-xs"
            >
              <div className="text-xs font-black text-slate-900 group-hover:text-black">
                Back Officer
              </div>
              <div className="text-[9.5px] text-slate-500 font-medium truncate">
                rukhsar.shaikh@...
              </div>
            </button>
          </div>
        </div>

        {/* Registration navigation link */}
        <div className="mt-5 pt-4 text-center border-t border-slate-200">
          <p className="text-xs text-slate-600 font-medium">
            Don't have an enterprise account?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-slate-900 hover:text-black font-extrabold underline inline-flex items-center gap-1 transition ml-1 cursor-pointer"
            >
              <span>Register here</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </p>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-slate-500 font-medium">
        © 2026 Yash Earthing Solutions Pvt Ltd. Enterprise Cloud Edition.
      </div>
    </div>
  )
}
