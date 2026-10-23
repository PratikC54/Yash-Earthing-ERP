// Navigation modules configuration strictly for Module 1 (Sales, CRM & Order Management)
// Navigation configuration with single dashboard module and Module 3
// Easily extensible: additional modules can still be added dynamically via UI

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
    title: 'Module 1 · Sales, CRM & Order',
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
    id: 'manufacturing',
    title: 'MANUFACTURING & ENGINEERING',
    items: [
      {
        id: 'm3-products',
        name: 'M3.1 · Products & Specs',
        desc: 'Master SKU catalog, specs & technical attributes',
        icon: 'Box',
        badge: 'Live',
      },
      {
        id: 'm3-boms',
        name: 'M3.2 · BOM & Costing',
        desc: 'Multilevel BOMs, scrap allowances & frozen costs',
        icon: 'ShieldCheck',
      },
      {
        id: 'm3-drawings',
        name: 'M3.3 · Controlled Drawings',
        desc: 'CAD blueprints, DXF downloads & inspection sheets',
        icon: 'FileText',
      },
    ],
  },
  {
    id: 'commercial',
    title: 'COMMERCIAL & FINANCE',
    items: [
      {
        id: 'm6-invoices',
        name: 'M6.1 · Billing & Receivables',
        desc: 'GST tax invoices, receipts & ageing register',
        icon: 'Landmark',
        badge: 'Live',
      },
      {
        id: 'm6-payables',
        name: 'M6.2 · Payables & Expenses',
        desc: '3-way match, vendor bills & PO checks',
        icon: 'ShoppingCart',
      },
      {
        id: 'm6-costing',
        name: 'M6.3 · Costing, Ledger & MIS',
        desc: 'Job margin, ledger & profitability analysis',
        icon: 'TrendingUp',
      },
      {
        id: 'm6-settings',
        name: 'M6.4 · Financial Settings',
        desc: 'Company GSTIN, bank accounts & compliance',
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
