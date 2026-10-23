// Navigation configuration with single dashboard module (no submodules)
// Easily extensible: additional modules can still be added dynamically via UI

export const initialNavSections = [
  {
    id: 'procurement',
    title: 'PROCUREMENT & INVENTORY',
    items: [
      {
        id: 'procurement-dashboard',
        name: 'Procurement Dashboard',
        icon: 'LayoutGrid',
        active: true,
      },
      {
        id: 'vendors',
        name: 'Vendor Directory',
        icon: 'Users',
      },
      {
        id: 'purchase-requests',
        name: 'Requisitions & RFQs',
        icon: 'ShoppingCart',
      },
      {
        id: 'purchase-orders',
        name: 'Purchase Orders',
        icon: 'Layers',
      },
      {
        id: 'goods-receipts',
        name: 'Goods Receipts (GRN)',
        icon: 'Truck',
      },
      {
        id: 'inventory',
        name: 'Inventory & Stock',
        icon: 'Box',
      },
    ],
  },
]

export const currentUser = {
  name: 'Dana Castellanos',
  role: 'Operations Controller',
  initials: 'DC',
}
