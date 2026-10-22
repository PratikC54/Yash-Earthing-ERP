import { useState } from 'react'
import { useAuth } from './useAuth'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import ApprovalWaitingScreen from './ApprovalWaitingScreen'
import { Zap } from 'lucide-react'

export default function AuthGuard({ children }) {
  const { user, loading, pendingUser, isAuthenticated } = useAuth()
  const [authView, setAuthView] = useState('login') // 'login' | 'register'

  // Full-page initialization spinner
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0d1424] flex flex-col items-center justify-center text-slate-300">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="absolute -inset-2 rounded-2xl border-2 border-cyan-400/40 border-t-cyan-400 animate-spin" />
        </div>
        <div className="text-sm font-semibold text-white tracking-wide">
          Initializing Meridian ERP...
        </div>
        <div className="text-xs text-slate-500 mt-1">Checking secure session</div>
      </div>
    )
  }

  // 1. If user has submitted registration and is waiting for approval
  if (pendingUser) {
    return (
      <ApprovalWaitingScreen
        onApproved={() => {
          // Handled within ApprovalWaitingScreen which calls markApprovedAndLogin
        }}
        onBackToLogin={() => setAuthView('login')}
      />
    )
  }

  // 2. If authenticated and active
  if (isAuthenticated && user) {
    return children
  }

  // 3. Unauthenticated views
  if (authView === 'register') {
    return (
      <RegisterPage
        onNavigateToLogin={() => setAuthView('login')}
        onRegisteredWaitingApproval={() => {
          // pendingUser state will update automatically in context and show ApprovalWaitingScreen
        }}
      />
    )
  }

  return (
    <LoginPage
      onNavigateToRegister={() => setAuthView('register')}
      onLoginSuccess={() => {
        // Auth state in context updates and triggers re-render to children
      }}
      onPendingApproval={() => {
        // Will re-render to ApprovalWaitingScreen
      }}
    />
  )
}
