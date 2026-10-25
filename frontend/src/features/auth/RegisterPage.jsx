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
  ChevronDown,
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
  'Management',
]

const DESIGNATION_ROLES = [
  // Sales
  { title: 'Sales Consultant', role: 'SALES_CONSULTANT', department: 'Sales' },
  { title: 'Sales Manager', role: 'SALES_MANAGER', department: 'Sales' },
  { title: 'Back Office Executive', role: 'BACK_OFFICER', department: 'Sales' },

  // Production
  { title: 'Production Manager', role: 'PRODUCTION_MANAGER', department: 'Production' },
  { title: 'Shop Floor Supervisor', role: 'PRODUCTION_MANAGER', department: 'Production' },
  { title: 'Machine Operator', role: 'PRODUCTION_MANAGER', department: 'Production' },

  // Engineering
  { title: 'Design & Project Engineer', role: 'ENGINEER', department: 'Engineering' },
  { title: 'Field Service Executive', role: 'SERVICE_EXECUTIVE', department: 'Engineering' },

  // Quality & Metrology
  { title: 'Quality Control Inspector', role: 'QUALITY_INSPECTOR', department: 'Quality & Metrology' },
  { title: 'QA / QC Manager', role: 'QUALITY_INSPECTOR', department: 'Quality & Metrology' },

  // Operations
  { title: 'Turnkey Project Manager', role: 'PROJECT_MANAGER', department: 'Operations' },
  { title: 'Dispatch & Logistics Officer', role: 'DISPATCH_OFFICER', department: 'Operations' },
  { title: 'Factory Inward / Store Officer', role: 'FACTORY_INWARD_OFFICER', department: 'Operations' },

  // Procurement
  { title: 'Procurement / Purchase Officer', role: 'PROCUREMENT_OFFICER', department: 'Procurement' },
  { title: 'Purchase Head', role: 'PROCUREMENT_OFFICER', department: 'Procurement' },

  // HRMS
  { title: 'HR & Payroll Manager', role: 'HR_MANAGER', department: 'HRMS' },

  // Finance & Accounts
  { title: 'Finance & Accounts Manager', role: 'FINANCE_MANAGER', department: 'Finance & Accounts' },
  { title: 'Bank & Treasury Executive', role: 'BANK_OFFICE_EXECUTIVE', department: 'Finance & Accounts' },

  // Management / Admin
  { title: 'System Administrator', role: 'ADMIN', department: 'Management' },
]

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
]

export default function RegisterPage({ onNavigateToLogin, onRegisteredWaitingApproval }) {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Sales',
    designation: 'Sales Consultant',
    role: 'SALES_CONSULTANT',
  })
  const [countryCode, setCountryCode] = useState('+91')
  const [mobileNumber, setMobileNumber] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDepartmentChange = (e) => {
    const newDept = e.target.value
    const defaultRole = DESIGNATION_ROLES.find((r) => r.department === newDept)
    setFormData((prev) => ({
      ...prev,
      department: newDept,
      designation: defaultRole ? defaultRole.title : prev.designation,
      role: defaultRole ? defaultRole.role : prev.role,
    }))
  }

  const handleDesignationChange = (e) => {
    const selectedTitle = e.target.value
    const found = DESIGNATION_ROLES.find((r) => r.title === selectedTitle)
    setFormData((prev) => ({
      ...prev,
      designation: selectedTitle,
      department: found ? found.department : prev.department,
      role: found ? found.role : prev.role,
    }))
  }

  const handlePhoneChange = (e) => {
    // Strictly numeric only, maximum 10 digits
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
    setMobileNumber(digitsOnly)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setErrorMessage('Please fill in all mandatory fields (*)')
      return
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long')
      return
    }

    // Optional phone validation: if user enters numbers, it must be exactly 10 digits
    if (mobileNumber && mobileNumber.length !== 10) {
      setErrorMessage('Mobile contact number must be exactly 10 digits')
      return
    }

    setLoading(true)
    try {
      const fullPhone = mobileNumber ? `${countryCode} ${mobileNumber}` : ''
      const payload = {
        ...formData,
        phone: fullPhone,
      }

      const res = await register(payload)
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

  const currentRoleConfig = DESIGNATION_ROLES.find((r) => r.title === formData.designation)

  return (
    <div className="min-h-screen w-full bg-[#fafaf9] text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Main card */}
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 relative z-10 my-8">
        
        {/* Brand header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-black text-[#d4ff00] ring-2 ring-[#d4ff00] flex items-center justify-center shadow-md font-black text-xl tracking-wider shrink-0">
              YG
            </div>
            <div>
              <div className="text-[#0f172a] font-black text-xl tracking-tight leading-snug">Yash Group ERP</div>
              <div className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                Staff Account Registration
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-black transition cursor-pointer px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Security Approval notice banner */}
        <div className="mt-6 mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-extrabold text-slate-900 block mb-0.5">
              Admin Approval Required
            </span>
            New staff accounts undergo mandatory administrator verification. Select your exact job designation for automated role-based permission provisioning.
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-300 flex items-start gap-2.5 text-red-700 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-semibold">{errorMessage}</div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
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
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#d4ff00] focus:border-black transition shadow-xs font-medium"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Corporate Email <span className="text-red-500">*</span>
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
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#d4ff00] focus:border-black transition shadow-xs font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Create Password <span className="text-red-500">*</span>
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
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-sm pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#d4ff00] focus:border-black transition shadow-xs font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition p-1 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Department & Designation in 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Department <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleDepartmentChange}
                  className="w-full bg-white text-slate-900 text-sm pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#d4ff00] focus:border-black transition shadow-xs appearance-none cursor-pointer font-medium"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} className="bg-white text-slate-900">
                      {dept}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Designation / Job Role <span className="text-red-500">*</span>
                </label>
                {currentRoleConfig && (
                  <span className="text-[10px] font-mono font-bold bg-[#f7fee7] text-[#365314] border border-[#bef264] px-1.5 py-0.5 rounded">
                    {currentRoleConfig.role}
                  </span>
                )}
              </div>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleDesignationChange}
                  className="w-full bg-white text-slate-900 text-sm pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#d4ff00] focus:border-black transition shadow-xs appearance-none cursor-pointer font-medium"
                >
                  {DEPARTMENTS.map((dept) => {
                    const rolesInDept = DESIGNATION_ROLES.filter((r) => r.department === dept)
                    if (rolesInDept.length === 0) return null
                    return (
                      <optgroup key={dept} label={`── ${dept} ──`} className="font-bold text-slate-700 bg-slate-50">
                        {rolesInDept.map((r) => (
                          <option key={r.title} value={r.title} className="bg-white text-slate-900 font-medium py-1">
                            {r.title} ({r.role})
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mobile Contact (Optional) with Country Code and 10 Digits */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Mobile Contact <span className="text-slate-400 font-medium">(Optional)</span>
              </label>
              <div className="text-[11px] font-semibold">
                {mobileNumber.length > 0 ? (
                  <span className={mobileNumber.length === 10 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {mobileNumber.length}/10 digits
                  </span>
                ) : (
                  <span className="text-slate-400">10 digits</span>
                )}
              </div>
            </div>

            <div className="flex rounded-xl border border-slate-300 focus-within:ring-2 focus-within:ring-[#d4ff00] focus-within:border-black transition shadow-xs bg-white overflow-hidden">
              {/* Country Code Dropdown */}
              <div className="relative border-r border-slate-300 bg-slate-50 shrink-0 flex items-center">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-full bg-transparent text-slate-800 text-xs font-bold pl-3 pr-7 py-2.5 appearance-none focus:outline-none cursor-pointer"
                  aria-label="Country Dial Code"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-white text-slate-900 font-medium">
                      {c.flag} {c.code} ({c.country})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
              </div>

              {/* 10-Digit Mobile Input */}
              <div className="relative flex-1 flex items-center">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={handlePhoneChange}
                  placeholder="98765 43210"
                  className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm pl-9 pr-3 py-2.5 focus:outline-none font-medium tracking-wide"
                />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Only numbers accepted (maximum 10 digits). Select your country code (e.g. +91 India, +1 US).
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 px-4 bg-[#d4ff00] hover:bg-[#bbf400] text-black font-black rounded-xl text-sm border border-[#bef264] shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-black" />
                <span>Submit Registration for Approval</span>
              </>
            )}
          </button>
        </form>

        {/* Back to login option */}
        <div className="mt-6 pt-4 text-center border-t border-slate-200">
          <p className="text-xs text-slate-600 font-medium">
            Already have an active corporate account?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-slate-900 hover:text-black font-extrabold underline inline-flex items-center gap-1 transition ml-1 cursor-pointer"
            >
              Sign In here
            </button>
          </p>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-slate-500 font-medium">
        © 2026 Yash Earthing Solutions Pvt Ltd. Enterprise Cloud Edition.
      </div>
    </div>
  )
}
