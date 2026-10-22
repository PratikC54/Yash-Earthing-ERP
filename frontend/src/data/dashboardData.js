export const kpiMetrics = [
  {
    id: 'on-time-production',
    title: 'ON-TIME PRODUCTION',
    value: '94.2%',
    change: '+1.8 pts',
    changeType: 'positive',
    subtext: 'vs. 92.4% last quarter',
    iconType: 'sparkles',
  },
  {
    id: 'inventory-value',
    title: 'INVENTORY VALUE',
    value: '$48.6M',
    change: '+3.1%',
    changeType: 'positive',
    subtext: 'Across 6 warehouses',
    iconType: 'cube',
  },
  {
    id: 'open-purchase-orders',
    title: 'OPEN PURCHASE ORDERS',
    value: '312',
    change: '+14',
    changeType: 'positive',
    subtext: '$6.2M committed spend',
    iconType: 'cart',
  },
  {
    id: 'cash-position',
    title: 'CASH POSITION',
    value: '$12.4M',
    change: '-2.4%',
    changeType: 'negative',
    subtext: 'Operating accounts',
    iconType: 'bank',
  },
]

export const productionChartData = [
  { month: 'Oct', plan: 72, output: 68 },
  { month: 'Nov', plan: 78, output: 81 },
  { month: 'Dec', plan: 79, output: 75 },
  { month: 'Jan', plan: 76, output: 78 },
  { month: 'Feb', plan: 83, output: 86 },
  { month: 'Mar', plan: 87, output: 84 },
  { month: 'Apr', plan: 92, output: 95 },
  { month: 'May', plan: 88, output: 91 },
]

export const warehouseUtilizationData = [
  {
    id: 'rotterdam',
    name: 'Rotterdam DC-01',
    percentage: 88,
    status: 'optimal',
  },
  {
    id: 'chicago',
    name: 'Chicago DC-04',
    percentage: 74,
    status: 'normal',
  },
  {
    id: 'singapore',
    name: 'Singapore DC-07',
    percentage: 63,
    status: 'normal',
  },
  {
    id: 'monterrey',
    name: 'Monterrey DC-02',
    percentage: 41,
    status: 'low',
  },
]

export const recentProductionOrders = [
  {
    orderId: 'PRD-20481',
    productName: 'Hydraulic Pump Assembly',
    sku: 'SKU-HP-220',
    quantity: '1,200',
    workCenter: 'Line A · Welding',
    status: 'Running',
    statusColor: 'blue',
    dueDate: 'Jun 6',
  },
  {
    orderId: 'PRD-20482',
    productName: 'Industrial Stator Core 45kW',
    sku: 'SKU-SC-450',
    quantity: '650',
    workCenter: 'Line B · Stamping',
    status: 'Running',
    statusColor: 'blue',
    dueDate: 'Jun 8',
  },
  {
    orderId: 'PRD-20483',
    productName: 'Precision Copper Rotor Shaft',
    sku: 'SKU-RS-108',
    quantity: '2,400',
    workCenter: 'Line C · CNC Turning',
    status: 'Scheduled',
    statusColor: 'gray',
    dueDate: 'Jun 11',
  },
  {
    orderId: 'PRD-20484',
    productName: 'Terminal Junction Box IP67',
    sku: 'SKU-JB-090',
    quantity: '890',
    workCenter: 'Line A · Assembly',
    status: 'Quality Check',
    statusColor: 'amber',
    dueDate: 'Jun 14',
  },
]
