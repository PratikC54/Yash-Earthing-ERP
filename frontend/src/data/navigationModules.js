// Navigation modules configuration matching the Yash Group ERP V3 architecture
// Module 1 (Sales, CRM & Order) is fully implemented

export const initialNavSections = [
  {
    id: 'control-tower',
    title: 'Control Tower',
    items: [
      {
        id: 'overview',
        name: 'Master Dashboard',
        desc: 'Entire company & Module 1 in one view',
        icon: 'LayoutGrid',
        moduleId: 1,
      },
    ],
  },
  {
    id: 'module-1',
    title: 'Module 1 · Sales, CRM & Order',
    items: [
      {
        id: 'leads',
        name: 'Leads & Enquiries',
        desc: 'Source · Qualify · Auto-assigned to Consultant',
        icon: 'Users',
        badge: 'Live',
        badgeColor: 'emerald',
      },
      {
        id: 'followups',
        name: 'Follow-up Register',
        desc: 'Failed calls · Callbacks · WhatsApp follow-ups',
        icon: 'PhoneForwarded',
      },
      {
        id: 'calling',
        name: 'Sales Targets & Calling',
        desc: 'Consultant pipeline · Script assistant · Audio',
        icon: 'PhoneCall',
      },
      {
        id: 'quotations',
        name: 'Quotations & Estimates',
        desc: 'Back Officer issue · Revisions · Export PDF · PI',
        icon: 'FileText',
      },
      {
        id: 'orders',
        name: 'Orders & Dispatch Ready',
        desc: 'Customer PO · Manager SO · Stock reservation',
        icon: 'ShoppingCart',
      },
    ],
  },
  {
    id: 'module-2',
    title: 'Module 2 · Vendor, Procurement & Inventory',
    items: [
      {
        id: 'm2-vendors',
        name: 'Vendor Management',
        desc: 'Register · Capability · Rating',
        icon: 'Landmark',
        isExternal: true,
      },
      {
        id: 'm2-procurement',
        name: 'Procurement & PO',
        desc: 'PR · RFQ · Compare · Vendor PO',
        icon: 'Layers',
        isExternal: true,
      },
      {
        id: 'm2-inventory',
        name: 'Inventory & Receipt',
        desc: 'GRN · Stock · Physical reservation',
        icon: 'Box',
        isExternal: true,
      },
    ],
  },
  {
    id: 'module-3',
    title: 'Module 3 · Product & Engineering',
    items: [
      {
        id: 'm3-engineering',
        name: 'Product & Specification',
        desc: 'SKU · Spec · Standard assembly',
        icon: 'Sun',
        isExternal: true,
      },
      {
        id: 'm3-bom',
        name: 'BOM, BOQ & Costing',
        desc: 'Materials · Routing · Process cost',
        icon: 'Layers',
        isExternal: true,
      },
    ],
  },
  {
    id: 'module-4',
    title: 'Module 4 · Production & Quality',
    items: [
      {
        id: 'm4-planning',
        name: 'Production Planning',
        desc: 'Demand · Work orders · Capacity',
        icon: 'Activity',
        isExternal: true,
      },
      {
        id: 'm4-quality',
        name: 'Quality & Finished Goods',
        desc: 'Inspection · Hold · Dispatch release',
        icon: 'ShieldCheck',
        isExternal: true,
      },
    ],
  },
  {
    id: 'module-5',
    title: 'Module 5 · Logistics & Dispatch',
    items: [
      {
        id: 'm5-dispatch',
        name: 'Dispatch & Logistics',
        desc: 'Challan · Transport · Tracking',
        icon: 'Truck',
        isExternal: true,
      },
    ],
  },
]

export const currentUser = {
  name: 'Rukhsar Shaikh',
  role: 'BACK_OFFICER',
  initials: 'RS',
}
