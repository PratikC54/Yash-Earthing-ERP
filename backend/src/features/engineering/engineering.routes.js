import { Router } from 'express';
import { engineeringController } from './engineering.controller.js';

const router = Router();

// Dashboard
router.get('/dashboard/kpis', engineeringController.getDashboardKpis);

// Categories & Specification Templates
router.get('/categories', engineeringController.getCategories);
router.get('/categories/:id/spec-template', engineeringController.getCategoryTemplate);

// Product Master CRUD
router.get('/products', engineeringController.getProducts);
router.post('/products', engineeringController.createProduct);
router.get('/products/:id', engineeringController.getProductById);
router.patch('/products/:id', engineeringController.updateProduct);
router.post('/products/:id/archive', engineeringController.archiveProduct);
router.put('/products/:id/specifications', engineeringController.updateSpecifications);

// BOM, Revisions & Costing
router.get('/boms', engineeringController.getBoms);
router.get('/products/:id/boms', engineeringController.getBomById);
router.post('/products/:id/boms', engineeringController.createBom);
router.put('/bom-revisions/:id/items', engineeringController.updateRevisionItems);
router.post('/boms/:id/revisions', engineeringController.createNextRevision);
router.post('/bom-revisions/:id/submit', engineeringController.submitRevision);
router.post('/bom-revisions/:id/approve', engineeringController.approveRevision);
router.post('/bom-revisions/:id/reject', engineeringController.rejectRevision);
router.post('/bom-revisions/:id/release', engineeringController.releaseRevision);
router.get('/bom-revisions/:id/cost', engineeringController.calculateRevisionCost);
router.get('/boms/:id/compare', engineeringController.compareRevisions);

// Costing Policy
router.get('/costing-policy', engineeringController.getCostingPolicy);
router.put('/costing-policy', engineeringController.updateCostingPolicy);

// Shortages calculation (Handover to M2/M4)
router.post('/shortages/calculate', engineeringController.calculateShortage);

// Drawings & Media Workspace
router.get('/drawings', engineeringController.getDrawings);
router.post('/drawings', engineeringController.createDrawing);
router.get('/drawings/:id/download', engineeringController.downloadDrawingRevision);

// Read-only APIs for other modules (M1, M2, M4, M5, M6)
router.get('/released/products/:productId/bom', engineeringController.getReleasedBomForProduction);
router.get('/released/products/:productId/drawings', engineeringController.getReleasedDrawingsForProduct);

export default router;
