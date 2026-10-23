import { useState, useEffect, useCallback } from "react";
import qualityService from "../services/qualityService";

export function useInspections(initialParams = {}) {
  const [inspections, setInspections] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialParams);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await qualityService.getInspectionQueue(filters);
      if (res?.data) {
        setInspections(res.data.inspections || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load inspection queue");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const recordResults = async (id, data) => {
    const res = await qualityService.recordResults(id, data);
    await fetchInspections();
    return res;
  };

  const approveInspection = async (id, data = {}) => {
    const res = await qualityService.approveInspection(id, data);
    await fetchInspections();
    return res;
  };

  const holdInspection = async (id, data) => {
    const res = await qualityService.holdInspection(id, data);
    await fetchInspections();
    return res;
  };

  const reworkInspection = async (id, data) => {
    const res = await qualityService.reworkInspection(id, data);
    await fetchInspections();
    return res;
  };

  const releaseFinishedGoods = async (data) => {
    const res = await qualityService.releaseFinishedGoods(data);
    await fetchInspections();
    return res;
  };

  return {
    inspections,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    reload: fetchInspections,
    recordResults,
    approveInspection,
    holdInspection,
    reworkInspection,
    releaseFinishedGoods,
  };
}

export default useInspections;
