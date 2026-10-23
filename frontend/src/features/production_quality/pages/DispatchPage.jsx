import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Truck, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import StatusBadge from "../../../components/common/StatusBadge";
import Loader from "../../../components/common/Loader";
import dispatchService from "../services/dispatchService";

export default function DispatchPage() {
  const [dispatches, setDispatches] = useState([]);
  const [readyInspections, setReadyInspections] = useState([]);
  const [dispatchCount, setDispatchCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dispatch Action Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    quantity: "",
    destinationAddress: "",
    transporterName: "",
    vehicleNumber: "",
    deliveryChallanNo: "",
    lrNumber: "",
    deliveryNotes: "",
  });

  const handleOpenDispatchModal = (item) => {
    setSelectedLot(item);
    setFormData({
      quantity: item.remainingQuantity || item.acceptedQuantity || "",
      destinationAddress: item.shippingAddress || "Main Plant Yard",
      transporterName: "SafeXpress Logistics",
      vehicleNumber: "",
      deliveryChallanNo: `DC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(item.inspectionId).padStart(3, "0")}`,
      lrNumber: "",
      deliveryNotes: "",
    });
    setIsModalOpen(true);
  };

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    if (!selectedLot) return;
    setSubmitting(true);
    try {
      await dispatchService.createDispatch({
        inspectionId: Number(selectedLot.inspectionId),
        workOrderId: selectedLot.workOrderId ? Number(selectedLot.workOrderId) : undefined,
        quantity: Number(formData.quantity),
        destinationAddress: formData.destinationAddress,
        transporterName: formData.transporterName,
        vehicleNumber: formData.vehicleNumber,
        deliveryChallanNo: formData.deliveryChallanNo,
        lrNumber: formData.lrNumber,
        deliveryNotes: formData.deliveryNotes,
      });
      setIsModalOpen(false);
      await loadDispatches();
      alert("Dispatch shipment confirmed and created successfully!");
    } catch (err) {
      alert("Failed to create dispatch: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total dispatched quantity across all dispatch records
  const totalDispatchedQuantity = dispatches.reduce((sum, item) => {
    const qty = Number(item.quantity || 0);
    return sum + (Number.isFinite(qty) ? qty : 0);
  }, 0);

  // Calculate total ready quantity awaiting dispatch
  const totalReadyQuantity = readyInspections.reduce((sum, item) => {
    const qty = Number(item.remainingQuantity ?? item.acceptedQuantity ?? 0);
    return sum + (Number.isFinite(qty) ? qty : 0);
  }, 0);

  const loadDispatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyResponse, readyResponse, dashboardResponse] = await Promise.all([
        dispatchService.getHistory(),
        dispatchService.getReadyForDispatch(),
        dispatchService.getDashboard(),
      ]);
      const history = historyResponse?.data || historyResponse || [];
      const ready = readyResponse?.data || readyResponse || [];
      const dashboard = dashboardResponse?.data || dashboardResponse;
      const count = dashboard?.metrics?.totalDispatches ?? dashboard?.totalDispatches;
      if (!Array.isArray(history) || !Array.isArray(ready) || !Number.isInteger(count)) {
        throw new Error("Dispatch API returned an invalid count or list response.");
      }
      setDispatches(Array.isArray(history) ? history : []);
      setReadyInspections(Array.isArray(ready) ? ready : []);
      setDispatchCount(count);
    } catch (err) {
      console.error("Failed to load dispatch records:", err);
      setError(err?.message || "Failed to load dispatch records from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDispatches();
  }, [loadDispatches]);

  if (loading && dispatches.length === 0 && !error) {
    return (
      <div className="py-24 text-center">
        <Loader label="Loading dispatch records..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#10182f] p-6 rounded-2xl border border-[#1e2a4a] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30 text-blue-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-[#2DD4BF] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              MODULE 4.4 · DISPATCH
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#f1f5f9] tracking-tight mt-1">
              Dispatch Records
            </h1>
          </div>
        </div>
        <Button
          variant="secondary"
          size="md"
          icon={RefreshCw}
          onClick={loadDispatches}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between gap-3 text-rose-300 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={loadDispatches}>
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#10182f] border border-blue-500/30 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#94a3b8] block">Total Dispatched Quantity</span>
            <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              UNITS
            </span>
          </div>
          <span className="text-3xl font-bold text-blue-400 mt-2 block">{totalDispatchedQuantity.toLocaleString()}</span>
          <span className="block text-[10px] text-[#64748b] mt-1">
            Total product units confirmed & shipped
          </span>
        </div>
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#94a3b8] block">Total Dispatch Shipments</span>
            <span className="text-[10px] font-mono text-[#64748b]">RECORDS</span>
          </div>
          <span className="text-3xl font-bold text-[#f1f5f9] mt-2 block">{dispatchCount}</span>
          <span className="block text-[10px] text-[#64748b] mt-1">
            Completed dispatch consignments in history
          </span>
        </div>
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#94a3b8] block">Ready for Dispatch</span>
            <span className="text-[10px] font-mono font-bold text-[#2DD4BF] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {totalReadyQuantity.toLocaleString()} UNITS
            </span>
          </div>
          <span className="text-3xl font-bold text-[#2DD4BF] mt-2 block">{readyInspections.length}</span>
          <span className="block text-[10px] text-[#64748b] mt-1">
            Quality-approved inspection lots awaiting shipment
          </span>
        </div>
      </div>

      <Card
        title="Quality-Approved Output Ready for Dispatch"
        subtitle="Passed inspections with accepted quantities that have not been fully dispatched"
      >
        <div className="overflow-x-auto rounded-xl border border-[#1e2a4a]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0a1020] text-[#94a3b8] border-b border-[#1e2a4a]">
                <th className="py-3 px-3 font-semibold">Inspection</th>
                <th className="py-3 px-3 font-semibold">Work Order</th>
                <th className="py-3 px-3 font-semibold">Customer / Sales Order</th>
                <th className="py-3 px-3 font-semibold">Product</th>
                <th className="py-3 px-3 font-semibold text-right">Accepted</th>
                <th className="py-3 px-3 font-semibold text-right">Dispatched</th>
                <th className="py-3 px-3 font-semibold text-right">Remaining</th>
                <th className="py-3 px-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {readyInspections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#64748b]">
                    No quality-approved output is currently waiting for dispatch.
                  </td>
                </tr>
              ) : (
                readyInspections.map((item) => (
                  <tr key={item.inspectionId} className="hover:bg-[#10182f]/60 transition">
                    <td className="py-3 px-3 font-mono font-bold">
                      <Link
                        to={`/production-quality/inspections/${item.inspectionId}`}
                        className="text-blue-400 hover:underline"
                      >
                        {item.inspectionNo || "—"}
                      </Link>
                      <div className="text-[10px] text-emerald-400">Quality approved</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#f1f5f9]">
                      {item.workOrderNo || "—"}
                    </td>
                    <td className="py-3 px-3 text-[#94a3b8]">
                      <div>{item.customerName || "—"}</div>
                      <div className="font-mono text-[10px] text-[#64748b]">
                        {item.sourceOrderNo || "No sales order"}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#f1f5f9]">
                      <div>{item.productName || "—"}</div>
                      {item.sku && (
                        <div className="font-mono text-[10px] text-[#64748b]">{item.sku}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-[#f1f5f9]">
                      {item.acceptedQuantity}
                    </td>
                    <td className="py-3 px-3 text-right text-[#94a3b8]">
                      {item.previouslyDispatchedQuantity}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#2DD4BF]">
                      {item.remainingQuantity}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Button
                        variant="primary"
                        size="xs"
                        icon={Truck}
                        onClick={() => handleOpenDispatchModal(item)}
                      >
                        Dispatch
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="All Dispatches" subtitle="Complete dispatch history">
        <div className="overflow-x-auto rounded-xl border border-[#1e2a4a]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0a1020] text-[#94a3b8] border-b border-[#1e2a4a]">
                <th className="py-3 px-3 font-semibold">Dispatch No</th>
                <th className="py-3 px-3 font-semibold">Date</th>
                <th className="py-3 px-3 font-semibold">Work Order</th>
                <th className="py-3 px-3 font-semibold">Product</th>
                <th className="py-3 px-3 font-semibold text-right">Quantity</th>
                <th className="py-3 px-3 font-semibold">Transporter / Vehicle</th>
                <th className="py-3 px-3 font-semibold">Challan / LR</th>
                <th className="py-3 px-3 font-semibold">Destination</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#64748b]">
                    No dispatch records found.
                  </td>
                </tr>
              ) : (
                dispatches.map((item) => (
                  <tr key={item.id} className="hover:bg-[#10182f]/60 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-400">
                      {item.dispatchNo || "—"}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#94a3b8]">
                      {item.dispatchDate ? new Date(item.dispatchDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#f1f5f9]">
                      {item.workOrder?.workOrderNo || item.workOrderNo || "—"}
                    </td>
                    <td className="py-3 px-3 font-medium text-[#f1f5f9] max-w-[180px] truncate">
                      {item.workOrder?.bomRevision?.product?.name || item.productName || "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#2DD4BF]">
                      {item.quantity ?? "—"}
                    </td>
                    <td className="py-3 px-3 text-[#f1f5f9]">
                      <div>{item.transporterName || "—"}</div>
                      <div className="font-mono text-[10px] text-[#64748b]">{item.vehicleNumber || "—"}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#94a3b8]">
                      <div>{item.deliveryChallanNo || "—"}</div>
                      {item.lrNumber && <div className="text-[10px] text-[#64748b]">{item.lrNumber}</div>}
                    </td>
                    <td className="py-3 px-3 text-[#94a3b8] max-w-[180px] truncate" title={item.destinationAddress || ""}>
                      {item.destinationAddress || "—"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge status={item.status || "—"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Dispatch Shipment Modal */}
      {isModalOpen && selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl w-full max-w-lg p-6 shadow-2xl text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#1e2a4a] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#f1f5f9] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-400" />
                  Create Dispatch Shipment
                </h3>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">
                  Ship lot {selectedLot.inspectionNo} · {selectedLot.productName}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#94a3b8] hover:text-[#f1f5f9] text-base font-bold px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDispatch} className="space-y-3">
              <div className="p-3 bg-[#0a1020] border border-[#1e2a4a] rounded-lg grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#94a3b8]">Work Order:</span>
                  <div className="font-mono text-[#f1f5f9] font-semibold">{selectedLot.workOrderNo}</div>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Customer / SO:</span>
                  <div className="text-[#f1f5f9] font-medium">{selectedLot.customerName} ({selectedLot.sourceOrderNo})</div>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Available Remaining:</span>
                  <div className="font-bold text-emerald-400">{selectedLot.remainingQuantity} units</div>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Inspection Status:</span>
                  <div className="text-blue-400 font-semibold">Passed & Approved</div>
                </div>
              </div>

              <div>
                <label className="block text-[#94a3b8] font-medium mb-1">
                  Dispatch Quantity (Units) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedLot.remainingQuantity}
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <label className="block text-[#94a3b8] font-medium mb-1">
                  Destination Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Client site / yard address"
                  value={formData.destinationAddress}
                  onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                  className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94a3b8] font-medium mb-1">Transporter Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SafeXpress, VRL"
                    value={formData.transporterName}
                    onChange={(e) => setFormData({ ...formData, transporterName: e.target.value })}
                    className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] font-medium mb-1">Vehicle Registration No *</label>
                  <input
                    type="text"
                    required
                    placeholder="MH-12-AB-1234"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94a3b8] font-medium mb-1">Delivery Challan No</label>
                  <input
                    type="text"
                    value={formData.deliveryChallanNo}
                    onChange={(e) => setFormData({ ...formData, deliveryChallanNo: e.target.value })}
                    className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] font-medium mb-1">LR / Bilty Number</label>
                  <input
                    type="text"
                    placeholder="Optional tracking #"
                    value={formData.lrNumber}
                    onChange={(e) => setFormData({ ...formData, lrNumber: e.target.value })}
                    className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#94a3b8] font-medium mb-1">Dispatch Notes</label>
                <textarea
                  rows="2"
                  value={formData.deliveryNotes}
                  onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                  placeholder="Driver contact, special loading instructions, etc."
                  className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={submitting} icon={Truck}>
                  Confirm & Dispatch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
