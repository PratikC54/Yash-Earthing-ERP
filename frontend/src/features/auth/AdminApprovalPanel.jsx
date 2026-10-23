import { useState, useEffect } from 'react'
import {
  CheckCircle,
  ShieldCheck,
  RefreshCw,
  Mail,
  Building2,
  Calendar,
} from 'lucide-react'
import authService from './authService'
import { useAuth } from './useAuth'

export default function AdminApprovalPanel({ isOpen, onClose }) {
  const { user } = useAuth()
  const [pendingList, setPendingList] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    let active = true

    if (isOpen && user?.role === 'ADMIN') {
      const timer = setTimeout(async () => {
        setLoading(true)
        try {
          const res = await authService.getPendingUsers()
          if (active && res.success && res.data) {
            setPendingList(res.data)
          }
        } catch (err) {
          console.error('Failed to load pending users:', err)
        } finally {
          if (active) setLoading(false)
        }
      }, 50)

      return () => {
        active = false
        clearTimeout(timer)
      }
    }
  }, [isOpen, user])

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await authService.getPendingUsers()
      if (res.success && res.data) {
        setPendingList(res.data)
      }
    } catch (err) {
      console.error('Failed to load pending users:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || user?.role !== 'ADMIN') return null

  const handleApprove = async (id, name) => {
    setActionLoadingId(id)
    try {
      await authService.approveUser(id)
      setPendingList((prev) => prev.filter((u) => u.id !== id))
      setFeedback({ type: 'success', text: `Approved access for ${name}` })
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to approve user',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (id, name) => {
    setActionLoadingId(id)
    try {
      await authService.rejectUser(id)
      setPendingList((prev) => prev.filter((u) => u.id !== id))
      setFeedback({ type: 'info', text: `Rejected registration for ${name}` })
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reject user',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#141d30] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0f1728]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Pending Registrations</h2>
              <p className="text-xs text-slate-400">
                Review and approve new ERP user account requests
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={fetchPending}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-950/50 text-emerald-200 border border-emerald-500/30'
                : feedback.type === 'error'
                ? 'bg-red-950/50 text-red-200 border border-red-500/30'
                : 'bg-slate-800 text-slate-200 border border-slate-700'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white font-bold ml-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* List Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading && pendingList.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mb-2 text-blue-400" />
              <p className="text-xs">Loading pending accounts...</p>
            </div>
          ) : pendingList.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">All Caught Up!</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                No user registrations are currently pending admin review.
              </p>
            </div>
          ) : (
            pendingList.map((item) => (
              <div
                key={item.id}
                className="bg-[#0d1424] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-slate-700"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{item.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Pending
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-cyan-400" />
                      {item.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-indigo-400" />
                      {item.department} ({item.designation})
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={actionLoadingId === item.id}
                    onClick={() => handleReject(item.id, item.name)}
                    className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/20 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={actionLoadingId === item.id}
                    onClick={() => handleApprove(item.id, item.name)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0f1728] flex items-center justify-between text-xs text-slate-400">
          <span>{pendingList.length} request(s) awaiting action</span>
          <span className="text-[11px] text-slate-500">Administrator role active</span>
        </div>
      </div>
    </div>
  )
}
