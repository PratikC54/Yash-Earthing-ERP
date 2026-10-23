import { Router } from 'express';
import { financeController } from './finance.controller.js';

const router = Router();

// Dashboard & Critical Actions
router.get('/dashboard', financeController.getDashboardSummary);

// Billing Eligibility & Upstream Dispatch
router.get('/billable', financeController.getBillableOrders);

// Invoicing (M6.1)
router.get('/invoices', financeController.getInvoices);
router.post('/invoices', financeController.createInvoice);
router.get('/invoices/:id/pdf', financeController.getInvoicePdf);

// Receipts & Collections (M6.1)
router.get('/receipts', financeController.getReceipts);
router.post('/receipts', financeController.recordReceipt);

// Ageing & Exposure (M6.1 & M1 Handshake)
router.get('/ageing', financeController.getAgeingSummary);
router.get('/customers/:id/exposure', financeController.getCustomerExposure);

// Payables & Vendor Bills (M6.2)
router.get('/vendor-bills', financeController.getVendorBills);
router.post('/vendor-bills', financeController.createVendorBill);
router.post('/vendor-payments', financeController.recordVendorPayment);

// Costing & Margins (M6.3)
router.get('/costing', financeController.getJobCosting);

// Admin Configuration
router.get('/settings', financeController.getSettings);
router.put('/settings/company', financeController.updateCompanyProfile);

export default router;
