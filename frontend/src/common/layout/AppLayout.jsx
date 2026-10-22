import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import AddModuleModal from './AddModuleModal'
import OperationsOverview from '../../features/dashboard/OperationsOverview'
import { initialNavSections, currentUser as defaultUser } from '../../data/navigationModules'
import { useAuth, AdminApprovalPanel } from '../../features/auth'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const [sections, setSections] = useState(initialNavSections)
  const [activeModule, setActiveModule] = useState('Dashboard')
  const [activeModuleId, setActiveModuleId] = useState('dashboard')
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

  // Handle module selection from sidebar (single module selection)
  const handleSelectModule = (module) => {
    setActiveModule(module.name)
    setActiveModuleId(module.id)
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

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-[#141d30] font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Left Sidebar (Single module, no submodules) */}
      <Sidebar
        sections={sections}
        activeModuleId={activeModuleId}
        onSelectModule={handleSelectModule}
        onOpenAddModuleModal={() => setIsAddModuleModalOpen(true)}
        user={effectiveUser}
        onLogout={logout}
      />

      {/* Right Content Area: Navbar + Main Middle Box */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#edf1f7]">
        {/* Top Navbar matching the sidebar deep navy color */}
        <Navbar
          activeModule={activeModule}
          isAdmin={isAdmin}
          onOpenAdminApprovals={() => setIsAdminApprovalsOpen(true)}
        />

        {/* Main Middle Box (Single Dashboard: Operations Overview) */}
        <main className="flex-1 overflow-y-auto">
          <OperationsOverview subModuleTitle={`${activeModule} Overview`} />
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
