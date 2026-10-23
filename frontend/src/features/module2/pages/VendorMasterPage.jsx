import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  ShieldAlert,
  X,
  Phone,
  Mail,
  Building,
  CreditCard,
  Star,
  Clock,
  CheckCheck,
} from "lucide-react";
import * as api from "../api/procurementApi";
import StatusBadge from "../components/common/StatusBadge";
import { LoadingSkeleton, EmptyState, ErrorAlert } from "../components/common/StateFeedback";

export default function VendorMasterPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Selected vendor for detail drawer
  const [selectedVendor, setSelectedVendor] = useState(null);
  // Modal for Create/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
      };
      const res = await api.getVendors(params);
      if (res.success) {
        setVendors(res.vendors || res.data || []);
        const pag = res.pagination || res.meta;
        if (pag) {
          setPagination((prev) => ({
            ...prev,
            total: pag.total,
            totalPages: pag.totalPages,
          }));
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load vendors from server.");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Handle soft-deactivation toggle
  const handleToggleActive = async (vendor) => {
    try {
      const res = await api.toggleVendorActive(vendor.id);
      if (res.success) {
        setActionSuccess(`Vendor ${vendor.name} status updated.`);
        fetchVendors();
        if (selectedVendor && selectedVendor.id === vendor.id) {
          setSelectedVendor(res.data);
        }
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update vendor status");
    }
  };

  // Handle permanent deletion (Authorized for Procurement Officer / Admin)
  const handleDeleteVendor = async (vendor) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete vendor "${vendor.name}" (${vendor.code})?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await api.deleteVendorPermanently(vendor.id);
      if (res.success) {
        setActionSuccess(`Vendor ${vendor.name} deleted permanently.`);
        if (selectedVendor && selectedVendor.id === vendor.id) {
          setSelectedVendor(null);
        }
        fetchVendors();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete vendor.";
      alert(msg);
      setError(msg);
    }
  };

  // Form controlled inputs to prevent data loss on submit failure
  const [vendorFormData, setVendorFormData] = useState({
    code: "",
    name: "",
    category: "Raw Materials",
    contactName: "",
    phone: "",
    email: "",
    city: "",
    gstin: "",
    paymentTerms: "Net 30",
    notes: "",
  });

  const handleFormFieldChange = (e) => {
    const { name, value } = e.target;
    setVendorFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Open Form
  const openCreateModal = () => {
    setEditingVendor(null);
    setFormErrors({});
    setVendorFormData({
      code: "",
      name: "",
      category: "Raw Materials",
      contactName: "",
      phone: "",
      email: "",
      city: "",
      gstin: "",
      paymentTerms: "Net 30",
      notes: "",
    });
    setIsFormOpen(true);
  };

  const openEditModal = (vendor) => {
    setEditingVendor(vendor);
    setFormErrors({});
    setVendorFormData({
      code: vendor.code || "",
      name: vendor.name || "",
      category: vendor.category || "Raw Materials",
      contactName: vendor.contactName || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      city: vendor.city || "",
      gstin: vendor.gstin || "",
      paymentTerms: vendor.paymentTerms || "Net 30",
      notes: vendor.notes || "",
    });
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: vendorFormData.name?.trim(),
      code: vendorFormData.code?.trim().toUpperCase(),
      category: vendorFormData.category?.trim() || null,
      contactName: vendorFormData.contactName?.trim() || null,
      email: vendorFormData.email?.trim() || null,
      phone: vendorFormData.phone?.trim() || null,
      city: vendorFormData.city?.trim() || null,
      gstin: vendorFormData.gstin?.trim().toUpperCase() || null,
      paymentTerms: vendorFormData.paymentTerms?.trim() || null,
      notes: vendorFormData.notes?.trim() || null,
    };

    // Client-side quick check
    const errors = {};
    if (!payload.name) errors.name = "Company name is required";
    if (!editingVendor && !payload.code) errors.code = "Unique vendor code is required";
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      errors.email = "Invalid email format";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setFormErrors({});
      if (editingVendor) {
        // Code cannot be modified after creation per backend schema validator
        delete payload.code;
        await api.updateVendor(editingVendor.id, payload);
        setActionSuccess(`Vendor ${editingVendor.name} updated successfully.`);
      } else {
        await api.createVendor(payload);
        setActionSuccess(`Vendor ${payload.name} registered successfully.`);
      }
      setIsFormOpen(false);
      fetchVendors();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const backendErrors = {};
        err.response.data.errors.forEach((issue) => {
          backendErrors[issue.field] = issue.message;
        });
        setFormErrors(backendErrors);
      } else {
        const msg = err.response?.data?.message || err.message || "Failed to communicate with vendor service.";
        setFormErrors({ general: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-[#edf1f7] text-slate-800 min-h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60 shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Vendor Directory
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Supplier master records, contact credentials, compliance, and delivery performance metrics
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#141d30] text-white hover:bg-slate-800 active:scale-98 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Vendor</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={fetchVendors} />}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            placeholder="Search vendor name, code, city, GSTIN..."
            className="w-full bg-[#f8fafc] text-xs text-slate-800 placeholder-slate-400 pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="bg-[#f8fafc] text-xs text-slate-700 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Raw Materials">Raw Materials</option>
            <option value="Bought-Out Parts">Bought-Out Parts</option>
            <option value="Chemicals / Coatings">Chemicals / Coatings</option>
            <option value="Packaging & Transport">Packaging & Transport</option>
            <option value="Services">Services</option>
          </select>

          {/* Status Filter */}
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "all" ? "bg-white text-slate-900 font-semibold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "active" ? "bg-white text-slate-900 font-semibold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "inactive" ? "bg-white text-slate-900 font-semibold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Vendors Display: Responsive Cards on Mobile (< 768px), Table on Desktop */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : vendors.length === 0 ? (
          <EmptyState
            title="No vendors found"
            message={search ? "No vendor matches your search criteria." : "Start by registering your first supplier or vendor."}
            actionLabel="Add New Vendor"
            onAction={openCreateModal}
            icon={Users}
          />
        ) : (
          <>
            {/* Mobile Cards List (< md screens) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  onClick={() => setSelectedVendor(vendor)}
                  className="p-4 space-y-3 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-600 block">{vendor.code}</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{vendor.name}</h4>
                      {vendor.gstin && (
                        <span className="text-[10px] font-mono text-slate-400 block">GSTIN: {vendor.gstin}</span>
                      )}
                    </div>
                    <StatusBadge status={vendor.isActive ? "ACTIVE" : "INACTIVE"} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100/80">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                      <span className="font-medium text-slate-800">{vendor.category || "General"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Location</span>
                      <span className="font-medium text-slate-800">{vendor.city || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact</span>
                      <span className="font-medium text-slate-800 truncate block">{vendor.contactName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                      <span className="font-medium font-mono text-slate-800">{vendor.phone || "—"}</span>
                    </div>
                  </div>

                  {/* Mobile Actions Bar */}
                  <div
                    className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedVendor(vendor)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(vendor)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(vendor)}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1 ${
                        vendor.isActive
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {vendor.isActive ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVendor(vendor)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                      title="Permanently Delete Vendor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    <th className="py-3 px-4 font-semibold">CODE</th>
                    <th className="py-3 px-4 font-semibold">COMPANY NAME</th>
                    <th className="py-3 px-4 font-semibold">CATEGORY</th>
                    <th className="py-3 px-4 font-semibold">LOCATION</th>
                    <th className="py-3 px-4 font-semibold">CONTACT</th>
                    <th className="py-3 px-4 font-semibold text-center">ON-TIME %</th>
                    <th className="py-3 px-4 font-semibold text-center">QUALITY</th>
                    <th className="py-3 px-4 font-semibold">STATUS</th>
                    <th className="py-3 px-4 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedVendor(vendor)}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                        {vendor.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{vendor.name}</div>
                        {vendor.gstin && (
                          <div className="text-[10px] font-mono text-slate-400 font-normal">
                            GST: {vendor.gstin}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {vendor.category || "General"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {vendor.city ? `${vendor.city}${vendor.state ? `, ${vendor.state}` : ""}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{vendor.contactName || "—"}</div>
                        {vendor.phone && <div className="text-[10px] text-slate-400">{vendor.phone}</div>}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {vendor.onTimeDeliveryPercent != null ? (
                          <span className="font-semibold text-slate-700">
                            {Number(vendor.onTimeDeliveryPercent).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {vendor.qualityScore != null ? (
                          <span className="font-semibold text-slate-700">
                            {Number(vendor.qualityScore).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={vendor.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td
                        className="py-3 px-4 text-right space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedVendor(vendor)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(vendor)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Edit Vendor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(vendor)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            vendor.isActive
                              ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={vendor.isActive ? "Deactivate Vendor" : "Reactivate Vendor"}
                        >
                          {vendor.isActive ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVendor(vendor)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Permanently Delete Vendor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total vendors)
            </span>
            <div className="space-x-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-2xs transition-all animate-in fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm shadow-2xs">
                    {selectedVendor.code.substring(0, 3)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {selectedVendor.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="font-mono text-xs text-blue-600 font-semibold">{selectedVendor.code}</span>
                      <StatusBadge status={selectedVendor.isActive ? "ACTIVE" : "INACTIVE"} />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVendor(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Performance Cards */}
              <div className="grid grid-cols-2 gap-3 my-5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">On-Time Delivery</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {selectedVendor.onTimeDeliveryPercent != null
                      ? `${Number(selectedVendor.onTimeDeliveryPercent).toFixed(1)}%`
                      : "No data"}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Quality Score</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {selectedVendor.qualityScore != null
                      ? `${Number(selectedVendor.qualityScore).toFixed(1)}%`
                      : "No data"}
                  </div>
                </div>
              </div>

              {/* Vendor Information Details */}
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Primary Contact
                  </span>
                  <div className="flex items-center space-x-2 text-slate-700">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium">{selectedVendor.contactName || "Not assigned"}</span>
                  </div>
                  {selectedVendor.phone && (
                    <div className="flex items-center space-x-2 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedVendor.phone}</span>
                    </div>
                  )}
                  {selectedVendor.email && (
                    <div className="flex items-center space-x-2 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedVendor.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Statutory & Payment Terms
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 text-[11px] block">GSTIN</span>
                      <span className="font-mono font-semibold">{selectedVendor.gstin || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">PAN</span>
                      <span className="font-mono font-semibold">{selectedVendor.pan || "—"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 text-[11px] block">Payment Terms</span>
                      <span className="font-medium">{selectedVendor.paymentTerms || "Standard 30 Days"}</span>
                    </div>
                  </div>
                </div>

                {selectedVendor.notes && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Internal Notes
                    </span>
                    <p className="mt-1 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      {selectedVendor.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  openEditModal(selectedVendor);
                  setSelectedVendor(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer text-xs text-center"
              >
                Edit Vendor
              </button>
              <button
                type="button"
                onClick={() => handleToggleActive(selectedVendor)}
                className={`py-2 px-3 rounded-xl font-semibold transition cursor-pointer text-xs ${
                  selectedVendor.isActive
                    ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                {selectedVendor.isActive ? "Deactivate" : "Activate"}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteVendor(selectedVendor)}
                className="py-2 px-3 rounded-xl font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer text-xs"
                title="Permanently Delete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingVendor ? `Edit Vendor: ${editingVendor.name}` : "Register New Vendor"}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formErrors.general && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {formErrors.general}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Vendor Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    required={!editingVendor}
                    disabled={!!editingVendor}
                    value={vendorFormData.code}
                    onChange={handleFormFieldChange}
                    placeholder="e.g. VEND-COP-01"
                    className="w-full bg-[#f8fafc] disabled:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                  />
                  {formErrors.code && <p className="text-rose-500 text-[11px] mt-0.5">{formErrors.code}</p>}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    name="category"
                    value={vendorFormData.category}
                    onChange={handleFormFieldChange}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Bought-Out Parts">Bought-Out Parts</option>
                    <option value="Chemicals / Coatings">Chemicals / Coatings</option>
                    <option value="Packaging & Transport">Packaging & Transport</option>
                    <option value="Services">Services</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={vendorFormData.name}
                    onChange={handleFormFieldChange}
                    placeholder="e.g. Yash Metal & Alloys Pvt Ltd"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {formErrors.name && <p className="text-rose-500 text-[11px] mt-0.5">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    name="contactName"
                    value={vendorFormData.contactName}
                    onChange={handleFormFieldChange}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={vendorFormData.phone}
                    onChange={handleFormFieldChange}
                    placeholder="e.g. +91 9876543210"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={vendorFormData.email}
                    onChange={handleFormFieldChange}
                    placeholder="e.g. sales@vendor.com"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {formErrors.email && <p className="text-rose-500 text-[11px] mt-0.5">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={vendorFormData.city}
                    onChange={handleFormFieldChange}
                    placeholder="e.g. Pune"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GSTIN</label>
                  <input
                    type="text"
                    name="gstin"
                    value={vendorFormData.gstin}
                    onChange={handleFormFieldChange}
                    placeholder="e.g. 27AABCV1234F1Z5"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Terms</label>
                  <input
                    type="text"
                    name="paymentTerms"
                    value={vendorFormData.paymentTerms}
                    onChange={handleFormFieldChange}
                    placeholder="e.g. Net 30, Advance 50%"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Internal Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  value={vendorFormData.notes}
                  onChange={handleFormFieldChange}
                  placeholder="Notes on delivery reliability, quality certifications, or special agreements..."
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#141d30] hover:bg-slate-800 text-white font-semibold transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingVendor ? "Update Vendor" : "Create Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
