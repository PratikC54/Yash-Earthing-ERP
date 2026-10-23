import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Send,
  Plus,
} from "lucide-react";
import ModuleHeader from "../components/shared/ModuleHeader";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import StatusBadge from "../../../components/common/StatusBadge";
import Loader from "../../../components/common/Loader";
import Modal from "../../../components/common/Modal";
import ProductionProgress from "../components/production/ProductionProgress";
import productionService from "../services/productionService";
import { formatDateTime } from "../utils/productionQualityHelpers";

export default function WorkOrderDetailsPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [entryData, setEntryData] = useState({ quantityProduced: 10, shift: "SHIFT_A", notes: "" });
  const [transferData, setTransferData] = useState({ quantity: "", notes: "" });
  const [transferError, setTransferError] = useState("");

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [orderRes, histRes] = await Promise.all([
        productionService.getWorkOrderById(id),
        productionService.getWorkOrderHistory(id).catch(() => ({ data: { history: [] } })),
      ]);
      if (orderRes?.data) setOrder(orderRes.data);
      if (histRes?.data) setHistory(Array.isArray(histRes.data) ? histRes.data : (histRes.data.history || []));
    } catch (err) {
      setErrorMsg(err.message || "Failed to load Work Order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const checkStock = async () => {
    try {
      const res = await productionService.checkMaterialAvailability(id);
      if (res?.data) setAvailability(res.data);
    } catch (err) {
      alert("Material check failed: " + err.message);
    }
  };

  const handleTransition = async (action) => {
    setActionLoading(true);
    setErrorMsg("");
    try {
      switch (action) {
        case "SUBMIT":
          await productionService.submitWorkOrder(id);
          break;
        case "APPROVE":
          await productionService.approveWorkOrder(id);
          break;
        case "RELEASE":
          await productionService.releaseWorkOrder(id);
          break;
        case "START":
          await productionService.startManufacturing(id, { shift: "SHIFT_A" });
          break;
        case "HOLD":
          await productionService.holdWorkOrder(id, { reason: "Shop floor hold requested" });
          break;
        case "RESUME":
          await productionService.resumeWorkOrder(id);
          break;
        case "CANCEL":
          await productionService.cancelWorkOrder(id, { reason: "Cancelled by supervisor" });
          break;
      }
      await loadOrder();
    } catch (err) {
      setErrorMsg(err.message || `Action ${action} failed`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProductionEntry = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await productionService.recordProductionEntry({
        workOrderId: Number(id),
        quantityProduced: Number(entryData.quantityProduced),
        shift: entryData.shift,
        notes: entryData.notes,
      });
      setIsEntryModalOpen(false);
      await loadOrder();
    } catch (err) {
      alert("Failed to log entry: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferToQuality = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await productionService.transferToQuality(id, {
        quantity: Number(transferData.quantity),
        notes: transferData.notes,
      });
      setIsTransferModalOpen(false);
      await loadOrder();
      alert("Transferred to Quality Control queue successfully!");
    } catch (err) {
      alert("Transfer failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader label="Loading Work Order specifications & operations..." size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-[#10182f] p-8 rounded-xl border border-red-500/30 text-center space-y-3">
        <h3 className="text-base font-bold text-red-400">Work Order Not Found</h3>
        <p className="text-xs text-[#94a3b8]">The requested work order #{id} could not be located.</p>
        <Link to="/production-quality/work-orders">
          <Button variant="secondary" size="sm">Back to Work Orders</Button>
        </Link>
      </div>
    );
  }

  // Calculate available quantity for quality inspection handoff: Completed Good - Previously Transferred
  const completedGood = Number(order.goodQuantity || 0);
  const previouslyTransferred = (order.inspections || []).reduce(
    (sum, insp) => sum + Number(insp.inspectedQuantity || 0),
    0
  );
  const availableForTransfer = Math.max(0, completedGood - previouslyTransferred);

  const openTransferModal = () => {
    setTransferData({
      quantity: availableForTransfer > 0 ? availableForTransfer : "",
      notes: "",
    });
    setTransferError("");
    setIsTransferModalOpen(true);
  };

  const { status, bomRevision, salesOrder, items = [] } = order;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title={`${order.workOrderNo} — Specifications & Lifecycle`}
        subtitle={`Manufacturing execution details for ${bomRevision?.product?.name || items?.[0]?.product?.name || salesOrder?.productSummary || "—"}`}
        breadcrumbs={[
          { label: "Production & Quality", to: "/production-quality/planning" },
          { label: "Work Orders", to: "/production-quality/work-orders" },
          { label: order.workOrderNo },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link to="/production-quality/work-orders">
              <Button variant="secondary" size="sm" icon={ArrowLeft}>
                Back
              </Button>
            </Link>
          </div>
        }
      />

      {errorMsg && (
        <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Top Lifecycle Action Toolbar */}
      <div className="bg-[#10182f] p-4 rounded-xl border border-[#1e2a4a] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#94a3b8] font-medium">Current Status:</span>
          <StatusBadge status={status} />
          <StatusBadge status={order.priority} />
        </div>

        {/* Transition Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {status === "DRAFT" && (
            <>
              <Button
                variant="secondary"
                size="sm"
                loading={actionLoading}
                onClick={() => handleTransition("SUBMIT")}
                icon={Send}
              >
                Submit for Approval
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionLoading}
                onClick={() => handleTransition("RELEASE")}
                icon={Play}
              >
                Release to Shop Floor
              </Button>
            </>
          )}

          {status === "PLANNED" && (
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={() => handleTransition("RELEASE")}
              icon={Play}
            >
              Release Order to Shop Floor
            </Button>
          )}

          {status === "RELEASED" && (
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={() => handleTransition("START")}
              icon={Play}
            >
              Start Shop Floor Execution
            </Button>
          )}

          {status === "IN_PROGRESS" && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={() => setIsEntryModalOpen(true)}
              >
                Log Production
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                onClick={openTransferModal}
              >
                Transfer to Quality
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Pause}
                loading={actionLoading}
                onClick={() => handleTransition("HOLD")}
              >
                Hold
              </Button>
            </>
          )}

          {(status === "ON_HOLD" || status === "QC_HOLD" || status === "MATERIAL_HOLD") && (
            <Button
              variant="primary"
              size="sm"
              icon={RotateCcw}
              loading={actionLoading}
              onClick={() => handleTransition("RESUME")}
            >
              Resume Execution
            </Button>
          )}

          {status !== "COMPLETED" && status !== "CANCELLED" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              loading={actionLoading}
              onClick={() => handleTransition("CANCEL")}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Order Specifications">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Target Product</span>
              <span className="font-semibold text-[#f1f5f9]">{bomRevision?.product?.name || items?.[0]?.product?.name || salesOrder?.productSummary || "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Product SKU</span>
              <span className="font-medium text-[#f1f5f9]">{bomRevision?.product?.sku || items?.[0]?.product?.sku || "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">BOM Revision</span>
              <span className="font-medium text-[#f1f5f9]">{bomRevision?.revision || "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Assigned Line</span>
              <span className="font-semibold text-blue-400">{order.assignedLine || "—"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#94a3b8]">Customer / SO</span>
              <span className="font-medium text-[#f1f5f9]">
                {salesOrder?.customer?.name || "—"} ({salesOrder?.orderNumber || "—"})
              </span>
            </div>
          </div>
        </Card>

        <Card title="Production Output Progress">
          <div className="space-y-3">
            <ProductionProgress
              produced={order.goodQuantity}
              planned={order.plannedQuantity}
              rejected={order.rejectedQuantity}
            />
            <div className="grid grid-cols-3 text-center pt-2 border-t border-[#1e2a4a]">
              <div>
                <p className="text-[10px] text-[#94a3b8]">Planned</p>
                <p className="text-sm font-bold text-[#f1f5f9]">{order.plannedQuantity}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-400">Good Output</p>
                <p className="text-sm font-bold text-emerald-400">{order.goodQuantity}</p>
              </div>
              <div>
                <p className="text-[10px] text-red-400">Rejections</p>
                <p className="text-sm font-bold text-red-400">{order.rejectedQuantity}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Material Availability"
          action={
            <Button variant="outline" size="sm" onClick={checkStock}>
              Check Stock
            </Button>
          }
        >
          {availability ? (
            <div className="space-y-2 text-xs">
              <div
                className={`p-2 rounded-lg font-semibold text-center ${
                  availability.status === "AVAILABLE"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/10 text-red-400 border border-red-500/30"
                }`}
              >
                {availability.status === "AVAILABLE"
                  ? "✓ All Raw Materials Ready"
                  : "⚠ Raw Material Shortage"}
              </div>
              <p className="text-[11px] text-[#94a3b8]">
                {availability.items?.length || 0} component lines verified against inventory balance.
              </p>
            </div>
          ) : (
            <div className="text-xs text-[#94a3b8] text-center py-4">
              Click &quot;Check Stock&quot; to verify physical inventory before floor release.
            </div>
          )}
        </Card>
      </div>

      {/* Bill of Materials Items */}
      <Card title="Bill of Materials & Component Consumption" subtitle="Components required for this work order batch">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e2a4a] text-[#94a3b8] font-semibold bg-[#0b1329]">
                <th className="py-2.5 px-3">Component SKU</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3 text-right">Planned Qty</th>
                <th className="py-2.5 px-3 text-right">Issued Qty</th>
                <th className="py-2.5 px-3 text-right">Consumed Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-[#94a3b8]">
                    No custom items specified; standard BOM components configured.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-[#3b82f6]">{item.product?.sku || "—"}</td>
                    <td className="py-2.5 px-3 text-[#f1f5f9]">{item.product?.name || "—"}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-[#f1f5f9]">{item.plannedQuantity}</td>
                    <td className="py-2.5 px-3 text-right text-blue-400 font-medium">{item.issuedQuantity || 0}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-medium">{item.consumedQuantity || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audit History Timeline */}
      <Card title="Lifecycle Audit Log & Event Timeline" subtitle="Immutable state change log">
        {history.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#94a3b8]">No lifecycle events recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={h.id || i} className="flex items-start gap-3 text-xs border-b border-[#1e2a4a] pb-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#f1f5f9]">{h.action}</span>
                    <span className="text-[11px] text-[#94a3b8]">{formatDateTime(h.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">
                    User ID: {h.userId || "System"} · {h.ipAddress || "Internal"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Log Production Modal */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title="Record Production Output"
        subtitle={`Log good quantity produced for ${order.workOrderNo}`}
      >
        <form onSubmit={handleProductionEntry} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1 text-[#94a3b8]">Quantity Produced (Good Units)</label>
            <input
              type="number"
              min="1"
              value={entryData.quantityProduced}
              onChange={(e) => setEntryData({ ...entryData, quantityProduced: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-[#94a3b8]">Shift</label>
            <select
              value={entryData.shift}
              onChange={(e) => setEntryData({ ...entryData, shift: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
            >
              <option value="GENERAL">General Shift</option>
              <option value="SHIFT_A">Shift A (Morning)</option>
              <option value="SHIFT_B">Shift B (Evening)</option>
              <option value="SHIFT_C">Shift C (Night)</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1 text-[#94a3b8]">Notes</label>
            <textarea
              rows="2"
              value={entryData.notes}
              onChange={(e) => setEntryData({ ...entryData, notes: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#1e2a4a]">
            <Button variant="secondary" size="sm" onClick={() => setIsEntryModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" loading={actionLoading}>Save Production Log</Button>
          </div>
        </form>
      </Modal>

      {/* Transfer to Quality Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Output to Quality Control"
        subtitle={`Route finished units to QC Inspection Bay for ${order.workOrderNo}`}
      >
        <form onSubmit={handleTransferToQuality} className="space-y-4 text-xs">
          {/* Production vs Transfer breakdown */}
          <div className="p-3 bg-[#0a1020] border border-[#1e2a4a] rounded-lg space-y-1.5 text-xs">
            <div className="flex justify-between text-[#94a3b8]">
              <span>Completed Good Production:</span>
              <strong className="text-[#f1f5f9]">{completedGood} units</strong>
            </div>
            <div className="flex justify-between text-[#94a3b8]">
              <span>Previously Transferred:</span>
              <strong className="text-amber-400">{previouslyTransferred} units</strong>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-[#1e2a4a] font-semibold">
              <span className="text-[#94a3b8]">Available for Transfer:</span>
              <strong className={availableForTransfer > 0 ? "text-emerald-400" : "text-red-400"}>
                {availableForTransfer} units
              </strong>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-medium text-[#94a3b8]">Transfer Quantity (Units)</label>
              {availableForTransfer > 0 && (
                <span className="text-[11px] text-emerald-400">
                  Max transferable: <strong>{availableForTransfer}</strong>
                </span>
              )}
            </div>
            <input
              type="number"
              min="1"
              max={availableForTransfer > 0 ? availableForTransfer : undefined}
              disabled={availableForTransfer <= 0}
              value={transferData.quantity}
              onChange={(e) => {
                const val = e.target.value;
                setTransferData({ ...transferData, quantity: val });
                if (Number(val) > availableForTransfer) {
                  setTransferError(`Only ${availableForTransfer} units remain available for QC transfer.`);
                } else if (Number(val) < 1 && val !== "") {
                  setTransferError("Transfer quantity must be at least 1 unit.");
                } else {
                  setTransferError("");
                }
              }}
              placeholder={availableForTransfer > 0 ? `Max ${availableForTransfer}` : "No units available"}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6] disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            {transferError && (
              <p className="mt-1 text-[11px] text-red-400 font-medium">{transferError}</p>
            )}
            {availableForTransfer <= 0 && (
              <p className="mt-1.5 text-[11px] text-amber-400">
                All completed good output has already been transferred to Quality Inspection. Record additional good production before transferring again.
              </p>
            )}
          </div>
          <div>
            <label className="block font-medium mb-1 text-[#94a3b8]">Batch / Handling Notes</label>
            <textarea
              rows="2"
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
              placeholder="Enter the production transfer notes"
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#1e2a4a]">
            <Button variant="secondary" size="sm" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={actionLoading}
              disabled={availableForTransfer <= 0 || Boolean(transferError) || !transferData.quantity}
            >
              Confirm Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
