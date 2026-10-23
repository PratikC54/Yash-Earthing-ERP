import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import DataTable from "../../../../components/common/DataTable";
import StatusBadge from "../../../../components/common/StatusBadge";
import ProductionProgress from "./ProductionProgress";
import { formatDate } from "../../utils/productionQualityHelpers";

/**
 * WorkOrderTable Component with Yash Group ERP dark-blue theme
 */
export default function WorkOrderTable({
  workOrders = [],
  loading = false,
  onRowClick,
}) {
  const columns = [
    {
      header: "WO Number",
      key: "workOrderNo",
      render: (row) => (
        <div className="font-mono font-bold text-[#3B82F6] flex items-center gap-1 group-hover:underline">
          <span>{row.workOrderNo || row.workOrderNumber}</span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
        </div>
      ),
    },
    {
      header: "Product & Spec",
      key: "product",
      render: (row) => {
        const prod = row.bomRevision?.product;
        return (
          <div>
            <div className="font-semibold text-[#f1f5f9] truncate max-w-[220px]">
              {prod?.name || row.productName || "—"}
            </div>
            <div className="text-[11px] text-[#94a3b8]">
              BOM: {row.bomReference || row.bomRevision?.revision || "—"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Customer & SO",
      key: "salesOrder",
      render: (row) => (
        <div>
          <div className="font-medium text-[#f1f5f9]">
            {row.salesOrder?.customer?.name || row.customer || "—"}
          </div>
          <div className="text-[11px] text-[#94a3b8]">
            SO: {row.salesOrder?.orderNumber || "—"}
          </div>
        </div>
      ),
    },
    {
      header: "Progress",
      key: "progress",
      render: (row) => (
        <ProductionProgress
          produced={row.producedQuantity || 0}
          planned={row.plannedQuantity || 0}
        />
      ),
    },
    {
      header: "Priority",
      key: "priority",
      render: (row) => <StatusBadge status={row.priority} />,
    },
    {
      header: "Status",
      key: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Completion",
      key: "dueDate",
      render: (row) => (
        <span className="font-mono text-[11px] text-[#94a3b8]">
          {formatDate(row.plannedCompletionDate || row.dueDate)}
        </span>
      ),
    },
    {
      header: "",
      key: "action",
      align: "right",
      render: (row) => (
        <Link
          to={`/production/work-orders/${row.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0a1020] hover:bg-slate-800/40 text-[#94a3b8] hover:text-[#f1f5f9] border border-[#1e2a4a] text-xs font-semibold transition"
        >
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={workOrders}
      loading={loading}
      emptyMessage="No active work orders found on the shop floor."
      onRowClick={onRowClick}
    />
  );
}
