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

// Module 2 Pages
import Module2Dashboard from '../../features/module2/pages/Module2Dashboard'
import VendorMasterPage from '../../features/module2/pages/VendorMasterPage'
import PurchaseRequestsAndRfqsPage from '../../features/module2/pages/PurchaseRequestsAndRfqsPage'
import PurchaseOrdersPage from '../../features/module2/pages/PurchaseOrdersPage'
import GoodsReceiptsPage from '../../features/module2/pages/GoodsReceiptsPage'
import InventoryPage from '../../features/module2/pages/InventoryPage'

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
      return ['ADMIN', 'SALES_MANAGER'].includes(userRole)
    }
    if (sectionId === 'module-1') {
      return ['ADMIN', 'SALES_MANAGER', 'SALES_CONSULTANT', 'BACK_OFFICER', 'ACCOUNTS_MANAGER'].includes(userRole)
    }
    if (sectionId === 'manufacturing' || sectionId === 'module-3') {
      return ['ADMIN', 'PRODUCTION_MANAGER', 'SALES_MANAGER', 'BACK_OFFICER', 'RND_ENGINEER'].includes(userRole)
    }
    if (sectionId === 'commercial' || sectionId === 'module-6') {
      return userRole === 'ADMIN'
    }
    return true
  }

  const isItemAllowed = (itemId) => {
    if (isAdmin || user?.hasFullAccess) return true
    if (itemId === 'overview') return ['ADMIN', 'SALES_MANAGER'].includes(userRole)
    if (itemId === 'leads' || itemId === 'followups') return ['ADMIN', 'SALES_MANAGER', 'SALES_CONSULTANT', 'BACK_OFFICER'].includes(userRole)
    if (itemId === 'quotations') return ['ADMIN', 'SALES_MANAGER', 'BACK_OFFICER'].includes(userRole)
    if (itemId === 'orders') return ['ADMIN', 'SALES_MANAGER', 'BACK_OFFICER', 'PRODUCTION_MANAGER', 'ACCOUNTS_MANAGER'].includes(userRole)
    if (itemId.startsWith('m3-') || itemId === 'engineering') {
      return ['ADMIN', 'PRODUCTION_MANAGER', 'SALES_MANAGER', 'BACK_OFFICER', 'RND_ENGINEER'].includes(userRole)
    }
    if (itemId.startsWith('m6-') || itemId === 'finance') {
      return userRole === 'ADMIN'
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
        return <EngineeringDashboard initialTab="products" />
      case 'm3-boms':
        return <EngineeringDashboard initialTab="boms" />
      case 'm3-drawings':
        return <EngineeringDashboard initialTab="drawings" />

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
    } else if (scope === 'M3') {
      if (!activeModuleId.startsWith('m3-')) {
        handleNavigate('m3-products')
      }
    } else if (scope === 'M6') {
      if (!activeModuleId.startsWith('m6-')) {
        handleNavigate('m6-invoices')
      }
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

      {/* Right Content Area: Navbar + Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#070e1e]">
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
