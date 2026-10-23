import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { initialNavSections, currentUser as defaultUser } from '../../data/navigationModules'
import { useAuth, AdminApprovalPanel } from '../../features/auth'

// Module 3 & Module 6 pages
import EngineeringDashboard from '../../features/engineering/EngineeringDashboard'
import FinanceDashboard from '../../features/finance/FinanceDashboard'

// Module 1 Pages & Modals
import OverviewDashboard from '../../features/module1/pages/OverviewDashboard'
import LeadsPage from '../../features/module1/pages/LeadsPage'
import FollowupPage from '../../features/module1/pages/FollowupPage'
import QuotationsPage from '../../features/module1/pages/QuotationsPage'
import OrdersPage from '../../features/module1/pages/OrdersPage'
import CreateLeadModal from '../../features/module1/components/CreateLeadModal'
import TraceJobModal from '../../features/module1/components/TraceJobModal'
import module1Service from '../../features/module1/services/module1Service'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const isSuperUser = isAdmin || user?.hasFullAccess === true
  const [sections] = useState(initialNavSections)

  // Default active module according to role:
  // Admin / Full Access gets Master Dashboard (overview); others default to their authorized workflow page
  const defaultPageId = isSuperUser
    ? 'overview'
    : user?.role === 'BACK_OFFICER'
    ? 'quotations'
    : user?.role === 'SALES_MANAGER'
    ? 'orders'
    : 'leads'

  const [activeModuleId, setActiveModuleId] = useState(defaultPageId)
  const [activeModule, setActiveModule] = useState(
    isSuperUser
      ? 'Master Dashboard'
      : user?.role === 'BACK_OFFICER'
      ? 'Quotations & Estimates'
      : user?.role === 'SALES_MANAGER'
      ? 'Orders & Dispatch Ready'
      : 'Leads & Enquiries'
  )
  const [isAdminApprovalsOpen, setIsAdminApprovalsOpen] = useState(false)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [isTraceOpen, setIsTraceOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

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

  // Filter navigation sections based on RBAC:
  // Non-admins do NOT see 'Control Tower' (Master Dashboard)
  const visibleSections = sections
    .map((sec) => {
      if (sec.id === 'control-tower' && !isSuperUser) {
        return null
      }
      return sec
    })
    .filter(Boolean)

  // Handle module selection from sidebar or internal link
  const handleSelectModule = (item) => {
    if (item.id === 'overview' && !isSuperUser) {
      alert('Access Denied: Master Dashboard is restricted to Administrators.')
      return
    }
    setActiveModule(item.name)
    setActiveModuleId(item.id)
  }

  const handleNavigate = (targetId) => {
    if (targetId === 'overview' && !isSuperUser) {
      alert('Access Denied: Master Dashboard is restricted to Administrators.')
      return
    }
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

  // Handle quick lead creation from topbar
  const handleQuickLeadSubmit = async (formData) => {
    try {
      const res = await module1Service.createLead(formData)
      if (res?.success) {
        setIsQuickAddOpen(false)
        handleNavigate('leads')
      }
    } catch (err) {
      console.error('Quick lead create failed:', err)
      alert(err.response?.data?.message || 'Failed to create lead')
    }
  }

  // Render current active page
  const renderContent = () => {
    switch (activeModuleId) {
      case 'overview':
        return isSuperUser ? (
          <OverviewDashboard onNavigate={handleNavigate} onSelectPage={handleNavigate} />
        ) : (
          <LeadsPage onNavigateToQuotation={() => handleNavigate('quotations')} />
        )
      case 'leads':
        return <LeadsPage onNavigateToQuotation={() => handleNavigate('quotations')} />
      case 'followups':
        return <FollowupPage onNavigate={handleNavigate} />
      case 'quotations':
        return <QuotationsPage onNavigateToOrders={() => handleNavigate('orders')} />
      case 'orders':
        return <OrdersPage onNavigate={handleNavigate} />
      case 'engineering':
        return <EngineeringDashboard />
      case 'finance':
        return <FinanceDashboard />
      default:
        return isSuperUser ? (
          <OverviewDashboard onNavigate={handleNavigate} onSelectPage={handleNavigate} />
        ) : (
          <LeadsPage onNavigateToQuotation={() => handleNavigate('quotations')} />
        )
    }
  }

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-[#070e1e] font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Left Sidebar */}
      <Sidebar
        sections={visibleSections}
        activeModuleId={activeModuleId}
        onSelectModule={handleSelectModule}
        user={effectiveUser}
        onLogout={logout}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Right Content Area: Navbar + Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#edf1f7]">
        {/* Top Navbar */}
        <Navbar
          activeModule={activeModule}
          isAdmin={isAdmin}
          onOpenAdminApprovals={() => setIsAdminApprovalsOpen(true)}
          onOpenTrace={() => setIsTraceOpen(true)}
          onQuickAdd={() => setIsQuickAddOpen(true)}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Main Workspace (Scrollable) */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Quick Add Lead Modal (accessible anywhere via Navbar) */}
      <CreateLeadModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSubmit={handleQuickLeadSubmit}
      />

      {/* Trace Job Modal (accessible anywhere via Navbar) */}
      <TraceJobModal
        isOpen={isTraceOpen}
        onClose={() => setIsTraceOpen(false)}
        onNavigate={handleNavigate}
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
