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
import QualityDashboard from '../../features/production_quality/pages/QualityDashboard'
import ProductionCompletionPage from '../../features/production_quality/pages/ProductionCompletionPage'
import WorkOrderDetailsPage from '../../features/production_quality/pages/WorkOrderDetailsPage'
import WorkOrderReportPage from '../../features/production_quality/pages/WorkOrderReportPage'
import InspectionDetailsPage from '../../features/production_quality/pages/InspectionDetailsPage'
import NotificationHistoryPage from '../../features/production_quality/pages/NotificationHistoryPage'

const moduleToPathMap = {
  'overview': '/overview',
  'leads': '/leads',
  'followups': '/followups',
  'quotations': '/quotations',
  'orders': '/orders',
  'procurement-dashboard': '/procurement-dashboard',
  'vendors': '/vendors',
  'purchase-requests': '/purchase-requests',
  'purchase-orders': '/purchase-orders',
  'goods-receipts': '/goods-receipts',
  'inventory': '/inventory',
  'engineering': '/engineering',
  'm3-products': '/m3-products',
  'm3-boms': '/m3-boms',
  'm3-drawings': '/m3-drawings',
  'm4-dashboard': '/production-quality/dashboard',
  'm4-planning': '/production-quality/planning',
  'm4-work-orders': '/production-quality/work-orders',
  'm4-shop-floor': '/production-quality/manufacturing',
  'm4-issuance': '/production-quality/material-issuance',
  'm4-inspections': '/production-quality/inspections',
  'm4-ncr': '/production-quality/non-conformance',
  'm4-dispatch': '/production-quality/dispatch',
  'm4-completion': '/production-quality/completion',
  'm4-quality': '/production-quality/quality',
  'm5-dashboard': '/m5-dashboard',
  'm5-projects': '/m5-projects',
  'm5-installations': '/m5-installations',
  'm5-service': '/m5-service',
  'finance': '/finance',
  'm6-invoices': '/m6-invoices',
  'm6-payables': '/m6-payables',
  'm6-costing': '/m6-costing',
  'm6-settings': '/m6-settings',
  'employees': '/employees',
  'attendance': '/attendance',
  'task': '/task',
  'performance': '/performance',
  'payroll': '/payroll',
  'shifts': '/shifts',
}

const resolvePathToModule = (rawPath) => {
  if (!rawPath) return null
  const cleanPath = String(rawPath).toLowerCase().split('?')[0].replace(/^\/+/, '').replace(/\/+$/, '')

  // 1. Work Order Report (PDF)
  if (
    cleanPath.includes('work-orders') &&
    (cleanPath.endsWith('/report.pdf') || cleanPath.endsWith('/report') || cleanPath.includes('/report'))
  ) {
    return { moduleId: 'm4-work-order-report', moduleName: 'Work Order Report' }
  }

  // 2. Work Order Details
  if (
    cleanPath.match(/(?:production-quality\/|pq\/|production\/|pg\/|^)work-orders\/[a-zA-Z0-9_-]+$/) &&
    !cleanPath.endsWith('work-orders')
  ) {
    return { moduleId: 'm4-work-order-details', moduleName: 'Work Order Details' }
  }

  // 3. Inspection Details
  if (
    cleanPath.match(/(?:production-quality\/|pq\/|quality\/|^)inspections\/[a-zA-Z0-9_-]+$/) &&
    !cleanPath.endsWith('inspections')
  ) {
    return { moduleId: 'm4-inspection-details', moduleName: 'Inspection Details' }
  }

  // 4. Planning & Scheduling
  if (
    cleanPath === 'production-quality/planning' ||
    cleanPath === 'pq/planning' ||
    cleanPath === 'production/planning' ||
    cleanPath === 'erp/production/planning' ||
    cleanPath === 'm4-planning'
  ) {
    return { moduleId: 'm4-planning', moduleName: 'Planning & Scheduling' }
  }

  // 5. Work Orders
  if (
    cleanPath === 'production-quality/work-orders' ||
    cleanPath === 'pq/work-orders' ||
    cleanPath === 'production/work-orders' ||
    cleanPath === 'erp/production/work-orders' ||
    cleanPath === 'work-orders' ||
    cleanPath === 'pg/work-orders' ||
    cleanPath === 'm4-work-orders'
  ) {
    return { moduleId: 'm4-work-orders', moduleName: 'Work Orders & Job Cards' }
  }

  // 6. Material Issuance
  if (
    cleanPath === 'production-quality/material-issuance' ||
    cleanPath === 'pq/material-issuance' ||
    cleanPath === 'production/material-issuance' ||
    cleanPath === 'erp/production/material-issuance' ||
    cleanPath === 'material-issuance' ||
    cleanPath === 'm4-issuance'
  ) {
    return { moduleId: 'm4-issuance', moduleName: 'Material Issuance' }
  }

  // 7. Shop Floor Tracking / Manufacturing Execution
  if (
    cleanPath === 'production-quality/manufacturing' ||
    cleanPath === 'production-quality/shop-floor' ||
    cleanPath === 'production-quality/tracking' ||
    cleanPath === 'pq/manufacturing' ||
    cleanPath === 'production/manufacturing' ||
    cleanPath === 'production/shop-floor' ||
    cleanPath === 'production/tracking' ||
    cleanPath === 'erp/production/manufacturing' ||
    cleanPath === 'erp/production/shop-floor' ||
    cleanPath === 'shop-floor' ||
    cleanPath === 'm4-shop-floor'
  ) {
    return { moduleId: 'm4-shop-floor', moduleName: 'Shop Floor Tracking' }
  }

  // 8. Quality Inspections
  if (
    cleanPath === 'production-quality/inspections' ||
    cleanPath === 'pq/inspections' ||
    cleanPath === 'quality/inspections' ||
    cleanPath === 'erp/quality/inspections' ||
    cleanPath === 'production/quality-inspection' ||
    cleanPath === 'm4-inspections'
  ) {
    return { moduleId: 'm4-inspections', moduleName: 'Quality Inspections' }
  }

  // 9. Quality Dashboard / Quality Assurance
  if (
    cleanPath === 'production-quality/quality' ||
    cleanPath === 'pq/quality' ||
    cleanPath === 'quality' ||
    cleanPath === 'quality/dashboard' ||
    cleanPath === 'erp/quality' ||
    cleanPath === 'production/quality'
  ) {
    return { moduleId: 'm4-quality', moduleName: 'Quality Assurance' }
  }

  // 10. Non-Conformance (NCR) / CAPA / Rework
  if (
    cleanPath === 'production-quality/non-conformance' ||
    cleanPath === 'pq/non-conformance' ||
    cleanPath === 'quality/non-conformance' ||
    cleanPath === 'erp/quality/non-conformance' ||
    cleanPath === 'non-conformance' ||
    cleanPath === 'production-quality/rework' ||
    cleanPath === 'pq/rework' ||
    cleanPath === 'quality/capa' ||
    cleanPath === 'quality/rework' ||
    cleanPath === 'rework' ||
    cleanPath === 'm4-ncr'
  ) {
    return { moduleId: 'm4-ncr', moduleName: 'Non-Conformance (NCR)' }
  }

  // 11. Finished Goods Approval / Production Completion
  if (
    cleanPath === 'production-quality/completion' ||
    cleanPath === 'pq/completion' ||
    cleanPath === 'production/completion' ||
    cleanPath === 'erp/production/completion'
  ) {
    return { moduleId: 'm4-completion', moduleName: 'Finished Goods Approval' }
  }

  // 12. Production Dispatch
  if (
    cleanPath === 'production-quality/dispatch' ||
    cleanPath === 'pq/dispatch' ||
    cleanPath === 'production/dispatch' ||
    cleanPath === 'dispatch' ||
    cleanPath === 'm4-dispatch'
  ) {
    return { moduleId: 'm4-dispatch', moduleName: 'Production Dispatch' }
  }

  // 13. Smart Alerts / Notifications
  if (
    cleanPath === 'production-quality/notifications' ||
    cleanPath === 'pq/notifications' ||
    cleanPath === 'notifications'
  ) {
    return { moduleId: 'm4-notifications', moduleName: 'Alerts & Escalations' }
  }

  // 14. Production & Quality Dashboard
  if (
    cleanPath === 'production-quality' ||
    cleanPath === 'production-quality/dashboard' ||
    cleanPath === 'production-quality/production' ||
    cleanPath === 'pq/dashboard' ||
    cleanPath === 'pq' ||
    cleanPath === 'production' ||
    cleanPath === 'production/dashboard' ||
    cleanPath === 'erp/production/dashboard' ||
    cleanPath === 'm4-dashboard'
  ) {
    return { moduleId: 'm4-dashboard', moduleName: 'Production & QA Center' }
  }

  // 15. Other General Modules
  const generalMap = {
    'overview': { moduleId: 'overview', moduleName: 'Master Dashboard' },
    'leads': { moduleId: 'leads', moduleName: 'Leads & Enquiries' },
    'followups': { moduleId: 'followups', moduleName: 'Customer Follow-ups' },
    'quotations': { moduleId: 'quotations', moduleName: 'Quotations & Estimates' },
    'orders': { moduleId: 'orders', moduleName: 'Orders & Dispatch Ready' },
    'procurement-dashboard': { moduleId: 'procurement-dashboard', moduleName: 'Procurement Dashboard' },
    'vendors': { moduleId: 'vendors', moduleName: 'Vendor Master' },
    'purchase-requests': { moduleId: 'purchase-requests', moduleName: 'Purchase Requests & RFQs' },
    'purchase-orders': { moduleId: 'purchase-orders', moduleName: 'Purchase Orders' },
    'goods-receipts': { moduleId: 'goods-receipts', moduleName: 'Goods Receipts (GRN)' },
    'inventory': { moduleId: 'inventory', moduleName: 'Raw Materials & Inventory' },
    'engineering': { moduleId: 'engineering', moduleName: 'Products & Specifications' },
    'm3-products': { moduleId: 'm3-products', moduleName: 'Products & Specifications' },
    'm3-boms': { moduleId: 'm3-boms', moduleName: 'Bill of Materials (BOM)' },
    'm3-drawings': { moduleId: 'm3-drawings', moduleName: 'Engineering Drawings' },
    'm5-dashboard': { moduleId: 'm5-dashboard', moduleName: 'Installation & Projects' },
    'm5-projects': { moduleId: 'm5-projects', moduleName: 'Project Register' },
    'm5-installations': { moduleId: 'm5-installations', moduleName: 'Installation Register' },
    'm5-service': { moduleId: 'm5-service', moduleName: 'Service Tickets' },
    'projects': { moduleId: 'm5-projects', moduleName: 'Project Register' },
    'installations': { moduleId: 'm5-installations', moduleName: 'Installation Register' },
    'service': { moduleId: 'm5-service', moduleName: 'Service Tickets' },
    'finance': { moduleId: 'finance', moduleName: 'Commercial Invoicing' },
    'm6-invoices': { moduleId: 'm6-invoices', moduleName: 'Commercial Invoicing' },
    'm6-payables': { moduleId: 'm6-payables', moduleName: 'Vendor Payables' },
    'm6-costing': { moduleId: 'm6-costing', moduleName: 'Job Costing & P&L' },
    'm6-settings': { moduleId: 'm6-settings', moduleName: 'Commercial Settings' },
    'employees': { moduleId: 'employees', moduleName: 'HRMS' },
    'attendance': { moduleId: 'attendance', moduleName: 'Attendance Manager' },
    'task': { moduleId: 'task', moduleName: 'Task Manager' },
    'tasks': { moduleId: 'task', moduleName: 'Task Manager' },
    'performance': { moduleId: 'performance', moduleName: 'Performance Manager' },
    'payroll': { moduleId: 'payroll', moduleName: 'Payroll Manager' },
    'shifts': { moduleId: 'shifts', moduleName: 'Manufacturing Integration' },
  }

  return generalMap[cleanPath] || null
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'
  const isSuperUser = isAdmin || user?.hasFullAccess === true
  const [sections] = useState(initialNavSections)

  const defaultPageId = isSuperUser
    ? 'overview'
    : user?.role === 'BACK_OFFICER'
    ? 'quotations'
    : user?.role === 'SALES_MANAGER'
    ? 'orders'
    : 'leads'

  const initialResolved = typeof window !== 'undefined'
    ? resolvePathToModule(window.location.pathname)
    : null

  const [activeModuleId, setActiveModuleId] = useState(
    initialResolved ? initialResolved.moduleId : defaultPageId
  )
  const [activeModule, setActiveModule] = useState(
    initialResolved
      ? initialResolved.moduleName
      : isSuperUser
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
    const targetPath = moduleToPathMap[item.id]
    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath)
    }
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
    const targetPath = moduleToPathMap[targetId]
    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath)
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

  // Synchronize URL pathname changes to activeModuleId & activeModule
  useEffect(() => {
    const rawPath = location.pathname.toLowerCase().replace(/^\/+/, '').replace(/\/+$/, '')
    if (!rawPath) return

    const resolved = resolvePathToModule(rawPath)
    if (resolved && resolved.moduleId !== activeModuleId) {
      if (!isItemAllowed(resolved.moduleId)) return
      setActiveModuleId(resolved.moduleId)
      if (resolved.moduleName) {
        setActiveModule(resolved.moduleName)
      }
    }
  }, [location.pathname, activeModuleId])

  // Render current active page
  const renderContent = () => {
    switch (activeModuleId) {
      // Module 1 & Overview
      case 'overview':
        return isSuperUser ? (
          <OverviewDashboard onNavigate={handleNavigate} onSelectPage={handleNavigate} />
        ) : (
          <LeadsPage onNavigateToQuotation={() => handleNavigate('quotations')} globalSearch={globalSearch} />
        )
      case 'leads':
        return <LeadsPage onNavigateToQuotation={() => handleNavigate('quotations')} globalSearch={globalSearch} />
      case 'followups':
        return <FollowupPage onNavigate={handleNavigate} />
      case 'quotations':
        return <QuotationsPage onNavigateToOrders={() => handleNavigate('orders')} />
      case 'orders':
        return <OrdersPage onNavigate={handleNavigate} globalSearch={globalSearch} />
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
        return <InventoryPage globalSearch={globalSearch} />

      // Module 3: Product & Engineering submodules
      case 'engineering':
      case 'm3-products':
        return <EngineeringDashboard initialTab="products" onNavigate={handleNavigate} globalSearch={globalSearch} />
      case 'm3-boms':
        return <EngineeringDashboard initialTab="boms" onNavigate={handleNavigate} globalSearch={globalSearch} />
      case 'm3-drawings':
        return <EngineeringDashboard initialTab="drawings" onNavigate={handleNavigate} globalSearch={globalSearch} />

      // Module 4: Production & Quality
      case 'm4-dashboard':
        return <DashboardPage onNavigate={handleNavigate} />
      case 'm4-planning':
        return <ProductionPlanningPage />
      case 'm4-work-orders':
        return <WorkOrdersPage />
      case 'm4-work-order-details':
        return <WorkOrderDetailsPage />
      case 'm4-work-order-report':
        return <WorkOrderReportPage />
      case 'm4-shop-floor':
        return <ShopFloorPage />
      case 'm4-issuance':
        return <MaterialIssuancePage />
      case 'm4-inspections':
        return <InspectionPage />
      case 'm4-inspection-details':
        return <InspectionDetailsPage />
      case 'm4-ncr':
        return <NonConformancePage />
      case 'm4-completion':
        return <ProductionCompletionPage />
      case 'm4-dispatch':
        return <DispatchPage />
      case 'm4-quality':
        return <QualityDashboard />
      case 'm4-rework':
        return <ReworkTrackingPage />
      case 'm4-notifications':
        return <NotificationHistoryPage />

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
          onNavigate={handleNavigate}
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
