// Navigation modules configuration for Yash ERP
// Supports Module 1 (Sales, CRM & Order), Module 2 (Procurement & Inventory), and Module 3 (Engineering)

export const initialNavSections = [
  {
    id: 'control-tower',
    title: 'Control Tower',
    items: [
      {
        id: 'overview',
        name: 'Master Dashboard',
        desc: 'Pipeline overview, KPIs & live actions',
        icon: 'LayoutGrid',
      },
    ],
  },
  {
    id: 'module-1',
    title: 'Module 1 · Sales & CRM',
    items: [
      {
        id: 'leads',
        name: 'Leads & Enquiries',
        desc: 'Auto-assign to Consultant · Qualify · Import/Export',
        icon: 'Users',
        badge: 'Live',
      },
      {
        id: 'followups',
        name: 'Follow-up Register',
        desc: 'Failed calls · Callbacks · Direct WhatsApp/Call',
        icon: 'PhoneForwarded',
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
        desc: 'Customer PO · Manager SO · Physical stock check',
        icon: 'ShoppingCart',
      },
    ],
  },
  {
    id: 'procurement',
    title: 'Module 2 · Procurement & Inventory',
    items: [
      {
        id: 'procurement-dashboard',
        name: 'Procurement Dashboard',
        desc: 'Procurement metrics, requisitions & stock value',
        icon: 'LayoutGrid',
      },
      {
        id: 'vendors',
        name: 'Vendor Directory',
        desc: 'Vendor profiles, onboarding & performance',
        icon: 'Users',
      },
      {
        id: 'purchase-requests',
        name: 'Requisitions & RFQs',
        desc: 'Purchase requisitions and RFQ quotes',
        icon: 'ShoppingCart',
      },
      {
        id: 'purchase-orders',
        name: 'Purchase Orders',
        desc: 'PO tracking, approval & status updates',
        icon: 'Layers',
      },
      {
        id: 'goods-receipts',
        name: 'Goods Receipts (GRN)',
        desc: 'Material inward verification & gate pass',
        icon: 'Truck',
      },
      {
        id: 'inventory',
        name: 'Inventory & Stock',
        desc: 'Real-time stock ledger, batch tracking & adjustments',
        icon: 'Box',
      },
    ],
  },
  {
    id: 'manufacturing',
    title: 'Module 3 · Manufacturing & Engineering',
    items: [
      {
        id: 'engineering',
        name: 'M3 · Product & Engineering',
        desc: 'CAD blueprints, BOM composition & technical reports',
        icon: 'Layers',
        badge: 'M3',
        active: false,
      },
    ],
  },
]

export const currentUser = {
  name: 'Rukhsar Shaikh',
  role: 'BACK_OFFICER',
  initials: 'RS',
}
