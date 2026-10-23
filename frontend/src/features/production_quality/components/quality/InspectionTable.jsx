import React from "react";
import { Link } from "react-router-dom";
import DataTable from "../../../../components/common/DataTable";
import StatusBadge from "../../../../components/common/StatusBadge";
import { formatDate, formatQuantity } from "../../utils/productionQualityHelpers";

/**
 * InspectionTable Component with Tailwind CSS
 */
export default function InspectionTable({
  inspections = [],
  loading = false,
  onInspect,
  _onApprove,
  onRelease,
}) {
  const columns = [
    {
      header: "Inspection #",
      key: "inspectionNo",
      render: (row) => (
        <Link
          to={`/production-quality/inspections/${row.id}`}
          className="font-semibold text-[#3b82f6] hover:underline flex items-center gap-1"
        >
          <span>{row.inspectionNo}</span>
        </Link>
      ),
    },
    {
      header: "Work Order",
      key: "workOrder",
      render: (row) => (
        <div>
          <div className="font-medium text-[#f1f5f9]">
            {row.workOrder?.workOrderNo || "—"}
          </div>
          <div className="text-[11px] text-[#94a3b8]">
            {row.workOrder?.bomRevision?.product?.name || "—"}
          </div>
        </div>
      ),
    },
    {
      header: "Inspected / Total",
      key: "inspectedQuantity",
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-[#f1f5f9]">
            {formatQuantity(row.inspectedQuantity)}
          </div>
          <div className="text-[11px] text-[#94a3b8]">
            Passed: {row.acceptedQuantity || 0} · Rej: {row.rejectedQuantity || 0}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      key: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Inspection Date",
      key: "inspectedAt",
      render: (row) => (
        <span className="text-xs text-[#94a3b8]">
          {row.inspectedAt ? formatDate(row.inspectedAt) : "Pending Inspection"}
        </span>
      ),
    },
    {
      header: "Actions",
      key: "actions",
      align: "right",
      render: (row) => {
        const isPending = row.status === "PENDING" || row.status === "NOT_STARTED";
        const isApproved = row.status === "PASS";
        const isReleased = row.status === "RELEASED";

        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {isPending && onInspect && (
              <button
                type="button"
                onClick={() => onInspect(row)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#3b82f6] text-white hover:bg-blue-600 transition cursor-pointer"
              >
                Inspect
              </button>
            )}

            {isApproved && onRelease && (
              <button
                type="button"
                onClick={() => onRelease(row)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer"
              >
                Release to FG
              </button>
            )}

            {isReleased && (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Inventoried
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={inspections}
      loading={loading}
      emptyMessage="No pending inspections in queue"
    />
  );
}
