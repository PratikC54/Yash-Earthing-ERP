import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Sparkles,
  UserCheck,
  Building2,
  Mail,
  Zap,
} from 'lucide-react'
import { useAuth } from './useAuth'
import authService from './authService'

export default function ApprovalWaitingScreen({ onApproved, onBackToLogin }) {
  const { pendingUser, clearPendingUser, markApprovedAndLogin } = useAuth()
  const [isChecking, setIsChecking] = useState(false)
  const [checkCount, setCheckCount] = useState(0)
  const [approvalState, setApprovalState] = useState('PENDING') // 'PENDING' | 'APPROVED' | 'REJECTED'
  const [statusMessage, setStatusMessage] = useState(
    'Registration submitted. Waiting for system administrator verification.'
  )
  const [isSimulating, setIsSimulating] = useState(false)
  const pollTimerRef = useRef(null)

  const emailToPoll = pendingUser?.email || ''

  // Function to query status
  const performCheck = useCallback(
    async (isManual = false) => {
      if (!emailToPoll) return

      if (isManual) setIsChecking(true)

      try {
        const res = await authService.checkStatus(emailToPoll)
        setCheckCount((prev) => prev + 1)

        if (res.success && res.data) {
          const { approvalStatus, token, role, name, email } = res.data

          if (approvalStatus === 'APPROVED') {
            setApprovalState('APPROVED')
            setStatusMessage('Congratulations! Your account has been approved.')

            // Stop further polling
            if (pollTimerRef.current) clearInterval(pollTimerRef.current)

            // Transition after a brief celebratory delay
            setTimeout(() => {
              markApprovedAndLogin(token, {
                name: name || pendingUser?.name,
                email: email || pendingUser?.email,
                role: role || 'SALES_CONSULTANT',
                department: pendingUser?.department || 'Sales',
              })
              if (onApproved) onApproved()
            }, 1800)
          } else if (approvalStatus === 'REJECTED') {
            setApprovalState('REJECTED')
            setStatusMessage('Your registration request was rejected by the administrator.')
            if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          }
        }
      } catch (err) {
        console.error('Status check error:', err)
      } finally {
        if (isManual) {
          setTimeout(() => setIsChecking(false), 500)
        }
      }
    },
    [emailToPoll, pendingUser, markApprovedAndLogin, onApproved]
  )

  // Polling loop
  useEffect(() => {
    // Initial check deferred asynchronously
    const initialTimer = setTimeout(() => {
      performCheck()
    }, 100)

    // Regular interval polling every 10 seconds
    pollTimerRef.current = setInterval(() => {
      performCheck()
    }, 10000)

    return () => {
      clearTimeout(initialTimer)
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [performCheck])

  // Instant demo approval trigger
  const handleQuickApproveDemo = async () => {
    if (!emailToPoll) return
    setIsSimulating(true)
    try {
      await authService.devQuickApprove(emailToPoll)
      await performCheck(true)
    } catch (err) {
      console.error('Quick approve demo failed:', err)
    } finally {
      setIsSimulating(false)
    }
  }

  const handleBackToLogin = () => {
    clearPendingUser()
    if (onBackToLogin) {
      onBackToLogin()
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0d1424] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg bg-[#141d30]/90 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10">
        
        {/* Brand header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg tracking-tight">Meridian ERP</div>
              <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                Yash Earthing Cloud
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Verification Active
          </span>
        </div>

        {/* Dynamic Center Loader View */}
        <div className="py-8 flex flex-col items-center text-center">
          {approvalState === 'APPROVED' ? (
            /* Success State */
            <div className="flex flex-col items-center animate-in zoom-in-90 duration-300">
              <div className="relative mb-5">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center ring-8 ring-emerald-500/10">
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
                </div>
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Account Approved!</h2>
              <p className="text-sm text-emerald-400/90 font-medium max-w-sm mb-4">
                Access granted by system administrator. Redirecting you to your ERP workspace...
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Launching session...</span>
              </div>
            </div>
          ) : approvalState === 'REJECTED' ? (
            /* Rejected State */
            <div className="flex flex-col items-center animate-in fade-in duration-300">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center ring-8 ring-red-500/10 mb-5">
                <ShieldAlert className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Registration Denied</h2>
              <p className="text-sm text-slate-300 max-w-sm mb-5">
                Your request for ERP system access was declined by the administrator. Please contact your company's IT desk.
              </p>
              <button
                type="button"
                onClick={handleBackToLogin}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            /* Active Waiting / Loader Screen */
            <div className="flex flex-col items-center">
              {/* Radar pulse multi-layer loader */}
              <div className="relative mb-6">
                {/* Outer pulsing ring 1 */}
                <div className="absolute -inset-4 rounded-full bg-blue-500/10 animate-ping opacity-75" />
                {/* Outer pulsing ring 2 */}
                <div className="absolute -inset-8 rounded-full border border-blue-500/20 animate-pulse" />
                
                {/* Main animated glowing spinner container */}
                <div className="w-24 h-24 rounded-full bg-[#0d1424] border-2 border-slate-700 flex items-center justify-center relative shadow-inner">
                  {/* Rotating border spinner */}
                  <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin" />
                  
                  {/* Center Clock Icon */}
                  <Clock className="w-10 h-10 text-cyan-400 animate-pulse" />
                </div>
              </div>

              {/* Title & Status */}
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Waiting for Admin Approval
              </h2>
              <p className="text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
                {statusMessage}
              </p>

              {/* Realtime Polling Badge */}
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-700/70 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span>Auto-checking approval status ({checkCount} checks)</span>
              </div>

              {/* Registration summary card */}
              <div className="w-full bg-[#0d1424]/80 rounded-xl p-4 border border-slate-800 text-left space-y-2.5 mb-6 shadow-inner">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Submitted Profile Details
                </div>
                
                <div className="flex items-center text-xs text-slate-200">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400 mr-2.5 shrink-0" />
                  <span className="text-slate-400 mr-2">Full Name:</span>
                  <span className="font-semibold text-white truncate">
                    {pendingUser?.name || 'Applicant'}
                  </span>
                </div>

                <div className="flex items-center text-xs text-slate-200">
                  <Mail className="w-3.5 h-3.5 text-cyan-400 mr-2.5 shrink-0" />
                  <span className="text-slate-400 mr-2">Email:</span>
                  <span className="font-mono text-slate-200 truncate">
                    {pendingUser?.email || emailToPoll || 'user@yashgroup.com'}
                  </span>
                </div>

                <div className="flex items-center text-xs text-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400 mr-2.5 shrink-0" />
                  <span className="text-slate-400 mr-2">Department:</span>
                  <span className="text-slate-200">
                    {pendingUser?.department || 'Sales'} ({pendingUser?.designation || 'Sales Consultant'})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col sm:flex-row items-center gap-3">
                {/* Manual Check Button */}
                <button
                  type="button"
                  onClick={() => performCheck(true)}
                  disabled={isChecking}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold tracking-wide transition shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Checking...' : 'Check Status Now'}</span>
                </button>

                {/* Back to Login */}
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">Sign In</span>
                </button>
              </div>

              </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="text-center pt-2 text-[11px] text-slate-500">
          Protected by Yash Earthing Enterprise Multi-Factor & Role Control
        </div>
      </div>
    </div>
  )
}
