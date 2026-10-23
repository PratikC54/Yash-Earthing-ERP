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
  Download,
  Printer
} from 'lucide-react';

import { engineeringService } from '../../services/engineeringService';
import AddProductModal from './AddProductModal';
import BOMEditorModal from './BOMEditorModal';
import CostingPolicyModal from './CostingPolicyModal';
import ShortageCalculatorModal from './ShortageCalculatorModal';
import AddDrawingModal from './AddDrawingModal';

export default function EngineeringDashboard({ initialTab = 'products', onNavigate }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'products', 'boms', 'drawings'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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
    const downloadUrl = `${baseUrl}/engineering/drawings/${drwId}/download?format=${format}${format === 'html' ? '&download=true' : ''}`;
    window.open(downloadUrl, '_blank');
  };

  const handleExportProductReport = (productId) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    const reportUrl = `${baseUrl}/engineering/products/${productId}/report?download=true`;
    window.open(reportUrl, '_blank');
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

      {/* 4 KPI Cards (Dark Navy & Cyber Steel Theme) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-2xl bg-[#10182f] border border-[#1e2a4a] shadow-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Products</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">{kpis.activeProducts}</div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1">Single Master Catalog</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-2xl bg-[#10182f] border border-[#1e2a4a] shadow-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Released BOMs</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">{kpis.releasedBoms}</div>
            <div className="text-[11px] text-cyan-400 font-semibold mt-1">Frozen Cost Snapshots</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-2xl bg-[#10182f] border border-[#1e2a4a] shadow-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Released Drawings</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">{kpis.releasedDrawings}</div>
            <div className="text-[11px] text-indigo-400 font-semibold mt-1">Shop-Floor Approved</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-2xl bg-[#10182f] border border-[#1e2a4a] shadow-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Material Shortages</div>
            <div className="text-2xl font-mono font-bold text-amber-400 mt-1">{kpis.materialShortages}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Handed to Procurement (M2)</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#1e2a4a] space-x-8 text-sm font-bold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'products'
              ? 'border-b-2 border-cyan-400 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Product & Spec Master</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-[#0a1020] border border-slate-800 text-slate-300">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('boms')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'boms'
              ? 'border-b-2 border-cyan-400 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>BOM & Costing</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-[#0a1020] border border-slate-800 text-slate-300">
            {boms.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('drawings')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'drawings'
              ? 'border-b-2 border-cyan-400 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Controlled Drawings & Media</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-[#0a1020] border border-slate-800 text-slate-300">
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#10182f] p-4 rounded-2xl border border-[#1e2a4a] shadow-xl">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by SKU, Name, Material..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0a1020] border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#0a1020] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="">All Product Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Table */}
            <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1329] border-b border-[#1e2a4a] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">SKU / Code</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-3">Size / Length</th>
                    <th className="py-3 px-3">Finish / Coating</th>
                    <th className="py-3 px-3 text-right">List Rate</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Datasheet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2a4a]/60">
                  {filteredProducts.map((p) => {
                    const isSelected = selectedProduct?.id === p.id;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-blue-950/50 border-l-2 border-l-cyan-400' : 'hover:bg-slate-800/40 text-slate-200'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                          {p.sku}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{p.name}</div>
                          <div className="text-[11px] text-slate-400 font-sans">{p.material}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {p.size || '—'} {p.length ? `· ${p.length}` : ''}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {p.finish || 'Standard'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          ₹{Number(p.rate).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleExportProductReport(p.id)}
                            title="Export / Print Official Registry Report (PDF)"
                            className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-cyan-300 border border-blue-500/30 rounded-lg font-bold text-[11px] transition inline-flex items-center space-x-1"
                          >
                            <Printer className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No matching products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right-Hand Reference Panel */}
          <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-xl space-y-5 text-white">
            {selectedProduct ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                      {selectedProduct.sku}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">{selectedProduct.name}</h3>
                    <p className="text-xs text-slate-400">{selectedProduct.itemType} Master Record</p>
                  </div>
                  <button
                    onClick={() => handleArchiveProduct(selectedProduct.id)}
                    title="Archive Product"
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500/30 rounded-lg transition"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>

                {/* Reference Image Panel */}
                <div className="relative rounded-xl overflow-hidden border border-[#1e2a4a] bg-[#0a1020] aspect-video shadow-inner flex items-center justify-center">
                  <img
                    src={selectedProduct.referenceImage || selectedProduct.imageUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80"}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80";
                    }}
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 backdrop-blur-sm text-cyan-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                    Standard Spec Sheet
                  </span>
                </div>

                {/* Technical Specifications Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Approved Technical Specifications</span>
                    <span className="text-[10px] text-slate-400 font-normal">Standard / Compliance</span>
                  </h4>

                  <div className="border border-[#1e2a4a] rounded-xl overflow-hidden divide-y divide-[#1e2a4a] text-xs">
                    {selectedProduct.specifications?.map((sp, idx) => (
                      <div key={idx} className="p-2.5 flex justify-between items-center bg-[#0a1020]">
                        <div>
                          <div className="font-semibold text-slate-200">{sp.attribute}</div>
                          <div className="text-[10px] text-slate-400">{sp.standard}</div>
                        </div>
                        <div className="font-mono font-bold text-cyan-300">
                          {sp.value} {sp.unit}
                        </div>
                      </div>
                    ))}
                    {(!selectedProduct.specifications || selectedProduct.specifications.length === 0) && (
                      <div className="p-3 text-center text-slate-400 text-xs bg-[#0a1020]">
                        No technical attributes configured.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Commercial summary for Sales & M1 */}
                <div className="p-3 bg-[#0a1020] border border-[#1e2a4a] rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">List Price (Excl. Tax):</span>
                    <span className="font-mono font-bold text-cyan-300">₹{selectedProduct.rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Applicable GST:</span>
                    <span className="font-mono font-bold text-white">{selectedProduct.gstPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unit of Measurement:</span>
                    <span className="font-mono font-bold text-white">{selectedProduct.uom}</span>
                  </div>
                </div>

                {/* Official Registry PDF Report Trigger */}
                <div className="pt-1">
                  <button
                    onClick={() => handleExportProductReport(selectedProduct.id)}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center space-x-2 transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Export Official Datasheet / Registry Report (PDF)</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    Includes company header, product photo, technical parameters, released BOM recipe & ISO compliance sign-offs.
                  </p>
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
          <div className="bg-[#10182f] p-4 rounded-2xl border border-[#1e2a4a] shadow-xl flex justify-between items-center text-white">
            <div>
              <h2 className="text-sm font-bold text-white">Manufacturing Bills of Materials (BOM)</h2>
              <p className="text-xs text-slate-400">Multilevel raw materials, scrap allowances, and frozen cost snapshots</p>
            </div>
            <div className="text-xs font-mono bg-[#0a1020] px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              Active Costing Policy: <span className="font-bold text-cyan-300">{costingPolicy?.name}</span>
            </div>
          </div>

          <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1329] border-b border-[#1e2a4a] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">BOM Code</th>
                  <th className="py-3 px-4">Target Product Master</th>
                  <th className="py-3 px-3">Active Revisions</th>
                  <th className="py-3 px-3">Current Status</th>
                  <th className="py-3 px-3 text-right">Frozen Total Cost</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a4a]/60">
                {boms.map((b) => {
                  const latestRev = b.revisions?.[b.revisions.length - 1] || {};
                  const releasedRev = b.revisions?.find(r => r.status === 'RELEASED');
                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 text-slate-200 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-400">
                        {b.bomCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{b.product?.name || b.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{b.product?.sku}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-1.5">
                          {b.revisions?.map((r) => (
                            <span
                              key={r.id}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.status === 'RELEASED'
                                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
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
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}>
                          {releasedRev ? `${releasedRev.revisionCode} (RELEASED)` : 'IN DRAFT'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                        {releasedRev?.costSnapshot ? (
                          <span>₹{Number(releasedRev.costSnapshot.totalCost).toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-500 font-normal">Pending Release</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => {
                              setActiveEditingBom(b);
                              setIsBomEditorOpen(true);
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/30 transition"
                          >
                            Open BOM Editor
                          </button>
                          {b.product?.id && (
                            <button
                              onClick={() => handleExportProductReport(b.product.id)}
                              title="Export Technical Registry & Cost Report (PDF)"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
          <div className="bg-[#10182f] p-4 rounded-2xl border border-[#1e2a4a] shadow-xl flex justify-between items-center text-white">
            <div>
              <h2 className="text-sm font-bold text-white">Engineering Drawing & CAD Media Registry</h2>
              <p className="text-xs text-slate-400">Strictly controlled drawings. Factory floor is restricted to Released revisions only.</p>
            </div>
            <button
              onClick={() => setIsAddDrawingOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/30 transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Register Drawing</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {drawings.map((d) => (
              <div key={d.id} className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-4 shadow-xl space-y-3 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-cyan-300 bg-blue-950/40 border border-blue-500/30 px-2 py-0.5 rounded">
                      {d.drawingNo}
                    </span>
                    <h3 className="text-xs font-bold text-white mt-1">{d.title}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    d.status === 'RELEASED'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                  }`}>
                    {d.status}
                  </span>
                </div>

                <div className="p-3 bg-[#0a1020] border border-slate-800 rounded-xl text-xs space-y-1 font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="font-bold text-white">{d.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Latest Revision:</span>
                    <span className="font-bold text-cyan-300">{d.latestRevision}</span>
                  </div>
                </div>

                <div className="pt-2.5 flex items-center justify-between gap-2 border-t border-[#1e2a4a]">
                  <div className="flex items-center space-x-2 w-full">
                    <button
                      onClick={() => handleDrawingDownload(d.id, 'html')}
                      className="flex-1 py-1.5 px-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/30 transition"
                      title="Download or Print dynamic CAD blueprint with CTQ quality inspection checklist"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                    <button
                      onClick={() => handleDrawingDownload(d.id, 'dxf')}
                      className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center space-x-1 border border-slate-700 transition"
                      title="Download AutoCAD standard DXF CAD vector file"
                    >
                      <Download className="w-3.5 h-3.5" />
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
        onNavigate={onNavigate}
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
