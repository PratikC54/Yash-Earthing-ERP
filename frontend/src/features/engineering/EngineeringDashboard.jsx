import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Calculator,
  Settings,
  Image as ImageIcon,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Archive,
  RefreshCw,
  GitCommit,
  Download
} from 'lucide-react';

import { engineeringService } from '../../services/engineeringService';
import AddProductModal from './AddProductModal';
import BOMEditorModal from './BOMEditorModal';
import CostingPolicyModal from './CostingPolicyModal';
import ShortageCalculatorModal from './ShortageCalculatorModal';
import AddDrawingModal from './AddDrawingModal';

export default function EngineeringDashboard() {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'boms', 'drawings'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [kpis, setKpis] = useState({ activeProducts: 0, releasedBoms: 0, releasedDrawings: 0, materialShortages: 0 });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [costingPolicy, setCostingPolicy] = useState(null);

  // Filters & Selected states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isBomEditorOpen, setIsBomEditorOpen] = useState(false);
  const [activeEditingBom, setActiveEditingBom] = useState(null);
  const [isCostingPolicyOpen, setIsCostingPolicyOpen] = useState(false);
  const [isShortageCheckOpen, setIsShortageCheckOpen] = useState(false);
  const [isAddDrawingOpen, setIsAddDrawingOpen] = useState(false);

  // Load all initial engineering data
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [kpiRes, catRes, prodRes, bomRes, drawRes, policyRes] = await Promise.all([
        engineeringService.getDashboardKpis(),
        engineeringService.getCategories(),
        engineeringService.getProducts(),
        engineeringService.getBoms(),
        engineeringService.getDrawings(),
        engineeringService.getCostingPolicy()
      ]);

      setKpis(kpiRes.data);
      setCategories(catRes.data);
      setProducts(prodRes.data);
      setBoms(bomRes.data);
      setDrawings(drawRes.data);
      setCostingPolicy(policyRes.data);

      if (prodRes.data.length > 0 && !selectedProduct) {
        setSelectedProduct(prodRes.data[0]);
      }
    } catch (err) {
      console.error('Failed to load engineering data:', err);
      setError('Unable to load engineering records from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleProductCreated = async (productData) => {
    await engineeringService.createProduct(productData);
    await loadData();
  };

  const handleArchiveProduct = async (id) => {
    if (!window.confirm('Are you sure you want to archive this product? It will be disabled for future BOMs and Quotations.')) return;
    await engineeringService.archiveProduct(id);
    await loadData();
  };

  const handleSaveBomItems = async (revisionId, items) => {
    await engineeringService.updateRevisionItems(revisionId, { items });
    await loadData();
    // Refresh active editing bom
    const refreshed = await engineeringService.getBomById(activeEditingBom.productId);
    setActiveEditingBom(refreshed.data);
  };

  const handleSubmitBomRev = async (revId) => {
    await engineeringService.submitRevision(revId);
    await loadData();
    const refreshed = await engineeringService.getBomById(activeEditingBom.productId);
    setActiveEditingBom(refreshed.data);
  };

  const handleApproveBomRev = async (revId) => {
    await engineeringService.approveRevision(revId);
    await loadData();
    const refreshed = await engineeringService.getBomById(activeEditingBom.productId);
    setActiveEditingBom(refreshed.data);
  };

  const handleRejectBomRev = async (revId, comment) => {
    await engineeringService.rejectRevision(revId, comment);
    await loadData();
    const refreshed = await engineeringService.getBomById(activeEditingBom.productId);
    setActiveEditingBom(refreshed.data);
  };

  const handleReleaseBomRev = async (revId) => {
    await engineeringService.releaseRevision(revId);
    await loadData();
    const refreshed = await engineeringService.getBomById(activeEditingBom.productId);
    setActiveEditingBom(refreshed.data);
  };

  const handleCreateNextBomRev = async (bomId, reason) => {
    await engineeringService.createNextRevision(bomId, reason);
    await loadData();
    const refreshed = await engineeringService.getBomById(activeEditingBom.productId);
    setActiveEditingBom(refreshed.data);
  };

  const handleDrawingCreated = async (drawingData) => {
    await engineeringService.createDrawing(drawingData);
    await loadData();
  };

  const handleDrawingDownload = (drwId, format = 'html') => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    const downloadUrl = `${baseUrl}/engineering/drawings/${drwId}/download?format=${format}`;
    window.open(downloadUrl, '_blank');
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.material && p.material.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = !selectedCategory || p.categoryId === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const rawMaterials = products.filter((p) => p.itemType === 'RAW_MATERIAL' || p.itemType === 'COMPONENT');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Title & Process Strip Banner */}
      <div className="bg-[#141d30] border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-600 text-white tracking-wider">
                MODULE 3
              </span>
              <h1 className="text-xl font-extrabold tracking-tight">
                Product & Engineering — Master Control
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Single engineering truth for Sales (M1), Stores (M2), Production (M4), Projects (M5), and Finance (M6)
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap">
            <button
              onClick={() => setIsShortageCheckOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700 flex items-center space-x-2 transition shadow"
            >
              <Calculator className="w-4 h-4" />
              <span>Shortage Calculator</span>
            </button>

            <button
              onClick={() => setIsCostingPolicyOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-slate-700 flex items-center space-x-2 transition shadow"
            >
              <Settings className="w-4 h-4" />
              <span>Costing Policy</span>
            </button>

            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Product</span>
            </button>
          </div>
        </div>

        {/* Process Strip: Product ➔ BOM ➔ Drawing ➔ Production */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center space-x-3 text-xs overflow-x-auto pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Lifecycle Stream:
          </span>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold flex items-center space-x-1.5">
              <span>01. Approved SKU</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold flex items-center space-x-1.5">
              <span>02. Released BOM</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold flex items-center space-x-1.5">
              <span>03. Controlled Drawing</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center space-x-1.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>04. Shop-Floor Production (M4)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards (Matching Module Guide Page 2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Products</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{kpis.activeProducts}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Single Master Catalog</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Released BOMs</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{kpis.releasedBoms}</div>
            <div className="text-[11px] text-blue-600 font-semibold mt-1">Frozen Cost Snapshots</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Released Drawings</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{kpis.releasedDrawings}</div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-1">Shop-Floor Approved</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Material Shortages</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{kpis.materialShortages}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Handed to Procurement (M2)</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-300 space-x-8 text-sm font-bold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'products'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>M3.1 · Product & Spec Master</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('boms')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'boms'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>M3.2 · BOM & Costing</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700">
            {boms.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('drawings')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'drawings'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>M3.3 · Drawing & Media Workspace</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700">
            {drawings.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PRODUCT & SPEC MASTER */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Product Table (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by SKU, Name, Material..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none"
                >
                  <option value="">All Product Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">SKU / Code</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-3">Size / Length</th>
                    <th className="py-3 px-3">Finish / Coating</th>
                    <th className="py-3 px-3 text-right">List Rate</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isSelected = selectedProduct?.id === p.id;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-blue-50/80 font-medium' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          {p.sku}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500 font-sans">{p.material}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {p.size || '—'} {p.length ? `· ${p.length}` : ''}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {p.finish || 'Standard'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                          ₹{Number(p.rate).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No matching products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right-Hand Reference Panel (Matching Module Guide Page 2 Screen) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
            {selectedProduct ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {selectedProduct.sku}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedProduct.name}</h3>
                    <p className="text-xs text-slate-500">{selectedProduct.itemType} Master Record</p>
                  </div>
                  <button
                    onClick={() => handleArchiveProduct(selectedProduct.id)}
                    title="Archive Product"
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>

                {/* Reference Image Panel */}
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-inner flex items-center justify-center">
                  {selectedProduct.referenceImage ? (
                    <img
                      src={selectedProduct.referenceImage}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-xs mt-1">No reference image</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded font-mono">
                    Standard Spec Sheet
                  </span>
                </div>

                {/* Technical Specifications Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Approved Technical Specifications</span>
                    <span className="text-[10px] text-slate-400 font-normal">Standard / Compliance</span>
                  </h4>

                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                    {selectedProduct.specifications?.map((sp, idx) => (
                      <div key={idx} className="p-2.5 flex justify-between items-center bg-slate-50/50">
                        <div>
                          <div className="font-semibold text-slate-800">{sp.attribute}</div>
                          <div className="text-[10px] text-slate-500">{sp.standard}</div>
                        </div>
                        <div className="font-mono font-bold text-slate-900">
                          {sp.value} {sp.unit}
                        </div>
                      </div>
                    ))}
                    {(!selectedProduct.specifications || selectedProduct.specifications.length === 0) && (
                      <div className="p-3 text-center text-slate-400 text-xs">
                        No technical attributes configured.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Commercial summary for Sales & M1 */}
                <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">List Price (Excl. Tax):</span>
                    <span className="font-mono font-bold text-blue-900">₹{selectedProduct.rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Applicable GST:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedProduct.gstPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Unit of Measurement:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedProduct.uom}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Select a product to view technical drawing and specifications.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BOM & COSTING */}
      {activeTab === 'boms' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Manufacturing Bills of Materials (BOM)</h2>
              <p className="text-xs text-slate-500">Multilevel raw materials, scrap allowances, and frozen cost snapshots</p>
            </div>
            <div className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">
              Active Costing Policy: <span className="font-bold text-blue-700">{costingPolicy?.name}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">BOM Code</th>
                  <th className="py-3 px-4">Target Product Master</th>
                  <th className="py-3 px-3">Active Revisions</th>
                  <th className="py-3 px-3">Current Status</th>
                  <th className="py-3 px-3 text-right">Frozen Total Cost</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {boms.map((b) => {
                  const latestRev = b.revisions?.[b.revisions.length - 1] || {};
                  const releasedRev = b.revisions?.find(r => r.status === 'RELEASED');
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                        {b.bomCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{b.product?.name || b.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{b.product?.sku}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-1.5">
                          {b.revisions?.map((r) => (
                            <span
                              key={r.id}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.status === 'RELEASED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {r.revisionCode}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          releasedRev
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {releasedRev ? `${releasedRev.revisionCode} (RELEASED)` : 'IN DRAFT'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {releasedRev?.costSnapshot ? (
                          <span>₹{Number(releasedRev.costSnapshot.totalCost).toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">Pending Release</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setActiveEditingBom(b);
                            setIsBomEditorOpen(true);
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shadow-sm transition"
                        >
                          Open BOM Editor
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DRAWING & MEDIA WORKSPACE */}
      {activeTab === 'drawings' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Engineering Drawing & CAD Media Registry</h2>
              <p className="text-xs text-slate-500">Strictly controlled drawings. Factory floor is restricted to Released revisions only.</p>
            </div>
            <button
              onClick={() => setIsAddDrawingOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Register Drawing</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {drawings.map((d) => (
              <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {d.drawingNo}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 mt-1">{d.title}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    d.status === 'RELEASED' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {d.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1 font-mono text-slate-600">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-bold text-slate-800">{d.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latest Revision:</span>
                    <span className="font-bold text-blue-700">{d.latestRevision}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-mono">Format:</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleDrawingDownload(d.id, 'html')}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded text-[11px] flex items-center space-x-1 transition"
                      title="Open printable engineering blueprint sheet"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Blueprint (PDF)</span>
                    </button>
                    <button
                      onClick={() => handleDrawingDownload(d.id, 'dxf')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] flex items-center space-x-1 transition"
                      title="Download AutoCAD standard DXF CAD vector file"
                    >
                      <Download className="w-3 h-3" />
                      <span>CAD (.DXF)</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wired Modals */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        categories={categories}
        onProductCreated={handleProductCreated}
      />

      <BOMEditorModal
        isOpen={isBomEditorOpen}
        onClose={() => setIsBomEditorOpen(false)}
        bom={activeEditingBom}
        product={activeEditingBom?.product}
        availableComponents={rawMaterials}
        costingPolicy={costingPolicy}
        onSaveItems={handleSaveBomItems}
        onSubmitRevision={handleSubmitBomRev}
        onApproveRevision={handleApproveBomRev}
        onRejectRevision={handleRejectBomRev}
        onReleaseRevision={handleReleaseBomRev}
        onCreateNextRev={handleCreateNextBomRev}
      />

      <CostingPolicyModal
        isOpen={isCostingPolicyOpen}
        onClose={() => setIsCostingPolicyOpen(false)}
        policy={costingPolicy}
        onUpdatePolicy={async (data) => {
          await engineeringService.updateCostingPolicy(data);
          await loadData();
        }}
      />

      <ShortageCalculatorModal
        isOpen={isShortageCheckOpen}
        onClose={() => setIsShortageCheckOpen(false)}
        products={products}
      />

      <AddDrawingModal
        isOpen={isAddDrawingOpen}
        onClose={() => setIsAddDrawingOpen(false)}
        products={products}
        onDrawingCreated={handleDrawingCreated}
      />
    </div>
  );
}
