import { useState } from 'react'
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  Briefcase,
  Eye,
  EyeOff,
  UserPlus,
  Zap,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react'
import { useAuth } from './useAuth'

const DEPARTMENTS = [
  'Sales',
  'Production',
  'Engineering',
  'Quality & Metrology',
  'Operations',
  'Procurement',
  'HRMS',
  'Finance & Accounts',
]

export default function RegisterPage({ onNavigateToLogin, onRegisteredWaitingApproval }) {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    department: 'Sales',
    designation: 'Sales Consultant',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!formData.name || !formData.email || !formData.password) {
      setErrorMessage('Please fill in all mandatory fields (*)')
      return
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      const res = await register(formData)
      // Transition immediately to the Waiting for Admin Approval loader screen
      if (onRegisteredWaitingApproval) {
        onRegisteredWaitingApproval(res.data)
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please check your data and try again.'
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0d1424] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/4 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-lg bg-[#141d30]/95 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 my-8">
        
        {/* Brand header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg tracking-tight">Meridian ERP</div>
              <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                Account Registration
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Security Approval notice banner */}
        <div className="mt-6 mb-6 p-3.5 rounded-xl bg-blue-950/40 border border-blue-600/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-white block mb-0.5">
              Admin Approval Required
            </span>
            New staff accounts undergo mandatory administrator verification. Once you submit, you will be placed on the real-time approval monitor screen until approved.
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-red-950/50 border border-red-500/40 flex items-start gap-2.5 text-red-200 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ramesh Patil"
                className="w-full bg-[#0d1424] text-slate-100 placeholder-slate-500 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Corporate Email <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="ramesh.patil@yashgroup.com"
                className="w-full bg-[#0d1424] text-slate-100 placeholder-slate-500 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Create Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full bg-[#0d1424] text-slate-100 placeholder-slate-500 text-sm pl-9 pr-10 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner"
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

          {/* Department & Designation in 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Department
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full bg-[#0d1424] text-slate-100 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner appearance-none cursor-pointer"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} className="bg-[#141d30] text-slate-100">
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Designation / Job Role
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g. Sales Consultant"
                  className="w-full bg-[#0d1424] text-slate-100 placeholder-slate-500 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Mobile Contact (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full bg-[#0d1424] text-slate-100 placeholder-slate-500 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-blue-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Submit Registration for Approval</span>
              </>
            )}
          </button>
        </form>

        {/* Back to login option */}
        <div className="mt-6 pt-4 text-center border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Already have an active corporate account?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition ml-1 cursor-pointer"
            >
              Sign In here
            </button>
          </p>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-slate-500">
        © 2026 Yash Earthing Solutions Pvt Ltd. Enterprise Cloud Edition.
      </div>
    </div>
  )
}
