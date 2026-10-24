import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, AlertCircle, Info, ShoppingCart, Package, Send, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../auth';

export default function CreateBOMModal({
  isOpen,
  onClose,
  products = [],
  salesOrders = [],
  workOrders = [],
  costingPolicy,
  onBomCreated
}) {
  const { user } = useAuth?.() || {};

  // Defensively normalize arrays to prevent runtime errors from varying API response shapes
  const safeProducts = Array.isArray(products)
    ? products
    : (Array.isArray(products?.data) ? products.data : []);

  const safeSalesOrders = Array.isArray(salesOrders)
    ? salesOrders
    : (Array.isArray(salesOrders?.orders)
        ? salesOrders.orders
        : (Array.isArray(salesOrders?.data?.orders)
            ? salesOrders.data.orders
            : (Array.isArray(salesOrders?.data)
                ? salesOrders.data
                : [])));

  const safeWorkOrders = Array.isArray(workOrders)
    ? workOrders
    : (Array.isArray(workOrders?.data?.workOrders)
        ? workOrders.data.workOrders
        : (Array.isArray(workOrders?.data)
            ? workOrders.data
            : (Array.isArray(workOrders?.workOrders)
                ? workOrders.workOrders
                : [])));

  // Check if current user has executive/lead engineering authority
  const userRole = (user?.role || '').toUpperCase();
  const isAdminOrLead = [
    'ADMIN',
    'SUPER_ADMIN',
    'ENGINEERING_HEAD',
    'TECHNICAL_DIRECTOR',
    'RND_ENGINEER',
    'PRODUCTION_MANAGER'
  ].includes(userRole) || userRole === 'ADMIN' || !userRole;

  // Finished manufactured products that can have a BOM
  const manufacturedProducts = safeProducts.filter(
    (p) => p.itemType === 'FINISHED' || !p.itemType
  );

  // Connected Module Chain Source: 'CATALOG' | 'SALES_ORDER' | 'WORK_ORDER'
  const [sourceType, setSourceType] = useState('CATALOG');

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('');
  const [bomCode, setBomCode] = useState('');
  const [revisionCode, setRevisionCode] = useState('Rev A');
  const [changeNote, setChangeNote] = useState('');
  const [submitForAdminReview, setSubmitForAdminReview] = useState(!isAdminOrLead);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-initialize when modal opens or source changes
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    setSubmitForAdminReview(!isAdminOrLead);

    if (sourceType === 'CATALOG') {
      const defaultProd = manufacturedProducts[0] || safeProducts[0];
      if (defaultProd) {
        setSelectedProductId(defaultProd.id);
        setBomCode(`BOM-${defaultProd.sku}`);
        setChangeNote('Standard engineering master recipe formulation for catalog finished goods.');
      }
    } else if (sourceType === 'SALES_ORDER') {
      const defaultOrder = safeSalesOrders[0];
      if (defaultOrder) {
        setSelectedOrderId(defaultOrder.id || defaultOrder.orderNumber);
        // Map connected product
        const orderItem = defaultOrder.items?.[0];
        const matchedProd = safeProducts.find(p => p.id === orderItem?.productId || p.sku === orderItem?.product?.sku) || manufacturedProducts[0];
        if (matchedProd) setSelectedProductId(matchedProd.id);
        const orderNum = defaultOrder.orderNumber || defaultOrder.orderNo || 'SO-CUSTOM';
        setBomCode(`BOM-${orderNum}`);
        setChangeNote(`Customer-specific engineering recipe for Order ${orderNum} (${defaultOrder.customer?.name || 'Client'}) per project design specification.`);
      } else {
        const defaultProd = manufacturedProducts[0] || safeProducts[0];
        if (defaultProd) setSelectedProductId(defaultProd.id);
        setBomCode('BOM-SO-CUSTOM');
        setChangeNote('Custom sales quotation formulation.');
      }
    } else if (sourceType === 'WORK_ORDER') {
      const defaultWo = safeWorkOrders[0];
      if (defaultWo) {
        const woNum = defaultWo.workOrderNumber || defaultWo.workOrderNo || defaultWo.id || 'WO-001';
        setSelectedWorkOrderId(defaultWo.id || woNum);
        const matchedProd = safeProducts.find(p => p.name === defaultWo.productName || p.id === defaultWo.productId) || manufacturedProducts[0];
        if (matchedProd) setSelectedProductId(matchedProd.id);
        setBomCode(`BOM-${woNum}`);
        setChangeNote(`Factory floor recipe formulation for Work Order ${woNum} (Assigned Line: ${defaultWo.assignedLine || 'Assembly'}).`);
      } else {
        const defaultProd = manufacturedProducts[0] || safeProducts[0];
        if (defaultProd) setSelectedProductId(defaultProd.id);
        setBomCode('BOM-WO-CUSTOM');
        setChangeNote('Shopfloor work order formulation.');
      }
    }
  }, [isOpen, sourceType, safeProducts.length, safeSalesOrders.length, safeWorkOrders.length]);

  if (!isOpen) return null;

  const selectedProduct = safeProducts.find((p) => String(p.id) === String(selectedProductId)) || manufacturedProducts[0];
  const selectedOrder = safeSalesOrders.find(
    (o) => String(o.id) === String(selectedOrderId) || o.orderNumber === selectedOrderId
  );
  const selectedWorkOrder = safeWorkOrders.find(
    (w) => String(w.id) === String(selectedWorkOrderId) || (w.workOrderNumber || w.workOrderNo) === selectedWorkOrderId
  );

  const handleProductSelect = (prodId) => {
    setSelectedProductId(prodId);
    const prod = safeProducts.find((p) => String(p.id) === String(prodId));
    if (prod && sourceType === 'CATALOG') {
      setBomCode(`BOM-${prod.sku}`);
    }
  };

  const handleSalesOrderSelect = (orderVal) => {
    setSelectedOrderId(orderVal);
    const order = safeSalesOrders.find(
      (o) => String(o.id) === String(orderVal) || o.orderNumber === orderVal
    );
    if (order) {
      const orderNum = order.orderNumber || order.orderNo || 'SO-CUSTOM';
      const orderItem = order.items?.[0];
      const matchedProd = safeProducts.find(p => p.id === orderItem?.productId || p.sku === orderItem?.product?.sku) || selectedProduct;
      if (matchedProd) setSelectedProductId(matchedProd.id);
      setBomCode(`BOM-${orderNum}`);
      setChangeNote(`Customer-specific engineering recipe for Order ${orderNum} (${order.customer?.name || 'Client'}) per project design specification.`);
    }
  };

  const handleWorkOrderSelect = (woVal) => {
    setSelectedWorkOrderId(woVal);
    const wo = safeWorkOrders.find(
      (w) => String(w.id) === String(woVal) || (w.workOrderNumber || w.workOrderNo) === woVal
    );
    if (wo) {
      const woNum = wo.workOrderNumber || wo.workOrderNo || 'WO';
      const matchedProd = safeProducts.find(p => p.name === wo.productName || p.id === wo.productId) || selectedProduct;
      if (matchedProd) setSelectedProductId(matchedProd.id);
      setBomCode(`BOM-${woNum}`);
      setChangeNote(`Factory floor recipe formulation for Work Order ${woNum} (Assigned Line: ${wo.assignedLine || 'Assembly'}).`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError('Please select a target finished product.');
      return;
    }
    if (!bomCode.trim()) {
      setError('BOM Code is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        productId: selectedProductId,
        bomCode: bomCode.trim(),
        revisionCode: revisionCode.trim() || 'Rev A',
        changeReason: changeNote.trim(),
        title: `Bill of Materials for ${selectedProduct?.name || selectedProduct?.sku || bomCode}`,
        connectedSource: sourceType,
        connectedSourceId: sourceType === 'SALES_ORDER' ? selectedOrderId : sourceType === 'WORK_ORDER' ? selectedWorkOrderId : null,
        connectedSourceRef: sourceType === 'SALES_ORDER' ? selectedOrder?.orderNumber : sourceType === 'WORK_ORDER' ? (selectedWorkOrder?.workOrderNumber || selectedWorkOrder?.workOrderNo) : null,
        customerName: selectedOrder?.customer?.name || null,
        orderNo: selectedOrder?.orderNumber || null,
        workOrderNo: selectedWorkOrder?.workOrderNumber || selectedWorkOrder?.workOrderNo || null,
        initialStatus: submitForAdminReview ? 'IN_REVIEW' : 'DRAFT'
      };

      await onBomCreated(payload);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to initialize Bill of Materials'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0c1222] text-[#d4ff00] flex items-center justify-center font-black shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0f172a] tracking-tight">
                + Create Bill of Materials (BOM)
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Module 3: Engineering Master Recipe Formulation & Connected Chain
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Connected Flow Source Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Connected Module Origin <span className="text-slate-400 font-normal">(Select where this recipe is requested from)</span>
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSourceType('CATALOG')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                  sourceType === 'CATALOG'
                    ? 'bg-[#0c1222] text-[#d4ff00] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Standard Master</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('SALES_ORDER')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                  sourceType === 'SALES_ORDER'
                    ? 'bg-[#0c1222] text-[#d4ff00] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Sales Order (M1)</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('WORK_ORDER')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                  sourceType === 'WORK_ORDER'
                    ? 'bg-[#0c1222] text-[#d4ff00] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Work Order (M4)</span>
              </button>
            </div>
          </div>

          {/* Connected Sales Order Context */}
          {sourceType === 'SALES_ORDER' && (
            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-purple-900">
                Connected Sales Order / Custom Client Requirement <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => handleSalesOrderSelect(e.target.value)}
                className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0c1222] shadow-xs"
                required
              >
                {safeSalesOrders.length === 0 ? (
                  <option value="SO-2026-118">SO-2026-118 — SuryaGrid Projects (130 NOS)</option>
                ) : (
                  safeSalesOrders.map((so) => (
                    <option key={so.id || so.orderNumber} value={so.id || so.orderNumber}>
                      {so.orderNumber} — {so.customer?.name || 'Client'} ({Number(so.grandTotal || so.totalAmount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })})
                    </option>
                  ))
                )}
              </select>

              {selectedOrder && (
                <div className="grid grid-cols-2 gap-2 text-[11px] text-purple-950 font-medium pt-1">
                  <div>Customer: <span className="font-bold">{selectedOrder.customer?.name || 'SuryaGrid Projects'}</span></div>
                  <div>PO No: <span className="font-mono font-bold">{selectedOrder.customerPONumber || 'PO-CONTRACT'}</span></div>
                </div>
              )}
            </div>
          )}

          {/* Connected Work Order Context */}
          {sourceType === 'WORK_ORDER' && (
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-blue-900">
                Connected Shopfloor Work Order (Needs Formulation) <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedWorkOrderId}
                onChange={(e) => handleWorkOrderSelect(e.target.value)}
                className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0c1222] shadow-xs"
                required
              >
                {safeWorkOrders.length === 0 ? (
                  <option value="WO-2026-001">WO-2026-001 — Copper Bonding Receptacle (500 NOS)</option>
                ) : (
                  safeWorkOrders.map((wo) => (
                    <option key={wo.id || wo.workOrderNumber || wo.workOrderNo} value={wo.id || wo.workOrderNumber || wo.workOrderNo}>
                      {wo.workOrderNumber || wo.workOrderNo} — {wo.productName || 'Finished Good'} ({wo.plannedQuantity || 100} NOS)
                    </option>
                  ))
                )}
              </select>

              {selectedWorkOrder && (
                <div className="grid grid-cols-2 gap-2 text-[11px] text-blue-950 font-medium pt-1">
                  <div>Line: <span className="font-bold">{selectedWorkOrder.assignedLine || 'Line 1 - Automated Earthing Assembly'}</span></div>
                  <div>Batch: <span className="font-mono font-bold">{selectedWorkOrder.plannedQuantity || 100} NOS</span></div>
                </div>
              )}
            </div>
          )}

          {/* Product Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Finished Product Master <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#0c1222] shadow-xs cursor-pointer"
              required
            >
              <option value="" disabled>-- Select Finished Product Master --</option>
              {manufacturedProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name} (₹{Number(p.rate || 0).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          {/* BOM Code & Revision */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                BOM Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={bomCode}
                onChange={(e) => setBomCode(e.target.value)}
                placeholder="e.g. BOM-CBP-600-3M"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Initial Revision Code
              </label>
              <input
                type="text"
                value={revisionCode}
                onChange={(e) => setRevisionCode(e.target.value)}
                placeholder="Rev A"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
                required
              />
            </div>
          </div>

          {/* Change Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Engineering Change Note / Purpose
            </label>
            <textarea
              rows={2}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="e.g. Initial production release for substation earthing projects."
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#0c1222] shadow-xs"
            />
          </div>

          {/* Role-based Dynamic Workflow Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                <UserCheck className="w-4 h-4 text-slate-600" />
                <span>Requestor Role:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0c1222] text-[#d4ff00]">
                  {user?.role || user?.designation || 'Production Manager'}
                </span>
              </div>
              {isAdminOrLead ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Admin Authority Active</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 border border-purple-300 px-2 py-0.5 rounded-md flex items-center space-x-1">
                  <Send className="w-3 h-3 text-purple-600" />
                  <span>Admin Review Flow</span>
                </span>
              )}
            </div>

            {isAdminOrLead ? (
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={submitForAdminReview}
                  onChange={(e) => setSubmitForAdminReview(e.target.checked)}
                  className="rounded border-slate-300 text-black focus:ring-black w-4 h-4 cursor-pointer"
                />
                <span>Route as Pending Review request instead of immediate draft</span>
              </label>
            ) : (
              <p className="text-[11px] text-slate-600 leading-relaxed">
                As a team requestor, this BOM draft will be linked to the connected module chain and automatically queued for Enterprise Admin review & engineering approval.
              </p>
            )}
          </div>

          {/* Costing Policy notice */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 leading-relaxed font-medium">
              Upon creating this BOM, the recipe editor will open with auto-applied shopfloor costing policy: <span className="font-bold">Labour ₹{costingPolicy?.labourCostPerUnit || 108}</span>, <span className="font-bold">Overhead {costingPolicy?.overheadPercent || 12}%</span>, and <span className="font-bold">Margin +{costingPolicy?.targetMarginPercent || 28}%</span>.
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#bce600] text-black text-xs font-black shadow-md flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {submitForAdminReview ? (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting Request...' : 'Submit BOM Request to Admin'}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating BOM...' : 'Create BOM & Open Editor'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
