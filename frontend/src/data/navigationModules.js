// Navigation configuration with single dashboard module and Module 3
// Easily extensible: additional modules can still be added dynamically via UI

export const initialNavSections = [
  {
    id: 'overview',
    title: 'OVERVIEW',
    items: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'LayoutGrid',
        active: true,
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
  name: 'Pratik Senapati',
  role: 'Head of Engineering',
  initials: 'PS',
}
