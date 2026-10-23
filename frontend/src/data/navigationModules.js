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
        id: 'engineering',
        name: 'M3 · Product & Engineering',
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
