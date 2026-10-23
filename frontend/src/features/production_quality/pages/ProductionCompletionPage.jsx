import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import ModuleHeader from "../components/shared/ModuleHeader";
import Card from "../../../components/common/Card";
import StatusBadge from "../../../components/common/StatusBadge";
import Loader from "../../../components/common/Loader";
import qualityService from "../services/qualityService";

export default function ProductionCompletionPage() {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [warehouseLocation, setWarehouseLocation] = useState("");

  const loadCompletedOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await qualityService.getInspectionReport();
      const raw = res?.data || (Array.isArray(res) ? res : []);

      setCompletedOrders(raw);
    } catch (err) {
      console.error("Failed to load completed production orders:", err);
      setError(err?.message || "Failed to load completion report from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompletedOrders();
  }, [loadCompletedOrders]);

  const handleWarehouseHandover = async (id) => {
    if (!warehouseLocation.trim()) {
      setError("Enter a finished goods warehouse location before releasing inventory.");
      return;
    }

    setActionLoadingId(id);
    setError(null);
    try {
      await qualityService.releaseFinishedGoods({
        inspectionId: id,
        warehouseLocation: warehouseLocation.trim(),
      });
      await loadCompletedOrders();
      alert("Goods successfully received by Finished Goods Warehouse and inventoried!");
    } catch (err) {
      alert("Handover failed: " + (err?.message || "Error communicating with server."));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Production Completion & Warehouse Handover (M4.3)"
        subtitle="Review inspection results and record finished-goods inventory releases."
        breadcrumbs={[
          { label: "Production & Quality", to: "/production-quality/planning" },
          { label: "Production Completion" },
        ]}
      />

      {/* Critical Business Rule Banner */}
      <div className="p-4 bg-[#10182f] border-l-4 border-l-[#3b82f6] border border-[#1e2a4a] rounded-xl text-xs text-[#f1f5f9] flex items-start gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-[#3b82f6] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm text-[#f1f5f9]">Finished Goods Release Rule</p>
          <p className="mt-0.5 text-[#94a3b8] leading-relaxed">
            Only inspections with PASS status and accepted quantity can be released. The supplied warehouse location is recorded with the inventory movement.
          </p>
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
            onClick={loadCompletedOrders}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Inspection and finished-goods status */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <p className="text-xs text-[#94a3b8] font-medium">Released to Finished Goods</p>
          <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">
            {completedOrders
              .filter((inspection) => inspection.status === "RELEASED")
              .reduce((sum, inspection) => sum + Number(inspection.acceptedQuantity || 0), 0)}{" "}
            Units
          </h3>
          <span className="text-[10px] text-emerald-400 font-medium">From released inspections</span>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <p className="text-xs text-[#94a3b8] font-medium">Awaiting Finished Goods Release</p>
          <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">
            {completedOrders
              .filter((inspection) => inspection.status === "PASS")
              .reduce((sum, inspection) => sum + Number(inspection.acceptedQuantity || 0), 0)}{" "}
            Units
          </h3>
          <span className="text-[10px] text-blue-400 font-medium">From passed inspections</span>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs text-[#94a3b8] font-medium">Held or Failed Inspections</p>
          <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">
            {completedOrders.filter((inspection) => ["HOLD", "FAIL"].includes(inspection.status)).length} Inspections
          </h3>
          <span className="text-[10px] text-amber-400 font-medium">From inspection status</span>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <p className="text-xs text-[#94a3b8] font-medium">Quality Inspections</p>
          <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">
            {completedOrders.length}
          </h3>
          <span className="text-[10px] text-purple-400 font-medium">Records in database</span>
        </Card>
      </div>

      {/* Completion & Handover Ledger */}
      <Card
        title="Inspection and Finished Goods Ledger"
        subtitle="Quality status and persisted finished goods releases"
      >
        {loading ? (
          <div className="py-12 text-center">
            <Loader label="Loading inspection records..." size="md" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0b1329] text-[#94a3b8] uppercase font-semibold border-b border-[#1e2a4a]">
                <tr>
                  <th className="py-2.5 px-3">Inspection #</th>
                  <th className="py-2.5 px-3">Work Order #</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-right">Accepted / Inspected</th>
                  <th className="py-2.5 px-3">Inspection Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Finished Goods</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a4a]">
                {completedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#94a3b8]">
                      No inspection records found in the database.
                    </td>
                  </tr>
                ) : (
                  completedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3">
                        <Link to={`/production-quality/inspections/${order.id}`} className="font-mono font-semibold text-[#3b82f6] hover:underline">
                          {order.inspectionNo || "—"}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#f1f5f9]">
                        {order.workOrderNo || "—"}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#f1f5f9]">
                        {order.productName || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#f1f5f9]">
                        {Number(order.acceptedQuantity || 0)} / {Number(order.inspectedQuantity || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-[#94a3b8]">
                        {order.inspectedAt || order.createdAt
                          ? new Date(order.inspectedAt || order.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-2.5 px-3"><StatusBadge status={order.status || "—"} /></td>
                      <td className="py-2.5 px-3 text-right">
                        {order.status === "PASS" ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                            <select
                              value={warehouseLocation}
                              onChange={(event) => setWarehouseLocation(event.target.value)}
                              aria-label="Finished goods warehouse location"
                              className="w-full sm:w-48 px-2 py-1 rounded border border-[#1e2a4a] bg-[#0a1020] text-[#f1f5f9] text-xs focus:outline-none focus:border-[#3b82f6]"
                            >
                              <option value="">-- Select FG Bay --</option>
                              <option value="FG-WH-BAY-01 · Finished Goods Main">FG-WH-BAY-01 · Main Bay</option>
                              <option value="FG-WH-BAY-02 · Export Buffer">FG-WH-BAY-02 · Export Buffer</option>
                              <option value="FG-WH-BAY-03 · Local Dispatch">FG-WH-BAY-03 · Local Dispatch</option>
                              <option value="QC-HOLD-BAY · Quarantine Inspection Zone">QC-HOLD-BAY · Quarantine</option>
                            </select>
                            <button
                              type="button"
                              disabled={actionLoadingId === order.id || !warehouseLocation.trim()}
                              onClick={() => handleWarehouseHandover(order.id)}
                              className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#3b82f6] text-white hover:bg-blue-600 disabled:opacity-50 transition cursor-pointer"
                            >
                              {actionLoadingId === order.id ? "Releasing..." : "Release"}
                            </button>
                          </div>
                        ) : order.status === "RELEASED" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Released
                          </span>
                        ) : (
                          <span className="text-[#64748b]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

    </div>
  );
}
