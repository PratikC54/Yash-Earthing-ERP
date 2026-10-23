import React, { useState, useEffect } from 'react';
import { module5Api } from '../api/module5Api';
import { CyberCard, CyberButton, CyberInput, CyberSelect, StatusBadge } from '../components/CyberUI';
import {
  Headset,
  Plus,
  Search,
  CheckCircle2,
  UserCheck,
  Wrench,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  X,
  Package,
} from 'lucide-react';

export default function ServiceTicketRegisterPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // New ticket state
  const [formData, setFormData] = useState({
    customerId: '',
    salesOrderId: '',
    serialNumber: '',
    issue: '',
    warrantyStart: new Date().toISOString().split('T')[0],
  });

  // Resolve ticket state
  const [resolveForm, setResolveForm] = useState({
    resolutionNotes: '',
    partsUsedName: '',
    partsUsedQty: 1,
  });

  useEffect(() => {
    loadTickets();
  }, [search, statusFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await module5Api.getServiceTickets({ search, status: statusFilter });
      const list = res?.tickets || res?.data || (Array.isArray(res) ? res : []);
      setTickets(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load tickets', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTicket = async (id) => {
    try {
      const res = await module5Api.getServiceTicketById(id);
      setSelectedTicket(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      console.error('Failed to load ticket details', err);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await module5Api.createServiceTicket({
        customerId: Number(formData.customerId),
        salesOrderId: formData.salesOrderId ? Number(formData.salesOrderId) : undefined,
        serialNumber: formData.serialNumber || undefined,
        issue: formData.issue,
        warrantyStart: formData.warrantyStart ? formData.warrantyStart : undefined,
      });
      setIsNewTicketModalOpen(false);
      setFormData({
        customerId: '',
        salesOrderId: '',
        serialNumber: '',
        issue: '',
        warrantyStart: new Date().toISOString().split('T')[0],
      });
      loadTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create service ticket');
    }
  };

  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      const partsUsed = resolveForm.partsUsedName
        ? [{ productId: 1, quantity: Number(resolveForm.partsUsedQty), notes: resolveForm.partsUsedName }]
        : [];

      await module5Api.resolveServiceTicket(selectedTicket.id, {
        resolution: resolveForm.resolutionNotes,
        partsUsed,
      });
      setIsResolveModalOpen(false);
      setResolveForm({ resolutionNotes: '', partsUsedName: '', partsUsedQty: 1 });
      loadTickets();
      if (selectedTicket) {
        handleSelectTicket(selectedTicket.id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve service ticket');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      await module5Api.updateServiceTicketStatus(selectedTicket.id, newStatus);
      handleSelectTicket(selectedTicket.id);
      loadTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1e2a4a]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Headset className="w-5 h-5 text-cyan-400" />
            M5.3 Service Desk & Warranty Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Earthing grid maintenance, dynamic 1-year warranty evaluation, spare parts consumption, and SLA tracking.
          </p>
        </div>
        <CyberButton onClick={() => setIsNewTicketModalOpen(true)}>
          <Plus className="w-4 h-4" /> Open Support Ticket
        </CyberButton>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by ticket number, issue, or serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0a1020] border border-[#1e2a4a] rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0a1020] border border-[#1e2a4a] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="WAITING_PARTS">WAITING PARTS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Service Tickets Table */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-lg overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0b1329] border-b border-[#1e2a4a] text-xs uppercase font-medium text-slate-400">
              <tr>
                <th className="py-3 px-4">Ticket No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Issue Description</th>
                <th className="py-3 px-4">Warranty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Loading tickets...
                  </td>
                </tr>
              ) : (!tickets || tickets.length === 0) ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No service tickets found.
                  </td>
                </tr>
              ) : (
                (tickets || []).map((t) => {
                  const isWarranty = t.warrantyStatus === 'UNDER_WARRANTY';

                  return (
                    <tr
                      key={t.id}
                      onClick={() => handleSelectTicket(t.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-cyan-400 font-medium">
                        {t.ticketNo}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {t.customer?.name || `Customer #${t.customerId}`}
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{t.issue}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            isWarranty
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {isWarranty ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : (
                            <ShieldAlert className="w-3 h-3" />
                          )}
                          {isWarranty ? 'Under Warranty' : 'Expired / Out'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTicket(t.id);
                          }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center justify-end gap-1 font-medium ml-auto"
                        >
                          Manage <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details Drawer */}
      {isDetailOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-end">
          <div className="w-full max-w-xl bg-[#10182f] border-l border-[#1e2a4a] h-full overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1e2a4a]">
              <div>
                <span className="font-mono text-xs text-cyan-400 block font-semibold">
                  {selectedTicket.ticketNo}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Ticket Details</h2>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-2 gap-4 text-sm bg-[#0a1020] p-4 rounded-lg border border-[#1e2a4a]">
              <div>
                <span className="text-xs text-slate-400 block">Customer</span>
                <span className="text-white font-medium">
                  {selectedTicket.customer?.name || `ID: ${selectedTicket.customerId}`}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Current Status</span>
                <StatusBadge status={selectedTicket.status} />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Warranty Status</span>
                <span
                  className={`font-mono text-xs font-semibold ${
                    selectedTicket.warrantyStatus === 'UNDER_WARRANTY'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {selectedTicket.warrantyStatus || 'EXPIRED'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Serial Number</span>
                <span className="font-mono text-slate-300">
                  {selectedTicket.serialNumber || 'N/A'}
                </span>
              </div>
            </div>

            {/* Issue Description */}
            <div className="bg-[#0a1020] p-4 rounded-lg border border-[#1e2a4a]">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Reported Issue
              </span>
              <p className="text-sm text-slate-200">{selectedTicket.issue}</p>
            </div>

            {/* Resolution Information if Resolved */}
            {selectedTicket.resolutionDate && (
              <div className="bg-[#0a1020] p-4 rounded-lg border border-emerald-500/30">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
                  Resolution Record
                </span>
                <p className="text-sm text-slate-200 mb-2">
                  {selectedTicket.resolutionNotes || 'No notes logged'}
                </p>
                <div className="text-xs text-slate-400 font-mono">
                  Resolved on: {new Date(selectedTicket.resolutionDate).toLocaleString()}
                </div>

                {selectedTicket.partsUsed?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#1e2a4a]">
                    <span className="text-xs font-medium text-slate-300 block mb-1">
                      Consumed Replacement Parts:
                    </span>
                    <ul className="text-xs space-y-1 text-slate-400">
                      {selectedTicket.partsUsed.map((p, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-cyan-400" />
                          <span>
                            {p.item} — Qty: {p.qty}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Lifecycle Actions
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedTicket.status !== 'IN_PROGRESS' && selectedTicket.status !== 'RESOLVED' && (
                  <CyberButton
                    variant="secondary"
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                  >
                    Mark In Progress
                  </CyberButton>
                )}
                {selectedTicket.status !== 'WAITING_PARTS' && selectedTicket.status !== 'RESOLVED' && (
                  <CyberButton
                    variant="secondary"
                    onClick={() => handleStatusChange('WAITING_PARTS')}
                  >
                    Mark Waiting Parts
                  </CyberButton>
                )}
                {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                  <CyberButton
                    variant="success"
                    onClick={() => setIsResolveModalOpen(true)}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Resolve Ticket
                  </CyberButton>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Ticket Modal */}
      {isResolveModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#10182f] border border-[#1e2a4a] rounded-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a4a]">
              <div>
                <span className="font-mono text-xs text-cyan-400 font-semibold block">
                  {selectedTicket.ticketNo}
                </span>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Resolve Service Ticket
                </h2>
              </div>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveTicket} className="space-y-3">
              <CyberInput
                label="Resolution Notes"
                placeholder="e.g. Replaced surge arrestor module, grid test verified at 1.2 ohms."
                value={resolveForm.resolutionNotes}
                onChange={(e) =>
                  setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })
                }
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <CyberInput
                  label="Replaced Part Item (Optional)"
                  placeholder="e.g. Surge Protection Cartridge"
                  value={resolveForm.partsUsedName}
                  onChange={(e) =>
                    setResolveForm({ ...resolveForm, partsUsedName: e.target.value })
                  }
                />
                <CyberInput
                  label="Quantity"
                  type="number"
                  value={resolveForm.partsUsedQty}
                  onChange={(e) =>
                    setResolveForm({ ...resolveForm, partsUsedQty: e.target.value })
                  }
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <CyberButton variant="secondary" onClick={() => setIsResolveModalOpen(false)}>
                  Cancel
                </CyberButton>
                <CyberButton variant="success" type="submit">
                  Confirm Resolution
                </CyberButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Service Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#10182f] border border-[#1e2a4a] rounded-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a4a]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Headset className="w-4 h-4 text-cyan-400" />
                Open New Support Ticket
              </h2>
              <button
                onClick={() => setIsNewTicketModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <CyberInput
                  label="Customer ID"
                  placeholder="e.g. 1"
                  type="number"
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                />
                <CyberInput
                  label="Sales Order ID (Opt)"
                  placeholder="e.g. 1"
                  type="number"
                  value={formData.salesOrderId}
                  onChange={(e) => setFormData({ ...formData, salesOrderId: e.target.value })}
                />
              </div>

              <CyberInput
                label="Serial / Grid Tag (Opt)"
                placeholder="e.g. EARTH-PIT-JSR-01"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />

              <CyberInput
                label="Warranty Start Date"
                type="date"
                value={formData.warrantyStart}
                onChange={(e) => setFormData({ ...formData, warrantyStart: e.target.value })}
              />

              <CyberInput
                label="Issue Description"
                placeholder="e.g. Earth resistance test alarm triggered, value increased to 4.2 ohms"
                value={formData.issue}
                onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                required
              />

              <div className="pt-2 flex justify-end gap-2">
                <CyberButton
                  variant="secondary"
                  onClick={() => setIsNewTicketModalOpen(false)}
                >
                  Cancel
                </CyberButton>
                <CyberButton type="submit">Submit Ticket</CyberButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
