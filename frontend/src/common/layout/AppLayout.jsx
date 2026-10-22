import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import AddModuleModal from './AddModuleModal'
import { initialNavSections, currentUser as defaultUser } from '../../data/navigationModules'
import { useAuth, AdminApprovalPanel } from '../../features/auth'

// Module 1 Pages
import OverviewDashboard from '../../features/module1/pages/OverviewDashboard'
import LeadsPage from '../../features/module1/pages/LeadsPage'
import FollowupPage from '../../features/module1/pages/FollowupPage'
import CallingPage from '../../features/module1/pages/CallingPage'
import QuotationsPage from '../../features/module1/pages/QuotationsPage'
import OrdersPage from '../../features/module1/pages/OrdersPage'
import OperationsOverview from '../../features/dashboard/OperationsOverview'
import { ArrowRight, Box } from 'lucide-react'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const [sections, setSections] = useState(initialNavSections)
  const [activeModule, setActiveModule] = useState('Master Dashboard')
  const [activeModuleId, setActiveModuleId] = useState('overview')
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false)
  const [isAdminApprovalsOpen, setIsAdminApprovalsOpen] = useState(false)

  // Compute initials and profile info
  const effectiveUser = {
    name: user?.name || defaultUser.name,
    role: user?.role?.replace('_', ' ') || defaultUser.role,
    initials: user?.name
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : defaultUser.initials,
  }

  const isAdmin = user?.role === 'ADMIN'

  // Handle module selection from sidebar or internal link
  const handleSelectModule = (item) => {
    setActiveModule(item.name)
    setActiveModuleId(item.id)
  }

  const handleNavigate = (targetId) => {
    setActiveModuleId(targetId)
    // Find name
    for (const sec of sections) {
      const found = sec.items.find((it) => it.id === targetId)
      if (found) {
        setActiveModule(found.name)
        break
      }
    }
  }

  // Handle dynamic addition of a new module to the sidebar
  const handleAddModule = (sectionId, newModule) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            items: [...sec.items, newModule],
          }
        }
        return sec
      })
    )
    setActiveModule(newModule.name)
    setActiveModuleId(newModule.id)
  }

  // Render current active page
  const renderContent = () => {
    switch (activeModuleId) {
      case 'overview':
        return <OverviewDashboard onNavigate={handleNavigate} />
      case 'leads':
        return <LeadsPage onNavigate={handleNavigate} />
      case 'followups':
        return <FollowupPage onNavigate={handleNavigate} />
      case 'calling':
        return <CallingPage onNavigate={handleNavigate} />
      case 'quotations':
        return <QuotationsPage onNavigate={handleNavigate} />
      case 'orders':
        return <OrdersPage onNavigate={handleNavigate} />
      case 'dashboard':
        return <OperationsOverview subModuleTitle="Operations Overview" />
      default:
        // External module placeholder for other module teams
        return (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-[#101b33] border border-[#1e2f55] rounded-2xl p-8 text-center shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                <Box className="w-8 h-8" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                External Module Integration
              </span>
              <h2 className="text-xl font-bold text-white mt-4">{activeModule}</h2>
              <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
                This module is managed by another specialized module engineering team as per the Yash Group ERP architecture.
                Module 1 (Sales, CRM & Orders) is fully operational on this branch.
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleNavigate('overview')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  <span>Return to Module 1 Control Tower</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('leads')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
                >
                  View Live Leads
                </button>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-[#0a1224] font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Left Sidebar */}
      <Sidebar
        sections={sections}
        activeModuleId={activeModuleId}
        onSelectModule={handleSelectModule}
        onOpenAddModuleModal={() => setIsAddModuleModalOpen(true)}
        user={effectiveUser}
        onLogout={logout}
      />

      {/* Right Content Area: Navbar + Main Middle Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#070f20]">
        {/* Top Navbar */}
        <Navbar
          activeModule={activeModule}
          isAdmin={isAdmin}
          onOpenAdminApprovals={() => setIsAdminApprovalsOpen(true)}
        />

        {/* Main Workspace (Scrollable) */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Dynamic Module Addition Modal */}
      <AddModuleModal
        isOpen={isAddModuleModalOpen}
        onClose={() => setIsAddModuleModalOpen(false)}
        onAddModule={handleAddModule}
        sections={sections}
      />

      {/* Admin Approval Management Modal */}
      {isAdmin && (
        <AdminApprovalPanel
          isOpen={isAdminApprovalsOpen}
          onClose={() => setIsAdminApprovalsOpen(false)}
        />
      )}
    </div>
  )
}
