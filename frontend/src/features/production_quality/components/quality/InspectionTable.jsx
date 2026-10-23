import React from "react";
import { Link } from "react-router-dom";
import { UserCheck, UserPlus, CheckCircle2 } from "lucide-react";
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
  onAssign,
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
      header: "Inspector",
      key: "assignedInspector",
      render: (row) => {
        const inspectorName = row.assignedInspector?.name || row.decisionOfficer;
        if (inspectorName && row.status !== "PENDING_ASSIGNMENT") {
          return (
            <span className="text-xs text-[#f1f5f9] font-medium flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>{inspectorName}</span>
            </span>
          );
        }
        return (
          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
            Unassigned
          </span>
        );
      },
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
        const isUnassigned = row.status === "PENDING_ASSIGNMENT" || !row.assignedInspectorId;
        const isAssigned = row.status === "ASSIGNED" || row.status === "PENDING" || row.status === "IN_PROGRESS";
        const isApproved = row.status === "PASS";
        const isReleased = row.status === "RELEASED";

        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {isUnassigned && onAssign && (
              <button
                type="button"
                onClick={() => onAssign(row)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition cursor-pointer flex items-center gap-1"
                title="Assign Quality Inspector"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign</span>
              </button>
            )}

            {!isUnassigned && isAssigned && onInspect && (
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
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Release to FG</span>
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
      emptyMessage="No pending QA inspections in the pipeline."
    />
  );
}
