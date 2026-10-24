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
    <div className="min-h-screen w-full bg-[#fafaf9] text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Main Container */}
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 relative z-10 my-8">
        {/* Brand header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-black text-[#d4ff00] ring-2 ring-[#d4ff00] flex items-center justify-center shadow-md font-black text-xl tracking-wider shrink-0">
              YG
            </div>
            <div>
              <div className="text-[#0f172a] font-black text-xl tracking-tight leading-snug">
                Yash Group ERP
              </div>
              <div className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                Account Verification
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Verification Active
          </span>
        </div>

        {/* Dynamic Center Loader View */}
        <div className="py-8 flex flex-col items-center text-center">
          {approvalState === 'APPROVED' ? (
            /* Success State */
            <div className="flex flex-col items-center animate-in zoom-in-90 duration-300">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center ring-8 ring-emerald-100">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-bounce" />
                </div>
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
              </div>
              <h2 className="text-2xl font-black text-[#0f172a] mb-2">Account Approved!</h2>
              <p className="text-sm text-emerald-800 font-bold max-w-sm mb-4">
                Access granted by system administrator. Redirecting you to your ERP workspace...
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-300">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span className="font-semibold">Launching session...</span>
              </div>
            </div>
          ) : approvalState === 'REJECTED' ? (
            /* Rejected State */
            <div className="flex flex-col items-center animate-in fade-in duration-300">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center ring-8 ring-red-100 mb-5">
                <ShieldAlert className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-xl font-black text-[#0f172a] mb-2">Registration Denied</h2>
              <p className="text-sm text-slate-600 font-medium max-w-sm mb-5">
                Your request for ERP system access was declined by the administrator. Please contact your company's IT desk.
              </p>
              <button
                type="button"
                onClick={handleBackToLogin}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            /* Active Waiting / Loader Screen */
            <div className="flex flex-col items-center w-full">
              {/* Radar pulse multi-layer loader */}
              <div className="relative mb-6">
                <div className="absolute -inset-4 rounded-full bg-lime-400/20 animate-ping opacity-75" />
                <div className="absolute -inset-8 rounded-full border border-lime-500/30 animate-pulse" />
                
                {/* Main animated glowing spinner container */}
                <div className="w-20 h-20 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center relative shadow-md">
                  <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#84cc16] animate-spin" />
                  <Clock className="w-8 h-8 text-slate-800 animate-pulse" />
                </div>
              </div>

              {/* Title & Status */}
              <h2 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-2">
                Waiting for Admin Approval
              </h2>
              <p className="text-sm text-slate-600 font-medium max-w-sm mb-6 leading-relaxed">
                {statusMessage}
              </p>

              {/* Realtime Polling Badge */}
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-300 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
                </span>
                <span className="font-semibold">Auto-checking approval status ({checkCount} checks)</span>
              </div>

              {/* Registration summary card */}
              <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2.5 mb-6">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Submitted Profile Details
                </div>
                
                <div className="flex items-center text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-slate-600 mr-2.5 shrink-0" />
                  <span className="text-slate-500 font-semibold mr-2">Full Name:</span>
                  <span className="font-bold text-slate-900 truncate">
                    {pendingUser?.name || 'Applicant'}
                  </span>
                </div>

                <div className="flex items-center text-xs">
                  <Mail className="w-3.5 h-3.5 text-slate-600 mr-2.5 shrink-0" />
                  <span className="text-slate-500 font-semibold mr-2">Email:</span>
                  <span className="font-mono text-slate-900 font-bold truncate">
                    {pendingUser?.email || emailToPoll || 'user@yashgroup.com'}
                  </span>
                </div>

                <div className="flex items-center text-xs">
                  <Building2 className="w-3.5 h-3.5 text-slate-600 mr-2.5 shrink-0" />
                  <span className="text-slate-500 font-semibold mr-2">Department:</span>
                  <span className="text-slate-900 font-bold">
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#d4ff00] hover:bg-[#bbf400] disabled:opacity-50 text-black rounded-xl text-xs font-black tracking-wide border border-[#bef264] transition shadow-md shadow-lime-900/10 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Checking...' : 'Check Status Now'}</span>
                </button>

                {/* Back to Login */}
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">Sign In</span>
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="text-center pt-2 text-[11px] text-slate-500 font-medium">
          Protected by Yash Earthing Enterprise Multi-Factor & Role Control
        </div>
      </div>
    </div>
  )
}
