import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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

// Module 5 Pages
import Module5Dashboard from '../../features/module5/pages/Module5Dashboard'
import ProjectRegisterPage from '../../features/module5/pages/ProjectRegisterPage'
import InstallationRegisterPage from '../../features/module5/pages/InstallationRegisterPage'
import ServiceTicketRegisterPage from '../../features/module5/pages/ServiceTicketRegisterPage'

// Module 4 Pages (Production & Quality)
import DashboardPage from '../../features/dashboard/pages/DashboardPage'
import ProductionPlanningPage from '../../features/production_quality/pages/ProductionPlanningPage'
import WorkOrdersPage from '../../features/production_quality/pages/WorkOrdersPage'
import ShopFloorPage from '../../features/production_quality/pages/ShopFloorPage'
import MaterialIssuancePage from '../../features/production_quality/pages/MaterialIssuancePage'
import InspectionPage from '../../features/production_quality/pages/InspectionPage'
import NonConformancePage from '../../features/production_quality/pages/NonConformancePage'
import DispatchPage from '../../features/production_quality/pages/DispatchPage'

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
  const [globalSearch, setGlobalSearch] = useState('')

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

  const userRole = user?.role || 'ADMIN'

  // Map allowed sections per role according to ERP governance
  const isSectionAllowed = (sectionId) => {
    if (isAdmin || user?.hasFullAccess) return true
    if (sectionId === 'control-tower') {
      return ['ADMIN', 'SALES_MANAGER', 'BACK_OFFICER'].includes(userRole)
    }
    if (sectionId === 'module-1') {
      return ['ADMIN', 'SALES_MANAGER', 'SALES_CONSULTANT', 'BACK_OFFICER', 'ACCOUNTS_MANAGER'].includes(userRole)
    }
    if (sectionId === 'manufacturing' || sectionId === 'module-3' || sectionId === 'module-4') {
      return ['ADMIN', 'PRODUCTION_MANAGER', 'SALES_MANAGER', 'BACK_OFFICER', 'RND_ENGINEER', 'QA_ENGINEER'].includes(userRole)
    }
    if (sectionId === 'module-5') {
      return ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'PRODUCTION_MANAGER', 'SALES_MANAGER', 'BACK_OFFICER'].includes(userRole)
    }
    if (sectionId === 'commercial' || sectionId === 'module-6') {
      return ['ADMIN', 'ACCOUNTS_MANAGER', 'BACK_OFFICER'].includes(userRole)
    }
    return true
  }

  const isItemAllowed = (itemId) => {
    if (isAdmin || user?.hasFullAccess) return true
    if (itemId === 'overview') return ['ADMIN', 'SALES_MANAGER', 'BACK_OFFICER'].includes(userRole)
    if (itemId === 'leads' || itemId === 'followups') return ['ADMIN', 'SALES_MANAGER', 'SALES_CONSULTANT', 'BACK_OFFICER'].includes(userRole)
    if (itemId === 'quotations') return ['ADMIN', 'SALES_MANAGER', 'BACK_OFFICER'].includes(userRole)
    if (itemId === 'orders') return ['ADMIN', 'SALES_MANAGER', 'BACK_OFFICER', 'PRODUCTION_MANAGER', 'ACCOUNTS_MANAGER'].includes(userRole)
    if (itemId.startsWith('m3-') || itemId === 'engineering') {
      return ['ADMIN', 'PRODUCTION_MANAGER', 'SALES_MANAGER', 'BACK_OFFICER', 'RND_ENGINEER'].includes(userRole)
    }
    if (itemId.startsWith('m4-') || itemId.startsWith('pq-')) {
      return ['ADMIN', 'PRODUCTION_MANAGER', 'SALES_MANAGER', 'BACK_OFFICER', 'RND_ENGINEER', 'QA_ENGINEER'].includes(userRole)
    }
    if (itemId.startsWith('m5-')) {
      return ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'PRODUCTION_MANAGER', 'SALES_MANAGER', 'BACK_OFFICER'].includes(userRole)
    }
    if (itemId.startsWith('m6-') || itemId === 'finance') {
      return ['ADMIN', 'ACCOUNTS_MANAGER', 'BACK_OFFICER'].includes(userRole)
    }
    return true
  }

  // Filter navigation sections based on RBAC:
  const visibleSections = sections
    .filter((sec) => isSectionAllowed(sec.id))
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => isItemAllowed(item.id)),
    }))
    .filter((sec) => sec.items.length > 0)

  // Handle module selection from sidebar or internal link
  const handleSelectModule = (item) => {
    if (!isItemAllowed(item.id)) {
      alert(`Access Restricted: ${item.name} is not permitted for your current role (${effectiveUser.role}).`)
      return
    }
    setActiveModule(item.name)
    setActiveModuleId(item.id)
  }

  const handleNavigate = (targetId) => {
    if (!isItemAllowed(targetId)) {
      alert(`Access Restricted: This section is not permitted for your current role (${effectiveUser.role}).`)
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
      'inventory': 'inventory',
      'm4-dashboard': 'm4-dashboard',
      'm4-planning': 'm4-planning',
      'm4-work-orders': 'm4-work-orders',
      'm4-shop-floor': 'm4-shop-floor',
      'm4-issuance': 'm4-issuance',
      'm4-inspections': 'm4-inspections',
      'm4-ncr': 'm4-ncr',
      'm4-dispatch': 'm4-dispatch',
      'production': 'm4-dashboard',
      'quality': 'm4-inspections',
      'shop-floor': 'm4-shop-floor',
      'work-orders': 'm4-work-orders',
      'm5-dashboard': 'm5-dashboard',
      'm5-projects': 'm5-projects',
      'm5-installations': 'm5-installations',
      'm5-service': 'm5-service',
      'projects': 'm5-projects',
      'installations': 'm5-installations',
      'service': 'm5-service'
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

      // Module 3: Product & Engineering submodules
      case 'engineering':
      case 'm3-products':
        return <EngineeringDashboard initialTab="products" onNavigate={handleNavigate} />
      case 'm3-boms':
        return <EngineeringDashboard initialTab="boms" onNavigate={handleNavigate} />
      case 'm3-drawings':
        return <EngineeringDashboard initialTab="drawings" onNavigate={handleNavigate} />

      // Module 4: Production & Quality
      case 'm4-dashboard':
        return <DashboardPage />
      case 'm4-planning':
        return <ProductionPlanningPage />
      case 'm4-work-orders':
        return <WorkOrdersPage />
      case 'm4-shop-floor':
        return <ShopFloorPage />
      case 'm4-issuance':
        return <MaterialIssuancePage />
      case 'm4-inspections':
        return <InspectionPage />
      case 'm4-ncr':
        return <NonConformancePage />
      case 'm4-dispatch':
        return <DispatchPage />

      // Module 5: Project, Installation & Service
      case 'm5-dashboard':
        return <Module5Dashboard onNavigate={handleNavigate} />
      case 'm5-projects':
        return <ProjectRegisterPage />
      case 'm5-installations':
        return <InstallationRegisterPage />
      case 'm5-service':
        return <ServiceTicketRegisterPage />

      // Module 6: Finance & Commercial submodules
      case 'finance':
      case 'm6-invoices':
        return <FinanceDashboard initialTab="invoices" globalSearch={globalSearch} />
      case 'm6-payables':
        return <FinanceDashboard initialTab="payables" globalSearch={globalSearch} />
      case 'm6-costing':
        return <FinanceDashboard initialTab="costing" globalSearch={globalSearch} />
      case 'm6-settings':
        return <FinanceDashboard initialTab="settings" globalSearch={globalSearch} />

      // Module 7: HRMS Workforce Pages
      case 'hrms':
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

  const currentSection = sections.find((sec) => sec.items.some((it) => it.id === activeModuleId))
  const currentItem = currentSection?.items.find((it) => it.id === activeModuleId)
  const navSectionTitle = currentSection ? currentSection.title : 'Control Tower'
  const navSubModuleTitle = currentItem ? currentItem.name : activeModule

  const handleScopeChange = (scope) => {
    if (scope === 'M1') {
      if (!['leads', 'followups', 'quotations', 'orders'].includes(activeModuleId)) {
        handleNavigate('leads')
      }
    } else if (scope === 'M2') {
      if (!['procurement-dashboard', 'vendors', 'purchase-requests', 'purchase-orders', 'goods-receipts', 'inventory'].includes(activeModuleId)) {
        handleNavigate('procurement-dashboard')
      }
    } else if (scope === 'M3') {
      if (!activeModuleId.startsWith('m3-')) {
        handleNavigate('m3-products')
      }
    } else if (scope === 'M4') {
      if (!activeModuleId.startsWith('m4-')) {
        handleNavigate('m4-dashboard')
      }
    } else if (scope === 'M5') {
      if (!activeModuleId.startsWith('m5-')) {
        handleNavigate('m5-dashboard')
      }
    } else if (scope === 'M6') {
      if (!activeModuleId.startsWith('m6-')) {
        handleNavigate('m6-invoices')
      }
    } else if (scope === 'M7') {
      if (!['hrms', 'employees', 'attendance', 'task', 'performance', 'payroll', 'shifts'].includes(activeModuleId)) {
        handleNavigate('employees')
      }
    }
  }

  return (
    <div className="w-full h-[100dvh] flex overflow-hidden bg-[#fafaf9] font-sans antialiased selection:bg-lime-400 selection:text-black">
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

      {/* Right Content Area: Navbar + Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#fafaf9]">
        {/* Top Navbar */}
        <Navbar
          activeModule={navSectionTitle}
          activeSubModule={navSubModuleTitle}
          isAdmin={isAdmin}
          user={effectiveUser}
          onSearch={setGlobalSearch}
          onScopeChange={handleScopeChange}
          onOpenAdminApprovals={() => setIsAdminApprovalsOpen(true)}
          onOpenTrace={() => setIsTraceOpen(true)}
          onQuickAdd={() => setIsQuickAddOpen(true)}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Main Workspace (Scrollable with mobile touch momentum) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
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
