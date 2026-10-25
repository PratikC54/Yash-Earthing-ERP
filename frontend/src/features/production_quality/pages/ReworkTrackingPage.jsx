import React, { useState, useEffect, useCallback } from "react";
import { ArrowRight, Search, Filter, AlertCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import ModuleHeader from "../components/shared/ModuleHeader";
import Card from "../../../components/common/Card";
import StatusBadge from "../../../components/common/StatusBadge";
import Loader from "../../../components/common/Loader";
import KpiSection from "../../../components/common/KpiSection";
import qualityService from "../services/qualityService";

export default function ReworkTrackingPage() {
  const [search, setSearch] = useState("");
  const [filterStation, setFilterStation] = useState("ALL");
  const [reworkBatches, setReworkBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReworkBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ncrRes, insRes, capaRes] = await Promise.all([
        qualityService.listNonConformances(),
        qualityService.getInspectionReport(),
        qualityService.listCAPARecords(),
      ]);

      const ncrs = ncrRes?.data || (Array.isArray(ncrRes) ? ncrRes : []);
      const insList = insRes?.data || (Array.isArray(insRes) ? insRes : []);
      const capas = capaRes?.data || (Array.isArray(capaRes) ? capaRes : []);

      const capaBatches = capas.map((c) => ({
        id: c.capaNo || String(c.id),
        inspectionId: c.inspectionId,
        batchTag: c.capaNo,
        workOrderNo: c.workOrder?.workOrderNo || "—",
        product: c.workOrder?.bomRevision?.product?.name || "—",
        quantity: Number(c.quantityAffected) || 0,
        station: c.responsiblePerson || "—",
        defectReason: c.defectDescription || "—",
        loggedAt: c.createdAt || null,
        status: c.status || "—",
        assignedOperator: c.responsiblePerson || "—",
      }));

      const reworkNcrs = ncrs
        .filter((ncr) => ncr.proposedAction === "REWORK")
        .map((ncr) => ({
          id: ncr.ncrId || String(ncr.id),
          inspectionId: ncr.inspectionId,
          batchTag: ncr.batchTag || "",
          workOrderNo: ncr.workOrderNo || "",
          product: ncr.productName || "",
          quantity: Number(ncr.quantity) || 0,
          station: ncr.station || "",
          defectReason: ncr.defectType || ncr.description || "",
          loggedAt: ncr.createdAt || null,
          status: ncr.status || "",
          assignedOperator: ncr.assignedOperator || "",
        }));

      // Also include any inspections on HOLD
      const holdInspections = insList
        .filter((ins) => ins.status === "HOLD" || ins.status === "REWORK")
        .map((ins) => ({
          id: `inspection-${ins.id}`,
          inspectionId: ins.id,
          batchTag: ins.batchTag || "",
          workOrderNo: ins.workOrderNo || "",
          product: ins.productName || "",
          quantity: Number(ins.rejectedQuantity || ins.inspectedQuantity) || 0,
          station: ins.station || "",
          defectReason: ins.defectType || ins.description || "",
          loggedAt: ins.inspectedAt || ins.createdAt || null,
          status: ins.status || "",
          assignedOperator: ins.assignedOperator || "",
        }));

      const combined = [...capaBatches, ...reworkNcrs, ...holdInspections];
      setReworkBatches(combined);
    } catch (err) {
      console.error("Failed to load rework batches:", err);
      setError(err?.message || "Failed to load rework queue from the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReworkBatches();
  }, [loadReworkBatches]);

  const filtered = reworkBatches.filter((b) => {
    const matchesStation = filterStation === "ALL" || b.station.toLowerCase().includes(filterStation.toLowerCase());
    const matchesText =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.workOrderNo.toLowerCase().includes(search.toLowerCase()) ||
      b.product.toLowerCase().includes(search.toLowerCase());
    return matchesStation && matchesText;
  });

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Rework Tracking & Corrective Line Operations (M4.3)"
        subtitle="Track batches tagged during quality inspection for corrective re-processing, preserving original work order parentage."
        breadcrumbs={[
          { label: "Production & Quality", to: "/production-quality/planning" },
          { label: "Rework Tracking" },
        ]}
      />

      {/* Rework KPI Overview */}
      <KpiSection title="Rework KPIs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-amber-500">
            <p className="text-xs text-[#94a3b8] font-medium">Batches in Rework</p>
            <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">
              {reworkBatches.filter((b) => ["OPEN", "IN_PROGRESS", "HOLD"].includes(b.status)).length} Active Batches
            </h3>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <p className="text-xs text-[#94a3b8] font-medium">Ready for Re-Inspection</p>
            <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">
              {reworkBatches.filter((b) => b.status === "READY_FOR_REINSPECTION" || b.status === "COMPLETED").length} Batches
            </h3>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <p className="text-xs text-[#94a3b8] font-medium">Rework Yield Recovery</p>
            <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">—</h3>
          </Card>
        </div>
      </KpiSection>

      {/* Filter Toolbar */}
      <div className="bg-[#10182f] p-4 rounded-xl border border-[#1e2a4a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, WO#, product..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#1e2a4a] text-xs bg-[#0a1020] text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#3b82f6]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#64748b]" />
          <select
            value={filterStation}
            onChange={(e) => setFilterStation(e.target.value)}
            className="text-xs border border-[#1e2a4a] rounded-lg px-2.5 py-1.5 bg-[#0a1020] text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]"
          >
            <option value="ALL">All Corrective Stations</option>
            {[...new Set(reworkBatches.map((batch) => batch.station).filter((station) => station && station !== "—"))].map((station) => (
              <option key={station} value={station}>{station}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadReworkBatches}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Rework Batches Table */}
      <Card title="Active Rework Queue" subtitle="Maintain parent-child traceability to original job orders">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0b1329] text-[#94a3b8] uppercase font-semibold border-b border-[#1e2a4a]">
              <tr>
                <th className="py-2.5 px-3">Rework ID</th>
                <th className="py-2.5 px-3">Parent Work Order</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3">Station & Assigned Tech</th>
                <th className="py-2.5 px-3">Defect Reason</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {loading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={`skel-rw-${rIdx}`} className="animate-pulse">
                    <td className="py-2.5 px-3"><div className="h-4 w-16 bg-slate-200/80 rounded" /></td>
                    <td className="py-2.5 px-3"><div className="h-4 w-20 bg-slate-200/70 rounded" /></td>
                    <td className="py-2.5 px-3"><div className="h-4 w-32 bg-slate-200/80 rounded" /></td>
                    <td className="py-2.5 px-3 text-right"><div className="h-4 w-12 bg-slate-200/80 rounded ml-auto" /></td>
                    <td className="py-2.5 px-3"><div className="h-4 w-28 bg-slate-200/60 rounded" /></td>
                    <td className="py-2.5 px-3"><div className="h-4 w-24 bg-slate-200/60 rounded" /></td>
                    <td className="py-2.5 px-3"><div className="h-4 w-16 bg-slate-200/70 rounded-full" /></td>
                    <td className="py-2.5 px-3 text-right"><div className="h-4 w-12 bg-slate-200/60 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#94a3b8]">
                      No rework records found in the database.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{b.id}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#3b82f6]">
                        {b.workOrderNo}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#f1f5f9]">{b.product}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#f1f5f9]">{b.quantity} PCS</td>
                      <td className="py-2.5 px-3">
                        <div className="text-[#f1f5f9] font-medium">{b.station}</div>
                        <div className="text-[10px] text-[#64748b]">{b.assignedOperator}</div>
                      </td>
                      <td className="py-2.5 px-3 text-[#94a3b8] max-w-xs truncate">{b.defectReason}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {b.inspectionId && (
                          <Link
                            to={`/production-quality/inspections/${b.inspectionId}`}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition inline-flex items-center gap-1"
                          >
                            <span>Open Inspection</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </Card>
    </div>
  );
}
