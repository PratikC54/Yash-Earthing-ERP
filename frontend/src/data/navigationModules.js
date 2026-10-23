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
    id: 'module-3',
    title: 'Module 3 · Product & Engineering',
    items: [
      {
        id: 'm3-products',
        name: 'Product & Spec Master',
        desc: 'Master SKU Catalog · Specs · Technical Attributes',
        icon: 'Box',
        badge: 'Live',
      },
      {
        id: 'm3-boms',
        name: 'BOM & Costing',
        desc: 'Multilevel BOMs · Scrap Allowances · Frozen Costs',
        icon: 'ShieldCheck',
      },
      {
        id: 'm3-drawings',
        name: 'Controlled Drawings',
        desc: 'CAD Blueprints · DXF Downloads · Inspection Sheets',
        icon: 'FileText',
      },
    ],
  },
  {
    id: 'module-6',
    title: 'Module 6 · Finance & Commercial',
    items: [
      {
        id: 'm6-invoices',
        name: 'Billing & Receivables',
        desc: 'GST Tax Invoices · Receipts · Ageing Register',
        icon: 'Landmark',
        badge: 'Live',
      },
      {
        id: 'm6-payables',
        name: 'Payables & Expenses',
        desc: '3-Way Match · Vendor Bills · PO Checks',
        icon: 'ShoppingCart',
      },
      {
        id: 'm6-costing',
        name: 'Costing, Ledger & MIS',
        desc: 'Job Margin · General Ledger · Profitability Analysis',
        icon: 'TrendingUp',
      },
      {
        id: 'm6-settings',
        name: 'Financial Settings',
        desc: 'Company GSTIN · Bank Accounts · Statutory Compliance',
        icon: 'Settings',
      },
    ],
  },
]

export const currentUser = {
  name: 'Rukhsar Shaikh',
  role: 'BACK_OFFICER',
  initials: 'RS',
}
