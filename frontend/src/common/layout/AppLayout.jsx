import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { initialNavSections, currentUser as defaultUser } from '../../data/navigationModules'
import { useAuth, AdminApprovalPanel } from '../../features/auth'
import EngineeringDashboard from '../../features/engineering/EngineeringDashboard'

// Module 1 Pages & Modals
import OverviewDashboard from '../../features/module1/pages/OverviewDashboard'
import LeadsPage from '../../features/module1/pages/LeadsPage'
import FollowupPage from '../../features/module1/pages/FollowupPage'
import QuotationsPage from '../../features/module1/pages/QuotationsPage'
import OrdersPage from '../../features/module1/pages/OrdersPage'
import CreateLeadModal from '../../features/module1/components/CreateLeadModal'
import TraceJobModal from '../../features/module1/components/TraceJobModal'
import module1Service from '../../features/module1/services/module1Service'

// Module 2 Pages
import Module2Dashboard from '../../features/module2/pages/Module2Dashboard'
import VendorMasterPage from '../../features/module2/pages/VendorMasterPage'
import PurchaseRequestsAndRfqsPage from '../../features/module2/pages/PurchaseRequestsAndRfqsPage'
import PurchaseOrdersPage from '../../features/module2/pages/PurchaseOrdersPage'
import GoodsReceiptsPage from '../../features/module2/pages/GoodsReceiptsPage'
import InventoryPage from '../../features/module2/pages/InventoryPage'

// Module 7 Pages & Components
import HRMSDashboard from '../../features/hrms/HRMSDashboard'
import AttendanceManager from '../../features/hrms/attendance/AttendanceManager'
import TaskManager from '../../features/hrms/tasks/TaskManager'
import PerformanceManager from '../../features/hrms/performance/PerformanceManager'
import PayrollManager from '../../features/hrms/payroll/PayrollManager'
import ManufacturingIntegration from '../../features/hrms/manufacturing/ManufacturingIntegration'

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

  // Initialize activeModuleId based on URL path if present
  useEffect(() => {
    const path = window.location.pathname.replace(/^\//, '').toLowerCase()
    const pathMapping = {
      '': defaultPageId,
      'employees': 'employees',
      'attendance': 'attendance',
      'task': 'task',
      'tasks': 'task',
      'performance': 'performance',
      'payroll': 'payroll',
      'shifts': 'shifts',
      'manufacturing': 'shifts',
      'engineering': 'engineering',
      'leads': 'leads',
      'followups': 'followups',
      'quotations': 'quotations',
      'orders': 'orders',
      'procurement-dashboard': 'procurement-dashboard',
      'vendors': 'vendors',
      'purchase-requests': 'purchase-requests',
      'purchase-orders': 'purchase-orders',
      'goods-receipts': 'goods-receipts',
      'inventory': 'inventory'
    }
    if (path && pathMapping[path]) {
      handleNavigate(pathMapping[path])
    }
  }, [])

  // Render current active page
  const renderContent = () => {
    switch (activeModuleId) {
      // Module 1 & Overview
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

      // Module 2 Pages
      case 'procurement-dashboard':
        return (
          <Module2Dashboard
            onNavigate={(moduleId) => {
              handleNavigate(moduleId)
            }}
          />
        )
      case 'vendors':
        return <VendorMasterPage />
      case 'purchase-requests':
        return <PurchaseRequestsAndRfqsPage />
      case 'purchase-orders':
        return <PurchaseOrdersPage />
      case 'goods-receipts':
        return <GoodsReceiptsPage />
      case 'inventory':
        return <InventoryPage />

      // Module 3 Pages
      case 'engineering':
        return <EngineeringDashboard />

      // Module 7: HRMS Workforce Pages
      case 'employees':
        return <HRMSDashboard initialTab="employees" />
      case 'attendance':
        return <AttendanceManager />
      case 'task':
        return <TaskManager />
      case 'performance':
        return <PerformanceManager />
      case 'payroll':
        return <PayrollManager />
      case 'shifts':
        return <ManufacturingIntegration />

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
      {/* Sidebar (Desktop Persistent + Mobile Slide-out Drawer) */}
      <Sidebar
        sections={visibleSections}
        activeModuleId={activeModuleId}
        onSelectModule={handleSelectModule}
        user={effectiveUser}
        onLogout={logout}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Right Content Area: Navbar + Main Middle Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#070e1e]">
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
