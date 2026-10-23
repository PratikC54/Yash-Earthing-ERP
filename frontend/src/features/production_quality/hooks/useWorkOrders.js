import { useState, useEffect, useCallback } from "react";
import productionService from "../services/productionService";

export function useWorkOrders(initialParams = {}) {
  const [workOrders, setWorkOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialParams);

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productionService.listWorkOrders(filters);
      if (res?.data) {
        setWorkOrders(res.data.workOrders || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load work orders");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const createWorkOrder = async (payload) => {
    const res = await productionService.createWorkOrder(payload);
    await fetchWorkOrders();
    return res;
  };

  const transitionWorkOrder = async (id, action, payload = {}) => {
    let res;
    switch (action.toLowerCase()) {
      case "submit":
        res = await productionService.submitWorkOrder(id, payload);
        break;
      case "approve":
        res = await productionService.approveWorkOrder(id, payload);
        break;
      case "release":
        res = await productionService.releaseWorkOrder(id, payload);
        break;
      case "hold":
        res = await productionService.holdWorkOrder(id, payload);
        break;
      case "resume":
        res = await productionService.resumeWorkOrder(id, payload);
        break;
      case "reject":
        res = await productionService.rejectWorkOrder(id, payload);
        break;
      case "cancel":
        res = await productionService.cancelWorkOrder(id, payload);
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
    await fetchWorkOrders();
    return res;
  };

  return {
    workOrders,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    reload: fetchWorkOrders,
    createWorkOrder,
    transitionWorkOrder,
  };
}

export default useWorkOrders;
