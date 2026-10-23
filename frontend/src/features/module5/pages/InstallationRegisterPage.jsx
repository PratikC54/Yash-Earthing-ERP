import React, { useState, useEffect } from 'react';
import { module5Api } from '../api/module5Api';
import { CyberCard, CyberButton, CyberInput, CyberSelect, StatusBadge } from '../components/CyberUI';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  ClipboardCheck,
  ShieldAlert,
  ChevronRight,
  X,
  FileCheck,
} from 'lucide-react';

export default function InstallationRegisterPage() {
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstallation, setSelectedInstallation] = useState(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // New Installation form
  const [newInstData, setNewInstData] = useState({
    projectId: '',
    scheduledAt: '',
  });

  // Test Results form
  const [testForm, setTestForm] = useState({
    resistanceOhms: '',
    continuityTest: 'PASS',
    testerName: '',
    testDate: new Date().toISOString().split('T')[0],
    pitExcavated: true,
    compoundApplied: true,
    electrodeInserted: true,
    connectionsTorqued: true,
    remarks: '',
  });

  // Handover form
  const [handoverForm, setHandoverForm] = useState({
    customerSignoffName: '',
    remarks: 'Installation tested and verified compliant with IS 3043 / IEEE standards.',
  });

  useEffect(() => {
    loadInstallations();
  }, [search, statusFilter]);

  const loadInstallations = async () => {
    try {
      setLoading(true);
      const res = await module5Api.getInstallations({ search, status: statusFilter });
      setInstallations(res.data);
    } catch (err) {
      console.error('Failed to load installations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTest = (inst) => {
    setSelectedInstallation(inst);
    setTestForm({
      resistanceOhms: inst.testResults?.resistanceOhms || '',
      continuityTest: inst.testResults?.continuityTest || 'PASS',
      testerName: inst.testResults?.testerName || '',
      testDate: inst.testResults?.testDate || new Date().toISOString().split('T')[0],
      pitExcavated: inst.testResults?.checklist?.pitExcavated ?? true,
      compoundApplied: inst.testResults?.checklist?.compoundApplied ?? true,
      electrodeInserted: inst.testResults?.checklist?.electrodeInserted ?? true,
      connectionsTorqued: inst.testResults?.checklist?.connectionsTorqued ?? true,
      remarks: inst.testResults?.remarks || '',
    });
    setIsTestModalOpen(true);
  };

  const handleOpenHandover = (inst) => {
    setSelectedInstallation(inst);
    setHandoverForm({
      customerSignoffName: inst.customerSignoffName || '',
      remarks: 'Installation certified compliant under IS 3043 standards.',
    });
    setIsHandoverModalOpen(true);
  };

  const handleCreateInstallation = async (e) => {
    e.preventDefault();
    try {
      await module5Api.createInstallation({
        projectId: Number(newInstData.projectId),
        scheduledAt: newInstData.scheduledAt ? newInstData.scheduledAt : undefined,
      });
      setIsNewModalOpen(false);
      setNewInstData({ projectId: '', scheduledAt: '' });
      loadInstallations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create installation');
    }
  };

  const handleSubmitTest = async (e) => {
    e.preventDefault();
    if (!selectedInstallation) return;
    try {
      await module5Api.recordTestResults(selectedInstallation.id, {
        earthResistanceOhms: parseFloat(testForm.resistanceOhms),
        gridContinuityPassed: testForm.continuityTest === 'PASS',
        pitCondition: 'EXCELLENT',
        testedBy: testForm.testerName || 'QC Inspector',
        mandatoryChecklist: {
          pitExcavationVerified: Boolean(testForm.pitExcavated),
          backfillCompoundApplied: Boolean(testForm.compoundApplied),
          copperBondingInspected: Boolean(testForm.electrodeInserted),
          safetySignageInstalled: Boolean(testForm.connectionsTorqued),
        },
        correctiveActions: testForm.remarks || null,
      });
      setIsTestModalOpen(false);
      loadInstallations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record test results');
    }
  };

  const handleSubmitHandover = async (e) => {
    e.preventDefault();
    if (!selectedInstallation) return;
    try {
      await module5Api.completeHandover(selectedInstallation.id, handoverForm);
      setIsHandoverModalOpen(false);
      loadInstallations();
    } catch (err) {
      alert(err.response?.data?.message || 'Handover failed');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1e2a4a]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            M5.2 Installation & Quality Handover
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Site commissioning, earth pit resistance QC (≤ 2.0 Ω mandatory gate), and verified client sign-off.
          </p>
        </div>
        <CyberButton onClick={() => setIsNewModalOpen(true)}>
          <Plus className="w-4 h-4" /> Schedule Site Work
        </CyberButton>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search installation number or project..."
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
          <option value="SURVEY_DUE">SURVEY DUE</option>
          <option value="SCHEDULED">SCHEDULED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="TESTING">TESTING</option>
          <option value="HANDOVER_PENDING">HANDOVER PENDING</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </div>

      {/* Installations Table */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-lg overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0b1329] border-b border-[#1e2a4a] text-xs uppercase font-medium text-slate-400">
              <tr>
                <th className="py-3 px-4">Installation No</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Earth Resistance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Loading installations...
                  </td>
                </tr>
              ) : installations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No installation records found.
                  </td>
                </tr>
              ) : (
                installations.map((inst) => {
                  const ohms = inst.testResults?.resistanceOhms;
                  const isPassed = inst.testResults?.passedQC;

                  return (
                    <tr key={inst.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-cyan-400 font-medium">
                        {inst.installationNo}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {inst.project?.name || `Project #${inst.projectId}`}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {inst.project?.customer?.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                        {inst.scheduledAt ? new Date(inst.scheduledAt).toLocaleDateString() : 'Unscheduled'}
                      </td>
                      <td className="py-3 px-4">
                        {ohms !== undefined && ohms !== null ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className={isPassed ? 'text-emerald-400' : 'text-rose-400'}>
                              {ohms} Ω
                            </span>
                            <span
                              className={`px-1 py-0.2 rounded text-[10px] font-bold ${
                                isPassed
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {isPassed ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs font-mono">Not Tested</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={inst.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenTest(inst)}
                            className="px-2 py-1 bg-[#0a1020] border border-[#1e2a4a] hover:border-cyan-500/60 text-cyan-400 text-xs rounded transition-colors flex items-center gap-1"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            QC Test
                          </button>
                          {inst.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleOpenHandover(inst)}
                              className="px-2 py-1 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-400 text-xs rounded transition-colors flex items-center gap-1"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              Handover
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QC Test & Resistance Modal */}
      {isTestModalOpen && selectedInstallation && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#10182f] border border-[#1e2a4a] rounded-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a4a]">
              <div>
                <span className="font-mono text-xs text-cyan-400 font-semibold block">
                  {selectedInstallation.installationNo}
                </span>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-cyan-400" />
                  Site Quality Test & Resistance Gate
                </h2>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded text-xs text-cyan-300">
              <span className="font-bold">Mandatory Earthing Standard:</span> Measured resistance must be{' '}
              <strong className="underline">≤ 2.0 Ohms</strong> and all 4 checklist points verified before sign-off.
            </div>

            <form onSubmit={handleSubmitTest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <CyberInput
                  label="Resistance Value (Ω)"
                  placeholder="e.g. 1.45"
                  type="number"
                  step="0.01"
                  value={testForm.resistanceOhms}
                  onChange={(e) => setTestForm({ ...testForm, resistanceOhms: e.target.value })}
                  required
                />
                <CyberSelect
                  label="Continuity Test"
                  value={testForm.continuityTest}
                  onChange={(e) => setTestForm({ ...testForm, continuityTest: e.target.value })}
                  options={[
                    { value: 'PASS', label: 'PASS' },
                    { value: 'FAIL', label: 'FAIL' },
                  ]}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <CyberInput
                  label="Lead Tester / Engineer"
                  placeholder="e.g. Ramesh Kumar"
                  value={testForm.testerName}
                  onChange={(e) => setTestForm({ ...testForm, testerName: e.target.value })}
                  required
                />
                <CyberInput
                  label="Test Date"
                  type="date"
                  value={testForm.testDate}
                  onChange={(e) => setTestForm({ ...testForm, testDate: e.target.value })}
                  required
                />
              </div>

              {/* 4-Point Earthing Checklist */}
              <div className="space-y-2 bg-[#0a1020] p-3 rounded border border-[#1e2a4a]">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Mandatory QC Checklist
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testForm.pitExcavated}
                    onChange={(e) => setTestForm({ ...testForm, pitExcavated: e.target.checked })}
                    className="accent-cyan-500"
                  />
                  <span>1. Earth pit excavated to specification depth (3m)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testForm.compoundApplied}
                    onChange={(e) => setTestForm({ ...testForm, compoundApplied: e.target.checked })}
                    className="accent-cyan-500"
                  />
                  <span>2. Chemical backfill earth enhancing compound applied</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testForm.electrodeInserted}
                    onChange={(e) => setTestForm({ ...testForm, electrodeInserted: e.target.checked })}
                    className="accent-cyan-500"
                  />
                  <span>3. Copper bonded earthing electrode positioned & aligned</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testForm.connectionsTorqued}
                    onChange={(e) => setTestForm({ ...testForm, connectionsTorqued: e.target.checked })}
                    className="accent-cyan-500"
                  />
                  <span>4. Busbar & earth link clamps properly torqued</span>
                </label>
              </div>

              <CyberInput
                label="QC Remarks / Observations"
                placeholder="e.g. Ground moisture normal, testing kit calibrated"
                value={testForm.remarks}
                onChange={(e) => setTestForm({ ...testForm, remarks: e.target.value })}
              />

              <div className="pt-2 flex justify-end gap-2">
                <CyberButton variant="secondary" onClick={() => setIsTestModalOpen(false)}>
                  Cancel
                </CyberButton>
                <CyberButton type="submit">Submit Test Data</CyberButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Handover Modal */}
      {isHandoverModalOpen && selectedInstallation && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#10182f] border border-[#1e2a4a] rounded-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a4a]">
              <div>
                <span className="font-mono text-xs text-cyan-400 font-semibold block">
                  {selectedInstallation.installationNo}
                </span>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Client Handover Sign-off
                </h2>
              </div>
              <button
                onClick={() => setIsHandoverModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitHandover} className="space-y-4">
              <CyberInput
                label="Authorized Client Signatory Name"
                placeholder="e.g. Mr. Rajesh Sharma (Plant Head)"
                value={handoverForm.customerSignoffName}
                onChange={(e) =>
                  setHandoverForm({ ...handoverForm, customerSignoffName: e.target.value })
                }
                required
              />

              <CyberInput
                label="Handover Remarks"
                placeholder="e.g. Commissioned successfully, handover certificate issued"
                value={handoverForm.remarks}
                onChange={(e) => setHandoverForm({ ...handoverForm, remarks: e.target.value })}
              />

              <div className="pt-2 flex justify-end gap-2">
                <CyberButton variant="secondary" onClick={() => setIsHandoverModalOpen(false)}>
                  Cancel
                </CyberButton>
                <CyberButton variant="success" type="submit">
                  Certify & Complete Handover
                </CyberButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Installation Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#10182f] border border-[#1e2a4a] rounded-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a4a]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                Schedule Site Installation
              </h2>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInstallation} className="space-y-3">
              <CyberInput
                label="Project ID"
                placeholder="e.g. 1"
                type="number"
                value={newInstData.projectId}
                onChange={(e) => setNewInstData({ ...newInstData, projectId: e.target.value })}
                required
              />
              <CyberInput
                label="Scheduled Date & Time"
                type="datetime-local"
                value={newInstData.scheduledAt}
                onChange={(e) => setNewInstData({ ...newInstData, scheduledAt: e.target.value })}
              />

              <div className="pt-2 flex justify-end gap-2">
                <CyberButton variant="secondary" onClick={() => setIsNewModalOpen(false)}>
                  Cancel
                </CyberButton>
                <CyberButton type="submit">Confirm Schedule</CyberButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
