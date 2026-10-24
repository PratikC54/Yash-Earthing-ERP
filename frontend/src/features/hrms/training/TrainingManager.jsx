import KpiSection from "../../../components/common/KpiSection";
import React, { useState } from 'react';
import apiClient from '../../../services/api';
import {
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  BadgeCheck,
  Clock,
  Layers,
} from 'lucide-react';

export default function TrainingManager() {
  const [employeeId, setEmployeeId] = useState('1');
  const [trainings, setTrainings] = useState([
    {
      id: 1,
      courseCode: 'SAF-001',
      courseTitle: 'Electrical Safety & Earthing Protocols',
      certificateNo: 'CERT-2025-081',
      expiryDate: '2026-01-15T00:00:00.000Z',
      status: 'EXPIRED',
    },
    {
      id: 2,
      courseCode: 'SAF-003',
      courseTitle: 'Chemical Treatment & Copper Bonding Handling',
      certificateNo: 'CERT-2026-102',
      expiryDate: '2027-02-10T00:00:00.000Z',
      status: 'ACTIVE',
    },
  ]);
  const [safetyCheckResult, setSafetyCheckResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const activeCerts = trainings.filter((t) => t.status === 'ACTIVE').length;
  const expiredCerts = trainings.filter((t) => t.status === 'EXPIRED').length;

  const fetchTrainingData = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const [trainRes, safetyRes] = await Promise.all([
        apiClient.get(`/hrms/training/employees/${employeeId}`),
        apiClient.get(`/hrms/training/employees/${employeeId}/safety-check`),
      ]);

      if (trainRes.data?.success && trainRes.data.data?.length > 0) {
        setTrainings(trainRes.data.data);
      }
      if (safetyRes.data?.success) {
        setSafetyCheckResult(safetyRes.data.data);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#141d30]/60 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <span>7.5 Training Matrix & Safety Qualification Verification</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Mandatory safety training compliance, skill certifications, and workstation safety checks
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="number"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 w-32 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={fetchTrainingData}
            disabled={isLoading || !employeeId}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            {isLoading ? 'Checking...' : 'Check Qualifications'}
          </button>
        </div>
      </div>

      {/* 4-Card Training KPI Matrix */}
      <KpiSection title="Skills & Training Compliance">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Courses Required</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">3 Mandatory</div>
          <div className="text-[11px] text-slate-400 mt-1">Electrical & Copper Bonding</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Valid</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-2">{activeCerts} Certified</div>
          <div className="text-[11px] text-slate-400 mt-1">Qualified for Critical Ops</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Renewal Due</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-2">{expiredCerts} Expired</div>
          <div className="text-[11px] text-slate-400 mt-1">Requires Recertification</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Skills Tracked</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 mt-2">12 Endorsed</div>
          <div className="text-[11px] text-slate-400 mt-1">Lathe, CNC & Assembly</div>
        </div>
        </div>
      </KpiSection>

      {/* Safety Clearance Banner */}
      {safetyCheckResult && (
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
            safetyCheckResult.eligible
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {safetyCheckResult.eligible ? (
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          )}
          <div>
            <div className="font-bold text-sm">
              {safetyCheckResult.eligible
                ? 'Workstation Safety Qualified: Clear for Critical Work'
                : 'Safety Qualification Warning: Assignment Restricted'}
            </div>
            <p className="mt-1 opacity-90">
              {safetyCheckResult.eligible
                ? `Valid Certificate #${safetyCheckResult.certificateNo} (Expires: ${new Date(
                    safetyCheckResult.validUntil
                  ).toLocaleDateString()})`
                : safetyCheckResult.reason}
            </p>
          </div>
        </div>
      )}

      {/* Training Courses Table */}
      <div className="p-5 rounded-2xl bg-[#141d30]/60 border border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Completed Courses & Certification Expiry Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Course Code</th>
                <th className="py-2.5 px-3 font-semibold">Course Title</th>
                <th className="py-2.5 px-3 font-semibold">Certificate No</th>
                <th className="py-2.5 px-3 font-semibold">Expiry Date</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {trainings.length > 0 ? (
                trainings.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-300">
                      {t.courseCode}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-100">{t.courseTitle}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{t.certificateNo}</td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {new Date(t.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-500">
                    No training records found. Search by Employee ID above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
