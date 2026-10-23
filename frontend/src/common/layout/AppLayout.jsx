import React, { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import AddModuleModal from './AddModuleModal'
import OperationsOverview from '../../features/dashboard/OperationsOverview'
import Module2Dashboard from '../../features/module2/pages/Module2Dashboard'
import VendorMasterPage from '../../features/module2/pages/VendorMasterPage'
import PurchaseRequestsAndRfqsPage from '../../features/module2/pages/PurchaseRequestsAndRfqsPage'
import PurchaseOrdersPage from '../../features/module2/pages/PurchaseOrdersPage'
import GoodsReceiptsPage from '../../features/module2/pages/GoodsReceiptsPage'
import InventoryPage from '../../features/module2/pages/InventoryPage'
import { initialNavSections, currentUser } from '../../data/navigationModules'

export default function AppLayout() {
  const [sections, setSections] = useState(initialNavSections)
  const [activeModule, setActiveModule] = useState('Procurement Dashboard')
  const [activeModuleId, setActiveModuleId] = useState('procurement-dashboard')
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Handle module selection from sidebar (single module selection)
  const handleSelectModule = (module) => {
    setActiveModule(module.name)
    setActiveModuleId(module.id)
    setIsMobileSidebarOpen(false) // Close mobile drawer when route selected
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
    setIsMobileSidebarOpen(false)
  }

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-[#070e1e] font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Left Sidebar (Desktop Persistent + Mobile Slide-out Drawer) */}
      <Sidebar
        sections={sections}
        activeModuleId={activeModuleId}
        onSelectModule={handleSelectModule}
        onOpenAddModuleModal={() => setIsAddModuleModalOpen(true)}
        user={currentUser}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Right Content Area: Navbar + Main Middle Box */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#070e1e]">
        {/* Top Navbar matching the cyber steel theme */}
        <Navbar
          activeModule={activeModule}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Main Middle Box */}
        <main className="flex-1 overflow-y-auto">
          {activeModuleId === 'procurement-dashboard' ? (
            <Module2Dashboard
              onNavigate={(moduleId) => {
                setActiveModuleId(moduleId);
                const mod = sections.flatMap((s) => s.items).find((i) => i.id === moduleId);
                if (mod) setActiveModule(mod.name);
              }}
            />
          ) : activeModuleId === 'vendors' ? (
            <VendorMasterPage />
          ) : activeModuleId === 'purchase-requests' ? (
            <PurchaseRequestsAndRfqsPage />
          ) : activeModuleId === 'purchase-orders' ? (
            <PurchaseOrdersPage />
          ) : activeModuleId === 'goods-receipts' ? (
            <GoodsReceiptsPage />
          ) : activeModuleId === 'inventory' ? (
            <InventoryPage />
          ) : (
            <OperationsOverview subModuleTitle={`${activeModule} Overview`} />
          )}
        </main>
      </div>

      {/* Dynamic Module Addition Modal */}
      <AddModuleModal
        isOpen={isAddModuleModalOpen}
        onClose={() => setIsAddModuleModalOpen(false)}
        onAddModule={handleAddModule}
        sections={sections}
      />
    </div>
  )
}
