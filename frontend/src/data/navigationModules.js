// Navigation configuration with single dashboard module (no submodules)
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
]

export const currentUser = {
  name: 'Dana Castellanos',
  role: 'Operations Controller',
  initials: 'DC',
}
