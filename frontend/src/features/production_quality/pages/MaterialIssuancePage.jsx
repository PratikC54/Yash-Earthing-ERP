import React, { useState, useEffect, useCallback } from "react";
import { Package, Plus, RotateCcw, ArrowDownRight, ArrowUpRight, CheckCircle2, FileText, Search, AlertCircle, RefreshCw } from "lucide-react";
import ModuleHeader from "../components/shared/ModuleHeader";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import Loader from "../../../components/common/Loader";
import KpiSection from "../../../components/common/KpiSection";
import productionService from "../services/productionService";
import { validateQuantityInput, validateRequiredField, validateMinLength } from "../utils/formValidation";

export default function MaterialIssuancePage() {
  const [loading, setLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState([]);
  const [workOrderId, setWorkOrderId] = useState("");
  const [reconciliation, setReconciliation] = useState(null);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [refData, setRefData] = useState({
    products: [
      { id: 1, name: "Chemical Earthing Electrode 50mm x 3m", sku: "YASH-EL-50MM", unit: "NOS" },
      { id: 2, name: "GI Pipe 50mm Class B", sku: "RAW-PIPE-50MM", unit: "MTR" },
    ],
    warehouseLocations: [
      "Raw Material Warehouse A",
      "Copper Strip Storage · Bay 2",
      "Chemical Bulk Store",
      "Shop Floor Holding Area",
      "Quarantine Holding Area",
    ],
    users: [
      { id: 1, name: "System Administrator", role: "ADMIN" },
      { id: 2, name: "Shop Floor Supervisor", role: "SUPERVISOR" },
      { id: 3, name: "Line A Operator", role: "OPERATOR" },
    ],
  });

  useEffect(() => {
    async function fetchRef() {
      try {
        const res = await productionService.getReferenceData();
        const data = res?.data || res;
        if (data && (data.products || data.warehouseLocations)) {
          setRefData((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Could not fetch ref data for material issuance:", err);
      }
    }
    fetchRef();
  }, []);

  const [issueData, setIssueData] = useState({
    workOrderId: "",
    materialSku: "",
    quantityIssued: "",
    unit: "MTR",
    fromLocation: "",
    issuedTo: "",
    batchNumber: "",
  });

  const [consumeData, setConsumeData] = useState({
    workOrderId: "",
    materialSku: "",
    quantityConsumed: "",
    unit: "MTR",
    scrapQuantity: "",
  });

  const [returnData, setReturnData] = useState({
    workOrderId: "",
    materialSku: "",
    quantityReturned: "",
    unit: "MTR",
    toLocation: "",
    reason: "",
  });

  // Load available work orders from the database
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await productionService.listWorkOrders({ limit: 50 });
        const orders = res?.data || (Array.isArray(res) ? res : []);
        setWorkOrders(orders);
        if (orders.length > 0) {
          setWorkOrderId(String(orders[0].id));
          setIssueData((prev) => ({ ...prev, workOrderId: orders[0].id }));
          setConsumeData((prev) => ({ ...prev, workOrderId: orders[0].id }));
          setReturnData((prev) => ({ ...prev, workOrderId: orders[0].id }));
        }
      } catch (err) {
        console.error("Failed to load work orders list for material issuance:", err);
      }
    }
    fetchOrders();
  }, []);

  const loadReconciliation = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await productionService.getMaterialReconciliation(id);
      if (res?.data) {
        setReconciliation(res.data);
      } else {
        setReconciliation(null);
      }
    } catch (err) {
      console.error("Material reconciliation fetch error:", err);
      setError(err?.message || "Failed to load material reconciliation from server.");
      setReconciliation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (workOrderId) {
      loadReconciliation(workOrderId);
    }
  }, [workOrderId, loadReconciliation]);

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setActionError("");

    if (!issueData.workOrderId) {
      setActionError("Please select a target Work Order.");
      return;
    }
    if (!issueData.materialSku) {
      setActionError("Please select a raw material or component.");
      return;
    }
    const qtyErr = validateQuantityInput(issueData.quantityIssued, {
      uom: issueData.unit || "NOS",
      allowZero: false,
      fieldName: "Issued quantity",
    });
    if (qtyErr) {
      setActionError(qtyErr);
      return;
    }
    if (!issueData.fromLocation) {
      setActionError("Please select a source warehouse location.");
      return;
    }

    setSubmitting(true);
    try {
      await productionService.issueMaterial({
        ...issueData,
        workOrderId: parseInt(issueData.workOrderId, 10),
        quantityIssued: parseFloat(issueData.quantityIssued),
      });
      setIsIssueModalOpen(false);
      await loadReconciliation(workOrderId);
    } catch (err) {
      setActionError(err?.message || "Failed to issue material.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConsumeSubmit = async (e) => {
    e.preventDefault();
    setActionError("");

    if (!consumeData.workOrderId) {
      setActionError("Please select a target Work Order.");
      return;
    }
    if (!consumeData.materialSku) {
      setActionError("Please select a raw material or component.");
      return;
    }
    const qtyErr = validateQuantityInput(consumeData.quantityConsumed, {
      uom: consumeData.unit || "NOS",
      allowZero: false,
      fieldName: "Consumed quantity",
    });
    if (qtyErr) {
      setActionError(qtyErr);
      return;
    }
    if (consumeData.scrapQuantity && String(consumeData.scrapQuantity).trim() !== "") {
      const scrapErr = validateQuantityInput(consumeData.scrapQuantity, {
        uom: consumeData.unit || "NOS",
        allowZero: true,
        fieldName: "Scrap quantity",
      });
      if (scrapErr) {
        setActionError(scrapErr);
        return;
      }
    }

    setSubmitting(true);
    try {
      await productionService.recordMaterialConsumption({
        ...consumeData,
        workOrderId: parseInt(consumeData.workOrderId, 10),
        quantityConsumed: parseFloat(consumeData.quantityConsumed),
        scrapQuantity: parseFloat(consumeData.scrapQuantity || 0),
      });
      setIsConsumeModalOpen(false);
      await loadReconciliation(workOrderId);
    } catch (err) {
      setActionError(err?.message || "Failed to log material consumption.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setActionError("");

    if (!returnData.workOrderId) {
      setActionError("Please select a target Work Order.");
      return;
    }
    if (!returnData.materialSku) {
      setActionError("Please select a raw material or component.");
      return;
    }
    const qtyErr = validateQuantityInput(returnData.quantityReturned, {
      uom: returnData.unit || "NOS",
      allowZero: false,
      fieldName: "Returned quantity",
    });
    if (qtyErr) {
      setActionError(qtyErr);
      return;
    }
    if (!returnData.toLocation) {
      setActionError("Please select a destination warehouse location.");
      return;
    }
    if (!returnData.reason?.trim() || returnData.reason.trim().length < 3) {
      setActionError("Please specify a valid reason for return (minimum 3 characters).");
      return;
    }

    setSubmitting(true);
    try {
      await productionService.returnMaterial({
        ...returnData,
        workOrderId: parseInt(returnData.workOrderId, 10),
        quantityReturned: parseFloat(returnData.quantityReturned),
      });
      setIsReturnModalOpen(false);
      await loadReconciliation(workOrderId);
    } catch (err) {
      setActionError(err?.message || "Failed to return material.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = (reconciliation?.items || []).filter((m) => {
    if (!searchFilter) return true;
    const term = searchFilter.toLowerCase();
    return (
      (m.productName && m.productName.toLowerCase().includes(term)) ||
      (m.sku && m.sku.toLowerCase().includes(term)) ||
      (m.status && m.status.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Material Issuance & Stores Handover (M4.2)"
        subtitle="Issue materials against released BOMs, generate store pick-lists, track shop-floor consumption, and reconcile variances."
        breadcrumbs={[
          { label: "Production & Quality", to: "/production-quality/planning" },
          { label: "Material Issuance" },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowDownRight}
              onClick={() => setIsReturnModalOpen(true)}
            >
              Return Material
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={() => setIsConsumeModalOpen(true)}
            >
              Log Consumption
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsIssueModalOpen(true)}
            >
              Issue Material
            </Button>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <KpiSection title="Material & Issuance KPIs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#94a3b8] font-medium">Active Pick-Lists</p>
                <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">12 Orders</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#94a3b8] font-medium">Issued Today</p>
                <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">3,450 KG</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#94a3b8] font-medium">Shop-Floor WIP Stock</p>
                <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">1,820 KG</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Package className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#94a3b8] font-medium">Reconciliation Variance</p>
                <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">0.4% (Normal)</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>
      </KpiSection>

      {/* Material Reconciliation against Work Order */}
      <Card
        title="Material Reconciliation against Work Order"
        subtitle="Compare planned BOM consumption against actual store issues, floor consumption, and returns"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#94a3b8] font-medium">Select Work Order:</span>
            <select
              value={workOrderId}
              onChange={(e) => setWorkOrderId(e.target.value)}
              className="bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg text-xs px-3 py-1.5 focus:outline-none focus:border-[#3b82f6]"
            >
              {workOrders.length === 0 ? (
                <option value={workOrderId}>Work Order #{workOrderId}</option>
              ) : (
                workOrders.map((wo) => (
                  <option key={wo.id} value={wo.id}>
                    {wo.workOrderNo} — {wo.notes || `Order #${wo.id}`}
                  </option>
                ))
              )}
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => loadReconciliation(workOrderId)}
          >
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => loadReconciliation(workOrderId)}
              className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-200 font-semibold cursor-pointer text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center">
            <Loader label="Reconciling material balances from database..." size="sm" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0b1329] text-[#94a3b8] uppercase font-semibold border-b border-[#1e2a4a]">
                <tr>
                  <th className="py-2.5 px-3">Item / SKU</th>
                  <th className="py-2.5 px-3 text-right">BOM Required</th>
                  <th className="py-2.5 px-3 text-right">Issued from Store</th>
                  <th className="py-2.5 px-3 text-right">Consumed</th>
                  <th className="py-2.5 px-3 text-right">Operator Balance</th>
                  <th className="py-2.5 px-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a4a]">
                {!reconciliation?.items || reconciliation.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#94a3b8]">
                      No raw material components linked to this work order.
                    </td>
                  </tr>
                ) : (
                  reconciliation.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#f1f5f9]">{item.productName || item.name || item.sku}</div>
                        <div className="text-[10px] text-[#64748b] font-mono">{item.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#94a3b8]">{item.plannedQuantity ?? item.required ?? 0}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#3b82f6]">{item.issuedQuantity ?? item.issued ?? 0}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#94a3b8]">{item.consumedQuantity ?? item.consumed ?? 0}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-emerald-400">{item.balanceWithOperator ?? item.returned ?? 0}</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${Number(item.variance) < 0 ? "text-amber-400" : "text-emerald-400"}`}>
                        {item.variance ?? 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Material Movements Log */}
      <Card
        title="Material Movements Ledger"
        subtitle="Live audit trail of store issues, shop-floor consumptions, and returns"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search movements..."
              className="w-full bg-[#0a1020] text-[#f1f5f9] placeholder-[#64748b] text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#1e2a4a] focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0b1329] text-[#94a3b8] uppercase font-semibold border-b border-[#1e2a4a]">
              <tr>
                <th className="py-2.5 px-3">Item / SKU</th>
                <th className="py-2.5 px-3">Work Order</th>
                <th className="py-2.5 px-3 text-right">Planned Qty</th>
                <th className="py-2.5 px-3 text-right">Issued Qty</th>
                <th className="py-2.5 px-3 text-right">Consumed Qty</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#94a3b8]">
                    No material movements found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-[#f1f5f9]">{m.productName || m.sku}</td>
                    <td className="py-2.5 px-3 font-mono text-[#3b82f6]">{reconciliation.workOrderNo}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#94a3b8]">{m.plannedQuantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#3b82f6]">{m.issuedQuantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">{m.consumedQuantity}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {m.status || "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Issue Material */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Material to Shop Floor"
        size="md"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
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
              value={issueData.workOrderId}
              onChange={(e) => setIssueData({ ...issueData, workOrderId: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  {wo.workOrderNo} — {wo.notes || `Order #${wo.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Material SKU <span className="text-[#3b82f6] text-[10px]">(Work Order BOM / Inventory Items)</span></label>
            <select
              required
              value={issueData.materialSku}
              onChange={(e) => {
                const sku = e.target.value;
                const recItem = reconciliation?.items?.find((i) => i.sku === sku);
                const catalogItem = refData.products?.find((p) => p.sku === sku);
                setIssueData({
                  ...issueData,
                  materialSku: sku,
                  unit: catalogItem?.unit || recItem?.unit || issueData.unit,
                });
              }}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="">-- Select Material / Item SKU --</option>
              {reconciliation?.items?.length > 0 && (
                <optgroup label="Work Order Allocated Items">
                  {reconciliation.items.map((item, idx) => (
                    <option key={`rec-${idx}`} value={item.sku}>
                      {item.sku} · {item.productName || item.name || item.sku} (Req: {item.plannedQuantity ?? item.required ?? 0})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Catalog Materials & Items">
                {refData.products.map((p) => (
                  <option key={p.id} value={p.sku}>
                    {p.sku} · {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Quantity Issued</label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={issueData.quantityIssued}
                onChange={(e) => setIssueData({ ...issueData, quantityIssued: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Unit</label>
              <select
                value={issueData.unit}
                onChange={(e) => setIssueData({ ...issueData, unit: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="MTR">MTR (Metres)</option>
                <option value="NOS">NOS (Numbers)</option>
                <option value="KG">KG (Kilograms)</option>
                <option value="PCS">PCS (Pieces)</option>
                <option value="SET">SET (Sets)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">From Location</label>
              <select
                value={issueData.fromLocation}
                onChange={(e) => setIssueData({ ...issueData, fromLocation: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="">-- Select Store Location --</option>
                {refData.warehouseLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Issued To</label>
              <select
                value={issueData.issuedTo}
                onChange={(e) => setIssueData({ ...issueData, issuedTo: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="">-- Select Operator / Station --</option>
                {refData.users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} {u.role ? `(${u.role})` : ""}
                  </option>
                ))}
                <option value="Shop Floor Holding Station">Shop Floor Holding Station</option>
                <option value="Machine Shop A">Machine Shop A</option>
                <option value="Electroplating Line">Electroplating Line</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button variant="secondary" onClick={() => setIsIssueModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Issuing..." : "Issue Material"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Log Consumption */}
      <Modal
        isOpen={isConsumeModalOpen}
        onClose={() => setIsConsumeModalOpen(false)}
        title="Record Shop-Floor Material Consumption"
        size="md"
      >
        <form onSubmit={handleConsumeSubmit} className="space-y-4 text-xs">
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
              value={consumeData.workOrderId}
              onChange={(e) => setConsumeData({ ...consumeData, workOrderId: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  {wo.workOrderNo} — {wo.notes || `Order #${wo.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Material SKU <span className="text-[#3b82f6] text-[10px]">(Existing Issued Items)</span></label>
            <select
              required
              value={consumeData.materialSku}
              onChange={(e) => setConsumeData({ ...consumeData, materialSku: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="">-- Select Material / Item SKU --</option>
              {reconciliation?.items?.map((item, idx) => (
                <option key={`con-${idx}`} value={item.sku}>
                  {item.sku} · {item.productName || item.sku} (Balance: {item.balanceWithOperator ?? 0})
                </option>
              ))}
              {refData.products.map((p) => (
                <option key={p.id} value={p.sku}>
                  {p.sku} · {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Quantity Consumed</label>
              <input
                type="number"
                step="any"
                required
                value={consumeData.quantityConsumed}
                onChange={(e) => setConsumeData({ ...consumeData, quantityConsumed: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Scrap Generated</label>
              <input
                type="number"
                step="any"
                value={consumeData.scrapQuantity}
                onChange={(e) => setConsumeData({ ...consumeData, scrapQuantity: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button variant="secondary" onClick={() => setIsConsumeModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Logging..." : "Log Consumption"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Return Material */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Return Surplus Material to Store"
        size="md"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
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
              value={returnData.workOrderId}
              onChange={(e) => setReturnData({ ...returnData, workOrderId: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  {wo.workOrderNo} — {wo.notes || `Order #${wo.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Material SKU <span className="text-[#3b82f6] text-[10px]">(Existing Issued Items)</span></label>
            <select
              required
              value={returnData.materialSku}
              onChange={(e) => setReturnData({ ...returnData, materialSku: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="">-- Select Material / Item SKU --</option>
              {reconciliation?.items?.map((item, idx) => (
                <option key={`ret-${idx}`} value={item.sku}>
                  {item.sku} · {item.productName || item.sku} (Balance: {item.balanceWithOperator ?? 0})
                </option>
              ))}
              {refData.products.map((p) => (
                <option key={p.id} value={p.sku}>
                  {p.sku} · {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Quantity Returned</label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={returnData.quantityReturned}
                onChange={(e) => setReturnData({ ...returnData, quantityReturned: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">To Location</label>
              <select
                value={returnData.toLocation}
                onChange={(e) => setReturnData({ ...returnData, toLocation: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="">-- Select Return Location --</option>
                {refData.warehouseLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Reason for Return</label>
            <select
              value={returnData.reason}
              onChange={(e) => setReturnData({ ...returnData, reason: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="">-- Select Return Reason --</option>
              <option value="Excess Material Returned">Excess Material Returned</option>
              <option value="Shift Finished">Shift Finished</option>
              <option value="Specification Change">Specification Change</option>
              <option value="Damaged Material">Damaged Material</option>
              <option value="Defective Raw Stock">Defective Raw Stock</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button variant="secondary" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Returning..." : "Return to Store"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
