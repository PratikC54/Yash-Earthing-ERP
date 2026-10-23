import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, FileCheck } from "lucide-react";
import ModuleHeader from "../components/shared/ModuleHeader";
import QualityStats from "../components/quality/QualityStats";
import DefectSummary from "../components/quality/DefectSummary";
import InspectionTable from "../components/quality/InspectionTable";
import AssignInspectorModal from "../components/quality/AssignInspectorModal";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import qualityService from "../services/qualityService";

export default function QualityDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningInspection, setAssigningInspection] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, queueRes] = await Promise.all([
        qualityService.getQualityDashboard().catch(() => null),
        qualityService.getInspectionQueue().catch(() => null),
      ]);
      if (dashRes?.data?.metrics) setMetrics(dashRes.data.metrics);
      const queueList =
        (Array.isArray(queueRes?.data) ? queueRes.data : queueRes?.data?.queue) || [];
      setQueue(queueList);
    } catch (err) {
      console.error("Quality dashboard fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Quality Assurance & Compliance (M4.3)"
        subtitle="Manage inspection queues, QA signoffs, defect classifications, and Finished Goods release authorization."
        breadcrumbs={[
          { label: "Production & Quality", to: "/production-quality/planning" },
          { label: "Quality" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link to="/production-quality/inspections">
              <Button variant="primary" size="sm" icon={FileCheck}>
                Inspection Register
              </Button>
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="py-24 text-center">
          <Loader label="Loading quality assurance metrics & queue..." size="lg" />
        </div>
      ) : (
        <>
          <QualityStats metrics={metrics || {}} />

          {/* Pending Inspection Queue Snapshot */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#f1f5f9]">
                  Active QA Inspection Queue
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Completed manufacturing outputs waiting for manual inspector assignment & testing
                </p>
              </div>
              <Link
                to="/production-quality/inspections"
                className="text-xs font-semibold text-[#3b82f6] hover:underline flex items-center gap-1"
              >
                <span>View full inspection register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <InspectionTable
              inspections={queue}
              loading={false}
              onInspect={(row) => navigate(`/production-quality/inspections/${row.id}`)}
              onAssign={(row) => setAssigningInspection(row)}
            />
          </div>

          {/* Defect Analysis & ISO Standards Compliance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DefectSummary />

            <Card
              title="Standard Compliance Checklist (IS-3043 / IEC 62561)"
              subtitle="Mandatory quality gates for Earthing Electrodes & Copper Conductors"
            >
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a1020] border border-[#1e2a4a]">
                  <div>
                    <span className="font-semibold text-[#f1f5f9]">Galvanizing Coating Thickness</span>
                    <p className="text-[11px] text-[#94a3b8]">Minimum 86 microns (IS 2629)</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    PASS 98.4%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a1020] border border-[#1e2a4a]">
                  <div>
                    <span className="font-semibold text-[#f1f5f9]">Terminal Strip Welding Strength</span>
                    <p className="text-[11px] text-[#94a3b8]">Tensile shear resistance audit</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    PASS 100%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a1020] border border-[#1e2a4a]">
                  <div>
                    <span className="font-semibold text-[#f1f5f9]">Compound Packing Density</span>
                    <p className="text-[11px] text-[#94a3b8]">Vibration compaction filling check</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    PASS 99.1%
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Manual Inspector Assignment Modal */}
      {assigningInspection && (
        <AssignInspectorModal
          isOpen={Boolean(assigningInspection)}
          onClose={() => setAssigningInspection(null)}
          inspection={assigningInspection}
          onAssigned={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
