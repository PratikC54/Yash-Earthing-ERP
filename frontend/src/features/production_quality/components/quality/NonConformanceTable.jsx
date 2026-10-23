import React from "react";
import DataTable from "../../../../components/common/DataTable";
import { formatDate } from "../../utils/productionQualityHelpers";

/**
 * NonConformanceTable Component with Tailwind CSS
 */
export default function NonConformanceTable({
  ncrs = [],
  loading = false,
  _onResolve,
}) {
  const columns = [
    {
      header: "NCR Ref",
      key: "ncrId",
      render: (row) => (
        <span className="font-semibold text-red-400">{row.ncrId || `NCR-${row.id}`}</span>
      ),
    },
    {
      header: "Defect Type",
      key: "defectType",
      render: (row) => (
        <div>
          <div className="font-medium text-[#f1f5f9]">{row.defectType}</div>
          <div className="text-[11px] text-[#94a3b8] truncate max-w-xs">{row.description}</div>
        </div>
      ),
    },
    {
      header: "Severity",
      key: "severity",
      render: (row) => {
        const colors = {
          CRITICAL: "bg-red-500/10 text-red-400 border-red-500/30",
          MAJOR: "bg-orange-500/10 text-orange-400 border-orange-500/30",
          MINOR: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        };
        return (
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
              colors[row.severity] || "bg-[#0a1020] text-[#94a3b8] border-[#1e2a4a]"
            }`}
          >
            {row.severity}
          </span>
        );
      },
    },
    {
      header: "Immediate Action",
      key: "immediateAction",
      render: (row) => (
        <span className="text-xs text-[#f1f5f9]">{row.immediateAction || row.proposedAction || "Quarantined"}</span>
      ),
    },
    {
      header: "Root Cause",
      key: "rootCause",
      render: (row) => (
        <span className="text-xs text-[#94a3b8]">{row.rootCause || "—"}</span>
      ),
    },
    {
      header: "Logged Date",
      key: "loggedAt",
      render: (row) => (
        <span className="text-xs text-[#94a3b8]">{formatDate(row.loggedAt || row.createdAt)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={ncrs}
      loading={loading}
      emptyMessage="No open Non-Conformance Reports (NCR) recorded"
    />
  );
}
