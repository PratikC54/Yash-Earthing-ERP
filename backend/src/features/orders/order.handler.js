import {
  checkInventoryStockAndReserve,
  createSalesOrder,
  deleteSalesOrder,
  getOrderById,
  getOrders,
  issueCustomerPO,
  updateSalesOrder,
} from "./order.service.js";

export async function handleGetOrders(req, res, next) {
  try {
    const { search, status, page, limit } = req.query;
    const result = await getOrders({ search, status, page, limit });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function handleGetOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

export async function handleIssueCustomerPO(req, res, next) {
  try {
    const { quotationId } = req.params;
    const result = await issueCustomerPO(quotationId, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: "Customer Purchase Order recorded and issued by Back Officer",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleCreateSalesOrder(req, res, next) {
  try {
    const order = await createSalesOrder(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: "Sales Order officially created and approved by Sales Manager",
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleCheckInventory(req, res, next) {
  try {
    const { id } = req.params;
    const result = await checkInventoryStockAndReserve(id);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateSalesOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await updateSalesOrder(id, req.body);
    return res.status(200).json({ success: true, message: "Sales order updated", data: order });
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteSalesOrder(req, res, next) {
  try {
    const { id } = req.params;
    await deleteSalesOrder(id);
    return res.status(200).json({ success: true, message: "Sales order deleted" });
  } catch (error) {
    next(error);
  }
}
