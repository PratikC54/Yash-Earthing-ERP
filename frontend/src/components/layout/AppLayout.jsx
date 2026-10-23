import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import AddModuleModal from "./AddModuleModal";
import OperationsOverview from "../../features/dashboard/OperationsOverview";
import { initialNavSections } from "../../data/navigationModules";

export default function AppLayout() {
  const [sections, setSections] = useState(initialNavSections);
  const [activeModule, setActiveModule] = useState("Dashboard");
  const [activeModuleId, setActiveModuleId] = useState("dashboard");
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);

  // Handle module selection from sidebar (single module selection)
  const handleSelectModule = (module) => {
    setActiveModule(module.name);
    setActiveModuleId(module.id);
  };

  // Handle dynamic addition of a new module to the sidebar
  const handleAddModule = (sectionId, newModule) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            items: [...sec.items, newModule],
          };
        }
        return sec;
      }),
    );
    setActiveModule(newModule.name);
    setActiveModuleId(newModule.id);
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-[#141d30] font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Left Sidebar (Single module, no submodules) */}
      <Sidebar
        sections={sections}
        activeModuleId={activeModuleId}
        onSelectModule={handleSelectModule}
        onOpenAddModuleModal={() => setIsAddModuleModalOpen(true)}
      />

      {/* Right Content Area: Navbar + Main Middle Box */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#edf1f7]">
        {/* Top Navbar matching the sidebar deep navy color */}
        <Navbar activeModule={activeModule} />

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
    </div>
  );
}
