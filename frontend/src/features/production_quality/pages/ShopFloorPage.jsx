import React, { useState, useEffect, useCallback } from "react";
import { Play, Plus, Clock, ShieldCheck, AlertTriangle, RefreshCw, AlertCircle } from "lucide-react";
import ModuleHeader from "../components/shared/ModuleHeader";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import StatusBadge from "../../../components/common/StatusBadge";
import Loader from "../../../components/common/Loader";
import productionService from "../services/productionService";

export default function ShopFloorPage() {
  const [activeLines, setActiveLines] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDowntimeModalOpen, setIsDowntimeModalOpen] = useState(false);
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);

  // Production Entry Form
  const [entryData, setEntryData] = useState({
    workOrderId: "",
    quantityProduced: "",
    goodQuantity: "",
    rejectedQuantity: "",
    shift: "",
    operatorName: "",
    machineId: "",
    hoursWorked: "",
    notes: "",
  });

  // Transfer to Quality Form
  const [transferData, setTransferData] = useState({
    workOrderId: "",
    quantity: "",
    notes: "",
  });

  // Downtime form
  const [downtimeData, setDowntimeData] = useState({
    workOrderId: "",
    machineId: "",
    reason: "",
    durationMinutes: "",
  });

  // Scrap form
  const [scrapData, setScrapData] = useState({
    workOrderId: "",
    quantity: "",
    reason: "",
  });
  const [refData, setRefData] = useState({
    machines: [
      "Line A · Continuous Coating",
      "Line B · Automated Threading",
      "Line C · Finishing & Inspection",
      "Line D · Chemical Treatment",
      "M-01 CNC Lathe",
      "M-02 Thread Roller",
      "Furnace-01",
    ],
    users: [
      { id: 1, name: "System Administrator" },
      { id: 2, name: "Operator - Line A" },
      { id: 3, name: "Operator - Line B" },
    ],
  });

  useEffect(() => {
    async function fetchRef() {
      try {
        const res = await productionService.getReferenceData();
        const data = res?.data || res;
        if (data && (data.machines || data.users)) {
          setRefData((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Could not fetch ref data for shop floor:", err);
      }
    }
    fetchRef();
  }, []);
  const runningLines = activeLines.filter((line) => line.status === "IN_PROGRESS");
  const selectedTransferLine = activeLines.find(
    (line) => String(line.workOrderId) === String(transferData.workOrderId)
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productionService.getManufacturingDashboard();
      const data = res?.data || {};
      setMetrics(data.metrics || null);
      const orders = data.activeWorkOrders || [];

      if (orders.length > 0) {
        const mappedLines = orders.map((wo) => {
          const producedQty = Number(wo.goodQuantity || 0);
          const transferredQty = Number(
            wo.transferredQuantity ??
              (wo.inspections?.reduce((s, i) => s + Number(i.inspectedQuantity || 0), 0) || 0)
          );
          const availableForTransfer = Number(
            wo.availableForTransfer ?? Math.max(0, producedQty - transferredQty)
          );
          return {
            id: wo.workOrderNo || String(wo.id),
            workOrderId: wo.id,
            station: wo.station || wo.assignedLine || "Unassigned",
            workOrderNo: wo.workOrderNo,
            product: wo.bomRevision?.product?.name || wo.productName || "Product not specified",
            shift: wo.shift || "Not assigned",
            operator: wo.operatorName || "Not assigned",
            targetQty: Number(wo.plannedQuantity || 0),
            producedQty,
            scrapQty: Number(wo.rejectedQuantity || 0),
            transferredQty,
            availableForTransfer,
            status: wo.status,
            machine: wo.machineId || "",
          };
        });
        setActiveLines(mappedLines);

        // Pre-select first work order in forms
        const firstRunningOrder = orders.find((order) => order.status === "IN_PROGRESS");
        if (firstRunningOrder) {
          setEntryData((prev) => ({ ...prev, workOrderId: firstRunningOrder.id }));
          const firstAvail = firstRunningOrder.availableForTransfer ?? 0;
          setTransferData((prev) => ({
            ...prev,
            workOrderId: firstRunningOrder.id,
            quantity: firstAvail > 0 ? firstAvail : "",
          }));
          setDowntimeData((prev) => ({ ...prev, workOrderId: firstRunningOrder.id }));
          setScrapData((prev) => ({ ...prev, workOrderId: firstRunningOrder.id }));
        }
      } else {
        setActiveLines([]);
      }
    } catch (err) {
      console.error("Failed to load manufacturing dashboard:", err);
      setError(err?.message || "Failed to load active shop floor operations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError("");
    try {
      await productionService.recordProductionEntry({
        ...entryData,
        workOrderId: parseInt(entryData.workOrderId, 10),
        quantityProduced: parseFloat(entryData.quantityProduced),
        goodQuantity: parseFloat(entryData.goodQuantity),
        rejectedQuantity: parseFloat(entryData.rejectedQuantity),
      });
      setIsEntryModalOpen(false);
      await loadDashboard();
    } catch (err) {
      setActionError(err?.message || "Failed to log production output.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setActionError("");

    const qty = parseFloat(transferData.quantity);

    if (isNaN(qty) || qty <= 0) {
      setActionError("Please enter a valid positive quantity to transfer.");
      return;
    }

    if (selectedTransferLine && qty > selectedTransferLine.availableForTransfer) {
      setActionError(
        `Only ${selectedTransferLine.availableForTransfer} units remain available for QA. Reduce the transfer quantity or record more good production first.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const dashboardResponse = await productionService.getManufacturingDashboard();
      const latestOrders = dashboardResponse?.data?.activeWorkOrders || [];
      const latestOrder = latestOrders.find(
        (order) => String(order.id) === String(transferData.workOrderId)
      );

      if (!latestOrder) {
        setActionError("This work order is no longer available for transfer. Refresh the shop-floor list and try again.");
        return;
      }

      if (!["IN_PROGRESS", "RELEASED"].includes(latestOrder.status)) {
        setActionError(
          `This work order is ${latestOrder.status} and cannot be transferred to QA.`
        );
        return;
      }

      const availableNow = Number(
        latestOrder.availableForTransfer ??
          Math.max(
            0,
            Number(latestOrder.goodQuantity || 0) -
              (latestOrder.inspections || []).reduce(
                (sum, inspection) => sum + Number(inspection.inspectedQuantity || 0),
                0
              )
          )
      );
      if (qty > availableNow) {
        setActionError(
          `Only ${availableNow} units are currently available for QA. Refresh production output or reduce the transfer quantity.`
        );
        return;
      }

      await productionService.transferToQuality(transferData.workOrderId, {
        quantity: qty,
        notes: transferData.notes,
      });
      setIsTransferModalOpen(false);
      await loadDashboard();
    } catch (err) {
      setActionError(err?.message || "Failed to transfer batch to Quality.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDowntimeSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError("");
    try {
      await productionService.recordDowntime({
        ...downtimeData,
        workOrderId: parseInt(downtimeData.workOrderId, 10),
        durationMinutes: parseInt(downtimeData.durationMinutes, 10),
      });
      setIsDowntimeModalOpen(false);
      await loadDashboard();
    } catch (err) {
      setActionError(err?.message || "Failed to log machine downtime.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScrapSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError("");
    try {
      await productionService.recordScrap({
        ...scrapData,
        workOrderId: parseInt(scrapData.workOrderId, 10),
        quantity: parseFloat(scrapData.quantity),
      });
      setIsScrapModalOpen(false);
      await loadDashboard();
    } catch (err) {
      setActionError(err?.message || "Failed to record scrap quantity.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Shop-Floor Execution & Line Operations (M4.2)"
        subtitle="Live tracking of copper bonding, threading, packing, operator machine hours, output entries, and QA handoffs."
        breadcrumbs={[
          { label: "Production & Quality", to: "/production-quality/planning" },
          { label: "Manufacturing" },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Clock}
              disabled={runningLines.length === 0}
              onClick={() => setIsDowntimeModalOpen(true)}
            >
              Log Downtime
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={AlertTriangle}
              disabled={runningLines.length === 0}
              onClick={() => setIsScrapModalOpen(true)}
            >
              Log Scrap
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              disabled={runningLines.length === 0}
              onClick={() => setIsEntryModalOpen(true)}
            >
              Log Output Entry
            </Button>
          </div>
        }
      />

      {/* Error Alert with Retry */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Live Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <p className="text-xs text-[#94a3b8] font-medium">Assigned / Active Orders</p>
          {loading ? (
            <div className="h-7 w-12 bg-slate-200/80 rounded animate-pulse mt-1" />
          ) : (
            <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">{metrics?.activeWorkOrdersCount ?? activeLines.length}</h3>
          )}
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs text-[#94a3b8] font-medium">In Progress</p>
          {loading ? (
            <div className="h-7 w-12 bg-slate-200/80 rounded animate-pulse mt-1" />
          ) : (
            <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">{metrics?.inProgressCount ?? 0}</h3>
          )}
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <p className="text-xs text-[#94a3b8] font-medium">Released / Ready</p>
          {loading ? (
            <div className="h-7 w-12 bg-slate-200/80 rounded animate-pulse mt-1" />
          ) : (
            <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">{metrics?.readyToStartCount ?? 0}</h3>
          )}
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <p className="text-xs text-[#94a3b8] font-medium">On Hold / Interrupted</p>
          {loading ? (
            <div className="h-7 w-12 bg-slate-200/80 rounded animate-pulse mt-1" />
          ) : (
            <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">{metrics?.onHoldCount ?? 0}</h3>
          )}
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 bg-slate-200/70 rounded" />
                <div className="h-5 w-20 bg-slate-200/60 rounded-full" />
              </div>
              <div className="h-5 w-40 bg-slate-200/80 rounded" />
              <div className="h-3.5 w-60 bg-slate-200/60 rounded" />
              <div className="p-3 rounded-xl bg-[#0a1020] border border-[#1e2a4a] space-y-2">
                <div className="h-3 w-32 bg-slate-200/50 rounded" />
                <div className="h-3 w-44 bg-slate-200/50 rounded" />
              </div>
              <div className="h-9 w-full bg-slate-200/60 rounded-xl" />
            </div>
          ))}
        </div>
      ) : activeLines.length === 0 ? (
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-12 text-center text-xs text-[#94a3b8]">
          No work orders are assigned to shop-floor lines.
        </div>
      ) : (
        /* Live Manufacturing Stations Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {activeLines.map((line) => {
            const progressPct = line.targetQty > 0
              ? Math.min(100, Math.round((line.producedQty / line.targetQty) * 100))
              : 0;
            return (
              <Card key={line.id} className="relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                      {line.id} · {line.shift}
                    </span>
                    <StatusBadge status={line.status} />
                  </div>

                  <h3 className="text-sm font-bold text-[#f1f5f9] mb-1">{line.station}</h3>
                  <p className="text-xs text-[#94a3b8] line-clamp-1 mb-3">{line.product}</p>

                  <div className="p-2.5 rounded-xl bg-[#0a1020] border border-[#1e2a4a] space-y-2 mb-4 text-xs">
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Work Order:</span>
                      <span className="font-mono font-semibold text-[#3b82f6]">{line.workOrderNo}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Machine:</span>
                      <span className="font-medium text-[#f1f5f9]">{line.machine}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Operator:</span>
                      <span className="font-medium text-[#f1f5f9]">{line.operator}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Scrap Logged:</span>
                      <span className="font-semibold text-red-400">{line.scrapQty} units</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Available for QA:</span>
                      <span className={`font-semibold ${line.availableForTransfer > 0 ? "text-emerald-400" : "text-[#64748b]"}`}>
                        {line.availableForTransfer} units
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#94a3b8]">Completion</span>
                      <span className="text-[#3b82f6]">{progressPct}% ({line.producedQty} / {line.targetQty})</span>
                    </div>
                    <div className="w-full bg-[#0a1020] border border-[#1e2a4a] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#3b82f6] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {line.status === "IN_PROGRESS" ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-[#1e2a4a]">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    icon={Play}
                    onClick={() => {
                      setEntryData((prev) => ({ ...prev, workOrderId: line.workOrderId }));
                      setIsEntryModalOpen(true);
                    }}
                  >
                    Log Run
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    icon={ShieldCheck}
                    disabled={line.availableForTransfer <= 0}
                    onClick={() => {
                      const avail = line.availableForTransfer;
                      setTransferData({
                        workOrderId: line.workOrderId,
                        quantity: avail > 0 ? avail : "",
                        notes: `Batch transfer from ${line.workOrderNo} for QC inspection.`,
                      });
                      setActionError("");
                      setIsTransferModalOpen(true);
                    }}
                  >
                    Transfer QA
                  </Button>
                  </div>
                ) : (
                  <p className="pt-3 border-t border-[#1e2a4a] text-xs text-[#94a3b8]">
                    Production actions are available once this work order is in progress.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Production Operation Logs */}
      <Card
        title="Active Shop-Floor Logbook"
        subtitle="Daily shifts, machine utilization, and active batch progress"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0b1329] text-[#94a3b8] uppercase font-semibold border-b border-[#1e2a4a]">
              <tr>
                <th className="py-2.5 px-3">Work Order</th>
                <th className="py-2.5 px-3">Station / BOM</th>
                <th className="py-2.5 px-3">Shift</th>
                <th className="py-2.5 px-3 text-right">Target Qty</th>
                <th className="py-2.5 px-3 text-right">Good Qty</th>
                <th className="py-2.5 px-3 text-right">Scrap Qty</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {activeLines.map((line) => (
                <tr key={line.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#3b82f6]">{line.workOrderNo}</td>
                  <td className="py-2.5 px-3 font-medium text-[#f1f5f9]">{line.station}</td>
                  <td className="py-2.5 px-3 text-[#94a3b8]">{line.shift}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#f1f5f9]">{line.targetQty}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">{line.producedQty}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-red-400">{line.scrapQty}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={line.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Log Output Entry */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title="Record Daily Production Output"
        size="md"
      >
        <form onSubmit={handleEntrySubmit} className="space-y-4 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Select Work Order</label>
            <select
              required
              value={entryData.workOrderId}
              onChange={(e) => setEntryData({ ...entryData, workOrderId: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              {runningLines.map((l) => (
                <option key={l.workOrderId} value={l.workOrderId}>
                  {l.workOrderNo} - {l.product} (Qty: {l.targetQty})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Good Quantity Produced</label>
              <input
                type="number"
                required
                value={entryData.goodQuantity}
                onChange={(e) => setEntryData({ ...entryData, goodQuantity: e.target.value, quantityProduced: Number(e.target.value) + Number(entryData.rejectedQuantity || 0) })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Rejected Quantity</label>
              <input
                type="number"
                value={entryData.rejectedQuantity}
                onChange={(e) => setEntryData({ ...entryData, rejectedQuantity: e.target.value, quantityProduced: Number(entryData.goodQuantity || 0) + Number(e.target.value) })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Shift</label>
              <select
                value={entryData.shift}
                onChange={(e) => setEntryData({ ...entryData, shift: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="SHIFT_A">Shift A (06:00 - 14:00)</option>
                <option value="SHIFT_B">Shift B (14:00 - 22:00)</option>
                <option value="SHIFT_C">Shift C (Night)</option>
              </select>
            </div>
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Hours Run</label>
              <input
                type="number"
                step="0.5"
                value={entryData.hoursWorked}
                onChange={(e) => setEntryData({ ...entryData, hoursWorked: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Operator <span className="text-[#3b82f6] text-[10px]">(Existing Personnel)</span></label>
              <select
                value={entryData.operatorName}
                onChange={(e) => setEntryData({ ...entryData, operatorName: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="">-- Select Operator --</option>
                {refData.users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} {u.role ? `(${u.role})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Machine / Station <span className="text-[#3b82f6] text-[10px]">(Existing Lines)</span></label>
              <select
                value={entryData.machineId}
                onChange={(e) => setEntryData({ ...entryData, machineId: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="">-- Select Machine / Station --</option>
                {refData.machines.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Notes / Observations</label>
            <textarea
              rows="2"
              value={entryData.notes}
              onChange={(e) => setEntryData({ ...entryData, notes: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button variant="secondary" onClick={() => setIsEntryModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Production Entry"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Transfer Output to Quality Inspection */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setActionError("");
        }}
        title="Transfer Batch to Quality Control"
        size="md"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {(() => {
            const currentLine = selectedTransferLine;
            if (!currentLine) return null;
            return (
              <div className="p-3 bg-[#0a1020] border border-[#1e2a4a] rounded-xl grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-[#64748b] uppercase block font-semibold">Produced Good</span>
                  <span className="text-sm font-bold text-[#f1f5f9]">{currentLine.producedQty}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748b] uppercase block font-semibold">In QA / Transferred</span>
                  <span className="text-sm font-bold text-amber-400">{currentLine.transferredQty}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748b] uppercase block font-semibold">Available for QA</span>
                  <span className={`text-sm font-bold ${currentLine.availableForTransfer > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {currentLine.availableForTransfer}
                  </span>
                </div>
              </div>
            );
          })()}

          {(() => {
            const currentLine = selectedTransferLine;
            if (currentLine && currentLine.availableForTransfer <= 0) {
              return (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                  All completed good output ({currentLine.producedQty} units) for this order has already been transferred to Quality. Log more production via &apos;Log Run&apos; before creating another transfer batch.
                </div>
              );
            }
            return null;
          })()}

          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Select Work Order</label>
            <select
              required
              value={transferData.workOrderId}
              onChange={(e) => {
                const selectedWoId = e.target.value;
                const found = activeLines.find((l) => String(l.workOrderId) === String(selectedWoId));
                setTransferData({
                  ...transferData,
                  workOrderId: selectedWoId,
                  quantity: found && found.availableForTransfer > 0 ? found.availableForTransfer : "",
                });
                setActionError("");
              }}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              {runningLines.map((l) => (
                <option key={l.workOrderId} value={l.workOrderId}>
                  {l.workOrderNo} - {l.product} (Available: {l.availableForTransfer} / Good: {l.producedQty})
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#94a3b8] font-medium">Quantity Ready for Inspection</label>
              {(() => {
                const currentLine = activeLines.find(
                  (l) => String(l.workOrderId) === String(transferData.workOrderId)
                );
                return currentLine ? (
                  <span className="text-[10px] text-[#64748b]">
                    Max transferable: <strong className="text-emerald-400">{currentLine.availableForTransfer} units</strong>
                  </span>
                ) : null;
              })()}
            </div>
            <input
              type="number"
              required
              min="1"
              max={selectedTransferLine?.availableForTransfer}
              value={transferData.quantity}
              onChange={(e) => {
                const quantity = e.target.value;
                setTransferData({ ...transferData, quantity });
                setActionError(
                  selectedTransferLine &&
                    Number(quantity) > selectedTransferLine.availableForTransfer
                    ? `Only ${selectedTransferLine.availableForTransfer} units remain available for QA. Reduce the transfer quantity or record more good production first.`
                    : ""
                );
              }}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Handoff Notes</label>
            <textarea
              rows="2"
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button
              variant="secondary"
              onClick={() => {
                setIsTransferModalOpen(false);
                setActionError("");
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Transferring..." : "Transfer to QA Queue"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Log Downtime */}
      <Modal
        isOpen={isDowntimeModalOpen}
        onClose={() => setIsDowntimeModalOpen(false)}
        title="Record Station Downtime"
        size="md"
      >
        <form onSubmit={handleDowntimeSubmit} className="space-y-4 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Select Work Order</label>
            <select
              required
              value={downtimeData.workOrderId}
              onChange={(e) => setDowntimeData({ ...downtimeData, workOrderId: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              {runningLines.map((l) => (
                <option key={l.workOrderId} value={l.workOrderId}>
                  {l.workOrderNo} - {l.product}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Machine / Station <span className="text-[#3b82f6] text-[10px]">(Existing Equipment)</span></label>
            <select
              required
              value={downtimeData.machineId}
              onChange={(e) => setDowntimeData({ ...downtimeData, machineId: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="">-- Select Machine / Station --</option>
              {refData.machines.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Duration (Minutes)</label>
            <input
              type="number"
              required
              min="1"
              value={downtimeData.durationMinutes}
              onChange={(e) => setDowntimeData({ ...downtimeData, durationMinutes: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Reason / Root Cause</label>
            <select
              required
              value={downtimeData.reason}
              onChange={(e) => setDowntimeData({ ...downtimeData, reason: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="">-- Select Downtime Reason --</option>
              <option value="Tooling Changeover">Tooling Changeover</option>
              <option value="Mechanical Breakdown">Mechanical Breakdown</option>
              <option value="Electrical Fault">Electrical Fault</option>
              <option value="Material Shortage">Material Shortage</option>
              <option value="Routine Maintenance">Routine Maintenance</option>
              <option value="Operator Break">Operator Break</option>
              <option value="Quality Parameter Check">Quality Parameter Check</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button variant="secondary" onClick={() => setIsDowntimeModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Logging..." : "Log Downtime"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Log Scrap */}
      <Modal
        isOpen={isScrapModalOpen}
        onClose={() => setIsScrapModalOpen(false)}
        title="Log Material Scrap against Work Order"
        size="md"
      >
        <form onSubmit={handleScrapSubmit} className="space-y-4 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Select Work Order</label>
            <select
              required
              value={scrapData.workOrderId}
              onChange={(e) => setScrapData({ ...scrapData, workOrderId: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              {runningLines.map((l) => (
                <option key={l.workOrderId} value={l.workOrderId}>
                  {l.workOrderNo} - {l.product}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Scrap Quantity</label>
            <input
              type="number"
              required
              value={scrapData.quantity}
              onChange={(e) => setScrapData({ ...scrapData, quantity: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Scrap Reason <span className="text-[#3b82f6] text-[10px]">(Standard Defect Classification)</span></label>
            <select
              required
              value={scrapData.reason}
              onChange={(e) => setScrapData({ ...scrapData, reason: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="">-- Select Scrap Reason --</option>
              <option value="Surface Oxidation">Surface Oxidation</option>
              <option value="Diameter Tolerance Exceeded">Diameter Tolerance Exceeded</option>
              <option value="Thread Stripping">Thread Stripping</option>
              <option value="Plating Peeling / Blistering">Plating Peeling / Blistering</option>
              <option value="Core Bending">Core Bending</option>
              <option value="Handling Damage">Handling Damage</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button variant="secondary" onClick={() => setIsScrapModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Recording..." : "Record Scrap"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
