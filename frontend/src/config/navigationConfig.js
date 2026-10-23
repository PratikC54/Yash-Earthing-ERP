/**
 * Yash Group ERP - Centralized Navigation Configuration
 * Optimized for Production & Quality Module
 */

export const navigationSections = [
  {
    id: "module-production-quality",
    title: "",
    items: [
      {
        id: "production-quality",
        label: "Production & Quality",
        icon: "Factory",
        badge: "M4",
        path: "/pq/dashboard",
        aliases: ["/pq/dashboard", "/dashboard", "/production-quality", "/production"],
        children: [
          {
            id: "planning",
            label: "Planning",
            path: "/production-quality/planning",
            aliases: [
              "/production/planning",
              "/production-quality/work-orders",
              "/production/work-orders",
              "/production-quality/material-issuance",
              "/production-quality/completion",
            ],
            icon: "Calendar",
          },
          {
            id: "manufacturing",
            label: "Manufacturing",
            path: "/production-quality/manufacturing",
            aliases: [
              "/production-quality/shop-floor",
              "/production/manufacturing",
              "/production/shop-floor",
              "/production/tracking",
            ],
            icon: "Activity",
          },
          {
            id: "quality",
            label: "Quality",
            path: "/production-quality/quality",
            aliases: [
              "/production-quality/inspections",
              "/production/quality",
              "/production/quality-inspection",
              "/quality/inspections",
              "/quality/capa",
              "/production-quality/rework",
            ],
            icon: "ShieldAlert",
          },
          {
            id: "dispatch",
            label: "Dispatch",
            path: "/pq/dispatch",
            aliases: [
              "/production-quality/dispatch",
              "/production/dispatch",
              "/dispatch",
            ],
            icon: "Truck",
          },
        ],
      },
    ],
  },
];

// Flat array for quick path matching & breadcrumbs
export const allNavItems = navigationSections.flatMap((section) => {
  const items = [];
  section.items.forEach((item) => {
    if (item.path) {
      items.push({ ...item, sectionTitle: section.title, parentLabel: null });
    }
    if (item.children) {
      item.children.forEach((child) => {
        items.push({
          ...child,
          sectionTitle: section.title,
          parentLabel: item.label,
          parentId: item.id,
        });
      });
    }
  });
  return items;
});

// Helper to find navigation item by current pathname
export const findNavItemByPath = (pathname) => {
  const cleanPath = pathname.replace(/\/$/, "");

  if (
    cleanPath === "/pq/dashboard" ||
    cleanPath === "/dashboard" ||
    cleanPath === "/erp/dashboard" ||
    cleanPath === "/production-quality" ||
    cleanPath === "/production" ||
    cleanPath === ""
  ) {
    return {
      id: "production-dashboard",
      label: "Production Dashboard",
      path: "/pq/dashboard",
      parentLabel: "Production & Quality",
      sectionTitle: "PRODUCTION & QUALITY",
      icon: "Gauge",
    };
  }

  return (
    allNavItems.find(
      (item) =>
        item.path === cleanPath ||
        (item.aliases && item.aliases.includes(cleanPath)) ||
        (item.path && cleanPath.startsWith(item.path)) ||
        (item.aliases && item.aliases.some((alias) => cleanPath.startsWith(alias)))
    ) || {
      id: "production-quality",
      label: "Production & Quality",
      path: "/pq/dashboard",
      parentLabel: null,
      icon: "Factory",
    }
  );
};
