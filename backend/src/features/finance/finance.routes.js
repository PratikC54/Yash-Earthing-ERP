import { Router } from 'express';
import { financeController } from './finance.controller.js';

const router = Router();

// Dashboard & Critical Actions
router.get('/dashboard', financeController.getDashboardSummary);

// Unified Customer Billing & Receivables Register
router.get('/register', financeController.getUnifiedRegister);
router.patch('/register/:id', financeController.updateUnifiedRegisterItem);
router.patch('/todos/:id/toggle', financeController.toggleTodoItem);

// Billing Eligibility & Upstream Dispatch
router.get('/billable', financeController.getBillableOrders);

// Invoicing (M6.1)
router.get('/invoices', financeController.getInvoices);
router.post('/invoices', financeController.createInvoice);
router.patch('/invoices/:id', financeController.updateInvoice);
router.delete('/invoices/:id', financeController.cancelInvoice);
router.get('/invoices/:id/pdf', financeController.getInvoicePdf);

// Receipts & Collections (M6.1)
router.get('/receipts', financeController.getReceipts);
router.post('/receipts', financeController.recordReceipt);
router.delete('/receipts/:id', financeController.deleteReceipt);

// Ageing & Exposure (M6.1 & M1 Handshake)
router.get('/ageing', financeController.getAgeingSummary);
router.get('/customers/:id/exposure', financeController.getCustomerExposure);

// Payables & Vendor Bills (M6.2)
router.get('/vendor-bills', financeController.getVendorBills);
router.post('/vendor-bills', financeController.createVendorBill);
router.patch('/vendor-bills/:id', financeController.updateVendorBill);
router.delete('/vendor-bills/:id', financeController.deleteVendorBill);
router.post('/vendor-payments', financeController.recordVendorPayment);

// Smart File Extraction & Data Ingestion
router.post('/import/extract', financeController.extractImportData);
router.post('/import/ingest', financeController.ingestImportData);

// Costing & Margins (M6.3)
router.get('/costing', financeController.getJobCosting);
router.patch('/costing/:id', financeController.updateProfitabilityRegisterItem);

// Admin Configuration
router.get('/settings', financeController.getSettings);
router.put('/settings/company', financeController.updateCompanyProfile);

export default router;
