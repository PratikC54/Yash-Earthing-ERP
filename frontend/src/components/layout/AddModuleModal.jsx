import React, { useState } from "react";
import { X, Layers, Plus } from "lucide-react";

export default function AddModuleModal({
  isOpen,
  onClose,
  onAddModule,
  sections,
}) {
  const [moduleName, setModuleName] = useState("");
  const targetSectionId = sections[0]?.id || "overview";
  const [icon, setIcon] = useState("Box");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!moduleName.trim()) return;

    const newModule = {
      id: moduleName.toLowerCase().replace(/\s+/g, "-"),
      name: moduleName.trim(),
      icon: icon || "Box",
      active: false,
    };

    onAddModule(targetSectionId, newModule);
    setModuleName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#141d30] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">Add Module</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Module Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Inventory, Quality Hub, Sales, Purchasing"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              className="w-full bg-[#0d1424] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Section
            </label>
            <select
              value={targetSectionId}
              onChange={(e) => setTargetSectionId(e.target.value)}
              className="w-full bg-[#0d1424] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Icon
            </label>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full bg-[#0d1424] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="LayoutGrid">Dashboard / Grid</option>
              <option value="Box">Box / Inventory</option>
              <option value="Layers">Layers / Workflow</option>
              <option value="ShieldCheck">Shield / Quality & Compliance</option>
              <option value="Activity">Activity / Telemetry</option>
              <option value="Truck">Truck / Logistics</option>
              <option value="ShoppingCart">Cart / Procurement</option>
              <option value="Landmark">Landmark / Finance</option>
              <option value="Users">Users / HR</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center space-x-1.5 shadow-md shadow-blue-900/30 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Module</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


