import { localDb } from './db/localDb.js';
import { generateAutoCadDxf, generateBlueprintHtml, generateProductRegistryReportHtml } from './drawingGenerator.js';

// Standard Indian GST Tax Slabs for engineering and manufacturing goods
const VALID_GST_SLABS = [0, 5, 12, 18, 28];

export const engineeringController = {
  // ===================== DASHBOARD KPIS =====================
  getDashboardKpis: (req, res) => {
    const db = localDb.read();
    const activeProducts = db.products.filter(p => p.status === 'ACTIVE').length;
    
    // Count released BOM revisions
    let releasedBoms = 0;
    db.boms.forEach(b => {
      if (b.revisions && b.revisions.some(r => r.status === 'RELEASED')) {
        releasedBoms++;
      }
    });

    // Count released drawings
    const releasedDrawings = db.drawings.filter(d => d.status === 'RELEASED').length;

    // Calculate sample shortages across raw materials
    let materialShortages = 0;
    db.products.filter(p => p.itemType === 'RAW_MATERIAL' || p.itemType === 'COMPONENT').forEach(m => {
      if ((m.stockQuantity || 0) < 300) {
        materialShortages++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        activeProducts,
        releasedBoms,
        releasedDrawings,
        materialShortages,
        recentAudits: db.auditLogs.slice(0, 5)
      }
    });
  },

  // ===================== CATEGORIES & TEMPLATES =====================
  getCategories: (req, res) => {
    const db = localDb.read();
    res.status(200).json({
      success: true,
      data: db.categories
    });
  },

  getCategoryTemplate: (req, res) => {
    const db = localDb.read();
    const cat = db.categories.find(c => c.id === req.params.id || c.code === req.params.id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({
      success: true,
      data: cat.specTemplate
    });
  },

  // ===================== PRODUCTS =====================
  getProducts: (req, res) => {
    const db = localDb.read();
    const { search, categoryId, itemType, status } = req.query;

    let results = db.products;

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(p =>
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.material && p.material.toLowerCase().includes(q))
      );
    }

    if (categoryId) {
      results = results.filter(p => p.categoryId === categoryId);
    }

    if (itemType) {
      results = results.filter(p => p.itemType === itemType);
    }

    if (status) {
      results = results.filter(p => p.status === status);
    }

    res.status(200).json({
      success: true,
      data: results,
      meta: {
        total: results.length
      }
    });
  },

  getProductById: (req, res) => {
    const db = localDb.read();
    const product = db.products.find(p => p.id === req.params.id || p.sku.toLowerCase() === req.params.id.toLowerCase());
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const category = db.categories.find(c => c.id === product.categoryId);
    const bom = db.boms.find(b => b.productId === product.id);
    const drawings = db.drawings.filter(d => d.productId === product.id);

    res.status(200).json({
      success: true,
      data: {
        ...product,
        category,
        bom,
        drawings
      }
    });
  },

  createProduct: (req, res) => {
    const db = localDb.read();
    const { sku, name, categoryId, itemType, material, size, length, finish, uom, rate, gstPercent, description, referenceImage, specifications } = req.body;

    // Strict Validation
    if (!sku || !sku.trim() || !name || !name.trim() || !categoryId) {
      return res.status(400).json({ success: false, message: 'Product SKU, Name, and Category are required.' });
    }

    const cleanSku = sku.trim().toUpperCase();
    if (!/^[A-Z0-9-_]+$/.test(cleanSku)) {
      return res.status(400).json({ success: false, message: 'SKU may only contain uppercase letters, numbers, hyphens, and underscores.' });
    }

    const numRate = Number(rate);
    if (isNaN(numRate) || numRate <= 0) {
      return res.status(400).json({ success: false, message: 'Product List Rate must be a positive number greater than 0.' });
    }

    const numGst = Number(gstPercent);
    if (!VALID_GST_SLABS.includes(numGst)) {
      return res.status(400).json({
        success: false,
        message: `Invalid GST rate (${gstPercent}%). Indian tax compliance requires standard slabs: 0%, 5%, 12%, 18%, or 28%.`
      });
    }

    // Check duplicate SKU
    const existing = db.products.find(p => p.sku.toLowerCase() === cleanSku.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, message: `Product with SKU "${cleanSku}" already exists.` });
    }

    const newProduct = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sku: cleanSku,
      name: name.trim(),
      categoryId,
      itemType: itemType || "FINISHED",
      material: material?.trim() || "Standard Metallurgy",
      size: size?.trim() || "",
      length: length?.trim() || "",
      finish: finish?.trim() || "Factory Standard",
      uom: uom || "NOS",
      rate: numRate,
      gstPercent: numGst,
      status: "ACTIVE",
      description: description?.trim() || "",
      referenceImage: referenceImage?.trim() || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
      specifications: specifications || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.products.unshift(newProduct);
    localDb.write(db);
    localDb.logAudit('Product', newProduct.id, 'CREATE', req.user?.name || 'Product Engineer', `Created product ${newProduct.sku} - ${newProduct.name}`);

    res.status(201).json({
      success: true,
      data: newProduct,
      message: 'Product master created successfully.'
    });
  },

  updateProduct: (req, res) => {
    const db = localDb.read();
    const index = db.products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const existing = db.products[index];
    const { rate, gstPercent } = req.body;

    if (rate !== undefined) {
      const numRate = Number(rate);
      if (isNaN(numRate) || numRate <= 0) {
        return res.status(400).json({ success: false, message: 'Rate must be a positive number greater than 0.' });
      }
    }

    if (gstPercent !== undefined) {
      const numGst = Number(gstPercent);
      if (!VALID_GST_SLABS.includes(numGst)) {
        return res.status(400).json({ success: false, message: `GST must be one of: 0%, 5%, 12%, 18%, 28%.` });
      }
    }

    const updated = {
      ...existing,
      ...req.body,
      sku: existing.sku, // SKU is immutable
      updatedAt: new Date().toISOString()
    };

    db.products[index] = updated;
    localDb.write(db);
    localDb.logAudit('Product', updated.id, 'UPDATE', req.user?.name || 'Product Engineer', `Updated fields for ${updated.sku}`);

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Product updated successfully.'
    });
  },

  archiveProduct: (req, res) => {
    const db = localDb.read();
    const product = db.products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.status = 'ARCHIVED';
    product.updatedAt = new Date().toISOString();
    localDb.write(db);
    localDb.logAudit('Product', product.id, 'ARCHIVE', req.user?.name || 'Product Engineer', `Archived product ${product.sku}`);

    res.status(200).json({
      success: true,
      data: product,
      message: `Product ${product.sku} has been archived.`
    });
  },

  updateSpecifications: (req, res) => {
    const db = localDb.read();
    const product = db.products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.specifications = req.body.specifications || [];
    product.updatedAt = new Date().toISOString();
    localDb.write(db);
    localDb.logAudit('ProductSpecification', product.id, 'UPDATE', req.user?.name || 'Product Engineer', `Updated technical specs for ${product.sku}`);

    res.status(200).json({
      success: true,
      data: product.specifications,
      message: 'Specifications updated successfully.'
    });
  },

  getProductRegistryReport: (req, res) => {
    const db = localDb.read();
    const product = db.products.find(p => p.id === req.params.id || p.sku === req.params.id);
    if (!product) {
      return res.status(404).send('Product not found in Engineering Registry');
    }

    const category = db.categories.find(c => c.id === product.categoryId);
    const bom = db.boms.find(b => b.productId === product.id);

    const htmlReport = generateProductRegistryReportHtml(product, category, bom);

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlReport);
  },

  // ===================== BOM & REVISIONS =====================
  getBoms: (req, res) => {
    const db = localDb.read();
    const bomsWithProducts = db.boms.map(b => {
      const product = db.products.find(p => p.id === b.productId);
      return {
        ...b,
        product
      };
    });

    res.status(200).json({
      success: true,
      data: bomsWithProducts
    });
  },

  getBomById: (req, res) => {
    const db = localDb.read();
    const bom = db.boms.find(b => b.id === req.params.id || b.productId === req.params.id);
    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }
    const product = db.products.find(p => p.id === bom.productId);
    res.status(200).json({
      success: true,
      data: {
        ...bom,
        product
      }
    });
  },

  createBom: (req, res) => {
    const db = localDb.read();
    const { productId, title, items } = req.body;

    const product = db.products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Target finished product not found' });
    }

    const existingBom = db.boms.find(b => b.productId === productId);
    if (existingBom) {
      return res.status(409).json({ success: false, message: `BOM already exists for this product (${existingBom.bomCode}). Please create a revision instead.` });
    }

    const bomId = `bom_${Date.now()}`;
    const newBom = {
      id: bomId,
      productId,
      bomCode: `BOM-${product.sku}`,
      title: title || `Bill of Materials for ${product.name}`,
      createdAt: new Date().toISOString(),
      revisions: [
        {
          id: `rev_${Date.now()}_a`,
          revisionCode: "Rev A",
          status: "DRAFT",
          changeReason: "Initial BOM draft creation.",
          createdBy: req.user?.name || "Product Engineer",
          submittedBy: null,
          submittedAt: null,
          approvedBy: null,
          approvedAt: null,
          releasedBy: null,
          releasedAt: null,
          policyId: db.costingPolicy.id,
          costSnapshot: null,
          items: (items || []).map((it, idx) => ({
            id: `item_${idx + 1}`,
            componentProductId: it.componentProductId,
            componentSku: it.componentSku,
            componentName: it.componentName,
            quantity: Math.max(0.001, Number(it.quantity) || 1),
            uom: it.uom || "NOS",
            unitRate: Math.max(0, Number(it.unitRate) || 0),
            scrapPercent: Math.min(100, Math.max(0, Number(it.scrapPercent) || 0)),
            lineCost: Number(it.quantity) * (1 + (Number(it.scrapPercent) || 0) / 100) * Number(it.unitRate),
            note: it.note || ""
          }))
        }
      ]
    };

    db.boms.unshift(newBom);
    localDb.write(db);
    localDb.logAudit('BOM', newBom.id, 'CREATE', req.user?.name || 'Product Engineer', `Created BOM ${newBom.bomCode}`);

    res.status(201).json({
      success: true,
      data: newBom,
      message: 'BOM created in DRAFT revision.'
    });
  },

  updateRevisionItems: (req, res) => {
    const db = localDb.read();
    const { id } = req.params;
    const { items, changeReason } = req.body;

    let targetRev = null;
    let targetBom = null;

    for (const b of db.boms) {
      const r = b.revisions.find(rev => rev.id === id);
      if (r) {
        targetRev = r;
        targetBom = b;
        break;
      }
    }

    if (!targetRev) {
      return res.status(404).json({ success: false, message: 'BOM revision not found' });
    }

    if (targetRev.status === 'RELEASED' || targetRev.status === 'SUPERSEDED') {
      return res.status(422).json({
        success: false,
        message: 'Released and Superseded BOM revisions are immutable and cannot be modified. Create a new revision.'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'BOM must contain at least one component.' });
    }

    for (const it of items) {
      const q = Number(it.quantity);
      if (isNaN(q) || q <= 0) {
        return res.status(400).json({ success: false, message: 'Component quantities must be strictly greater than 0.' });
      }
      const scrap = Number(it.scrapPercent);
      if (isNaN(scrap) || scrap < 0 || scrap > 100) {
        return res.status(400).json({ success: false, message: 'Scrap % must be between 0% and 100%.' });
      }
      if (it.componentProductId === targetBom.productId) {
        return res.status(400).json({ success: false, message: 'Circular BOM error: A product cannot contain itself as a component.' });
      }
    }

    targetRev.items = items.map((it, idx) => {
      const comp = db.products.find(p => p.id === it.componentProductId) || {};
      const rate = Math.max(0, Number(it.unitRate ?? comp.rate ?? 0));
      const scrap = Math.min(100, Math.max(0, Number(it.scrapPercent || 0)));
      const qty = Math.max(0.001, Number(it.quantity));
      return {
        id: it.id || `item_${idx + 1}`,
        componentProductId: it.componentProductId,
        componentSku: comp.sku || it.componentSku || 'RAW-ITEM',
        componentName: comp.name || it.componentName || 'Component',
        quantity: qty,
        uom: it.uom || comp.uom || 'NOS',
        unitRate: rate,
        scrapPercent: scrap,
        lineCost: qty * (1 + scrap / 100) * rate,
        note: it.note || ''
      };
    });

    if (changeReason) {
      targetRev.changeReason = changeReason;
    }

    localDb.write(db);
    res.status(200).json({
      success: true,
      data: targetRev,
      message: 'BOM draft items updated.'
    });
  },

  createNextRevision: (req, res) => {
    const db = localDb.read();
    const { id } = req.params;
    const { changeReason } = req.body;

    const bom = db.boms.find(b => b.id === id);
    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    const latest = bom.revisions[bom.revisions.length - 1];
    const charCode = latest.revisionCode.charCodeAt(latest.revisionCode.length - 1);
    const nextCode = `Rev ${String.fromCharCode(charCode + 1)}`;

    const newRev = {
      id: `rev_${Date.now()}_${String.fromCharCode(charCode + 1).toLowerCase()}`,
      revisionCode: nextCode,
      status: "DRAFT",
      changeReason: changeReason || `Cloned from ${latest.revisionCode} for engineering revision.`,
      createdBy: req.user?.name || "Product Engineer",
      submittedBy: null,
      submittedAt: null,
      approvedBy: null,
      approvedAt: null,
      releasedBy: null,
      releasedAt: null,
      policyId: db.costingPolicy.id,
      costSnapshot: null,
      items: latest.items.map(it => ({ ...it, id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` }))
    };

    bom.revisions.push(newRev);
    localDb.write(db);
    localDb.logAudit('BOMRevision', newRev.id, 'CREATE_REVISION', req.user?.name || 'Product Engineer', `Created new revision ${nextCode} for ${bom.bomCode}`);

    res.status(201).json({
      success: true,
      data: newRev,
      message: `Revision ${nextCode} created in DRAFT.`
    });
  },

  submitRevision: (req, res) => {
    const db = localDb.read();
    const { id } = req.params;
    let targetRev = null;

    for (const b of db.boms) {
      const r = b.revisions.find(rev => rev.id === id);
      if (r) { targetRev = r; break; }
    }

    if (!targetRev) return res.status(404).json({ success: false, message: 'Revision not found' });
    if (targetRev.items.length === 0) return res.status(400).json({ success: false, message: 'Cannot submit an empty BOM.' });

    targetRev.status = 'IN_REVIEW';
    targetRev.submittedBy = req.user?.name || 'Product Engineer';
    targetRev.submittedAt = new Date().toISOString();

    localDb.write(db);
    localDb.logAudit('BOMRevision', targetRev.id, 'SUBMIT', targetRev.submittedBy, `Submitted ${targetRev.revisionCode} for engineering review.`);

    res.status(200).json({ success: true, data: targetRev, message: 'BOM submitted for review.' });
  },

  approveRevision: (req, res) => {
    const db = localDb.read();
    const { id } = req.params;
    let targetRev = null;

    for (const b of db.boms) {
      const r = b.revisions.find(rev => rev.id === id);
      if (r) { targetRev = r; break; }
    }

    if (!targetRev) return res.status(404).json({ success: false, message: 'Revision not found' });
    if (targetRev.status !== 'IN_REVIEW') {
      return res.status(400).json({ success: false, message: 'Only revisions in IN_REVIEW status can be approved.' });
    }

    targetRev.status = 'APPROVED';
    targetRev.approvedBy = req.user?.name || 'Head of Engineering (Pratik Senapati)';
    targetRev.approvedAt = new Date().toISOString();

    localDb.write(db);
    localDb.logAudit('BOMRevision', targetRev.id, 'APPROVE', targetRev.approvedBy, `Approved ${targetRev.revisionCode}`);

    res.status(200).json({ success: true, data: targetRev, message: 'BOM revision approved.' });
  },

  rejectRevision: (req, res) => {
    const db = localDb.read();
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'A rejection comment is mandatory.' });
    }

    let targetRev = null;
    for (const b of db.boms) {
      const r = b.revisions.find(rev => rev.id === id);
      if (r) { targetRev = r; break; }
    }

    if (!targetRev) return res.status(404).json({ success: false, message: 'Revision not found' });

    targetRev.status = 'DRAFT';
    targetRev.changeReason = `Rejected: ${comment.trim()} (Previously: ${targetRev.changeReason || ''})`;

    localDb.write(db);
    localDb.logAudit('BOMRevision', targetRev.id, 'REJECT', req.user?.name || 'Reviewer', `Rejected with note: ${comment.trim()}`);

    res.status(200).json({ success: true, data: targetRev, message: 'Revision rejected back to DRAFT.' });
  },

  releaseRevision: (req, res) => {
    const db = localDb.read();
    const { id } = req.params;
    let targetRev = null;
    let parentBom = null;

    for (const b of db.boms) {
      const r = b.revisions.find(rev => rev.id === id);
      if (r) {
        targetRev = r;
        parentBom = b;
        break;
      }
    }

    if (!targetRev) return res.status(404).json({ success: false, message: 'Revision not found' });
    if (targetRev.status === 'RELEASED') {
      return res.status(200).json({ success: true, data: targetRev, message: 'Revision is already released.' });
    }

    const policy = db.costingPolicy;
    const materialCost = targetRev.items.reduce((sum, it) => sum + (Number(it.lineCost) || 0), 0);
    const labourCost = Math.max(0, Number(policy.labourCostPerUnit || 0));
    const overheadCost = (materialCost + labourCost) * (Math.max(0, Number(policy.overheadPercent || 0)) / 100);
    const totalCost = materialCost + labourCost + overheadCost;
    const suggestedPrice = totalCost * (1 + Math.max(0, Number(policy.targetMarginPercent || 0)) / 100);

    // Supersede previously released revisions
    parentBom.revisions.forEach(rev => {
      if (rev.id !== targetRev.id && rev.status === 'RELEASED') {
        rev.status = 'SUPERSEDED';
      }
    });

    targetRev.status = 'RELEASED';
    targetRev.releasedBy = req.user?.name || 'Head of Engineering (Pratik Senapati)';
    targetRev.releasedAt = new Date().toISOString();
    targetRev.costSnapshot = {
      materialCost,
      labourCost,
      overheadCost,
      totalCost,
      suggestedPrice,
      targetMarginPercent: policy.targetMarginPercent,
      computedAt: targetRev.releasedAt
    };

    localDb.write(db);
    localDb.logAudit('BOMRevision', targetRev.id, 'RELEASE', targetRev.releasedBy, `Released ${targetRev.revisionCode} with frozen cost ₹${totalCost.toFixed(2)}`);

    res.status(200).json({
      success: true,
      data: targetRev,
      message: `Revision ${targetRev.revisionCode} is now officially RELEASED for production floor execution.`
    });
  },

  calculateRevisionCost: (req, res) => {
    const db = localDb.read();
    const { id } = req.params;
    let targetRev = null;

    for (const b of db.boms) {
      const r = b.revisions.find(rev => rev.id === id);
      if (r) { targetRev = r; break; }
    }

    if (!targetRev) return res.status(404).json({ success: false, message: 'Revision not found' });

    const policy = db.costingPolicy;
    const materialCost = targetRev.items.reduce((sum, it) => sum + (Number(it.lineCost) || 0), 0);
    const labourCost = Math.max(0, Number(policy.labourCostPerUnit || 0));
    const overheadCost = (materialCost + labourCost) * (Math.max(0, Number(policy.overheadPercent || 0)) / 100);
    const totalCost = materialCost + labourCost + overheadCost;
    const suggestedPrice = totalCost * (1 + Math.max(0, Number(policy.targetMarginPercent || 0)) / 100);

    res.status(200).json({
      success: true,
      data: {
        revisionId: targetRev.id,
        revisionCode: targetRev.revisionCode,
        policyName: policy.name,
        materialCost,
        labourCost,
        overheadCost,
        totalCost,
        suggestedPrice,
        targetMarginPercent: policy.targetMarginPercent,
        frozenSnapshot: targetRev.costSnapshot
      }
    });
  },

  compareRevisions: (req, res) => {
    const db = localDb.read();
    const { id } = req.params;
    const { from, to } = req.query;

    const bom = db.boms.find(b => b.id === id);
    if (!bom) return res.status(404).json({ success: false, message: 'BOM not found' });

    const revA = bom.revisions.find(r => r.revisionCode === from || r.id === from);
    const revB = bom.revisions.find(r => r.revisionCode === to || r.id === to);

    if (!revA || !revB) {
      return res.status(400).json({ success: false, message: 'Both source and target revisions are required for comparison.' });
    }

    const mapA = new Map(revA.items.map(i => [i.componentProductId, i]));
    const mapB = new Map(revB.items.map(i => [i.componentProductId, i]));

    const added = [];
    const removed = [];
    const modified = [];
    const unchanged = [];

    mapB.forEach((itemB, compId) => {
      if (!mapA.has(compId)) {
        added.push(itemB);
      } else {
        const itemA = mapA.get(compId);
        if (itemA.quantity !== itemB.quantity || itemA.scrapPercent !== itemB.scrapPercent || itemA.unitRate !== itemB.unitRate) {
          modified.push({ before: itemA, after: itemB });
        } else {
          unchanged.push(itemB);
        }
      }
    });

    mapA.forEach((itemA, compId) => {
      if (!mapB.has(compId)) {
        removed.push(itemA);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        bomCode: bom.bomCode,
        revA: revA.revisionCode,
        revB: revB.revisionCode,
        added,
        removed,
        modified,
        unchanged
      }
    });
  },

  // ===================== COSTING POLICY =====================
  getCostingPolicy: (req, res) => {
    const db = localDb.read();
    res.status(200).json({
      success: true,
      data: db.costingPolicy
    });
  },

  updateCostingPolicy: (req, res) => {
    const db = localDb.read();
    const { labourCostPerUnit, overheadPercent, targetMarginPercent, defaultGstPercent } = req.body;

    if (labourCostPerUnit !== undefined && (isNaN(Number(labourCostPerUnit)) || Number(labourCostPerUnit) < 0)) {
      return res.status(400).json({ success: false, message: 'Labour cost cannot be negative.' });
    }
    if (overheadPercent !== undefined && (isNaN(Number(overheadPercent)) || Number(overheadPercent) < 0 || Number(overheadPercent) > 100)) {
      return res.status(400).json({ success: false, message: 'Overhead % must be between 0% and 100%.' });
    }
    if (targetMarginPercent !== undefined && (isNaN(Number(targetMarginPercent)) || Number(targetMarginPercent) < 0)) {
      return res.status(400).json({ success: false, message: 'Target margin % cannot be negative.' });
    }

    db.costingPolicy = {
      ...db.costingPolicy,
      ...req.body,
      labourCostPerUnit: Math.max(0, Number(labourCostPerUnit ?? db.costingPolicy.labourCostPerUnit)),
      overheadPercent: Math.min(100, Math.max(0, Number(overheadPercent ?? db.costingPolicy.overheadPercent))),
      targetMarginPercent: Math.max(0, Number(targetMarginPercent ?? db.costingPolicy.targetMarginPercent)),
      updatedAt: new Date().toISOString()
    };
    localDb.write(db);
    localDb.logAudit('CostingPolicy', db.costingPolicy.id, 'UPDATE_POLICY', req.user?.name || 'Engineering Manager', 'Updated engineering costing policy parameters');

    res.status(200).json({
      success: true,
      data: db.costingPolicy,
      message: 'Costing policy updated.'
    });
  },

  // ===================== SHORTAGE CALCULATION =====================
  calculateShortage: (req, res) => {
    const db = localDb.read();
    const { productId, orderQuantity } = req.body;

    const qty = Number(orderQuantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Order Quantity must be a valid number greater than 0.' });
    }

    const bom = db.boms.find(b => b.productId === productId);
    if (!bom) {
      return res.status(404).json({ success: false, message: 'No BOM found for this product.' });
    }

    const releasedRev = bom.revisions.find(r => r.status === 'RELEASED');
    if (!releasedRev) {
      return res.status(422).json({ success: false, message: 'This product has no RELEASED BOM. Cannot compute production shortages from unapproved drafts.' });
    }

    const shortages = releasedRev.items.map(item => {
      const comp = db.products.find(p => p.id === item.componentProductId);
      const availableStock = comp?.stockQuantity ?? 100;
      const requiredQty = (item.quantity * (1 + item.scrapPercent / 100)) * qty;
      const shortage = Math.max(0, requiredQty - availableStock);

      return {
        componentId: item.componentProductId,
        componentSku: item.componentSku,
        componentName: item.componentName,
        uom: item.uom,
        qtyPerUnit: item.quantity,
        scrapPercent: item.scrapPercent,
        totalRequired: Number(requiredQty.toFixed(2)),
        availableStock,
        shortage: Number(shortage.toFixed(2)),
        status: shortage > 0 ? 'SHORTAGE_ALERT' : 'AVAILABLE'
      };
    });

    const hasShortage = shortages.some(s => s.shortage > 0);

    res.status(200).json({
      success: true,
      data: {
        productId,
        orderQuantity: qty,
        bomRevision: releasedRev.revisionCode,
        hasShortage,
        shortages
      }
    });
  },

  // ===================== DRAWINGS & REVISIONS =====================
  getDrawings: (req, res) => {
    const db = localDb.read();
    const { productId, type } = req.query;

    let results = db.drawings;
    if (productId) {
      results = results.filter(d => d.productId === productId);
    }
    if (type) {
      results = results.filter(d => d.type === type);
    }

    res.status(200).json({
      success: true,
      data: results
    });
  },

  createDrawing: (req, res) => {
    const db = localDb.read();
    const { drawingNo, title, type, productId, changeReason } = req.body;

    if (!drawingNo || !drawingNo.trim() || !title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Drawing Number and Title are required.' });
    }

    const cleanDrawingNo = drawingNo.trim().toUpperCase();
    const existing = db.drawings.find(d => d.drawingNo.toLowerCase() === cleanDrawingNo.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, message: `Drawing "${cleanDrawingNo}" already exists.` });
    }

    const newDrawing = {
      id: `drw_${Date.now()}`,
      drawingNo: cleanDrawingNo,
      title: title.trim(),
      type: type || 'FABRICATION',
      productId: productId || null,
      status: 'RELEASED',
      latestRevision: 'Rev A',
      revisions: [
        {
          id: `drw_rev_${Date.now()}_a`,
          revisionCode: 'Rev A',
          status: 'RELEASED',
          fileName: `${cleanDrawingNo}-RevA.pdf`,
          fileSize: '1.4 MB',
          fileType: 'application/pdf',
          checksum: 'f4b3e2...auto',
          changeReason: changeReason?.trim() || 'Initial design approved for manufacturing.',
          uploadedBy: req.user?.name || 'Design Engineer',
          uploadedAt: new Date().toISOString(),
          releasedBy: req.user?.name || 'Head of Engineering (Pratik Senapati)',
          releasedAt: new Date().toISOString()
        }
      ]
    };

    db.drawings.unshift(newDrawing);
    localDb.write(db);
    localDb.logAudit('Drawing', newDrawing.id, 'CREATE_DRAWING', req.user?.name || 'Design Engineer', `Uploaded & released drawing ${newDrawing.drawingNo}`);

    res.status(201).json({
      success: true,
      data: newDrawing,
      message: 'Drawing registered successfully.'
    });
  },

  // Protected Real Vector CAD / Blueprint Download Endpoint
  downloadDrawingRevision: (req, res) => {
    const db = localDb.read();
    const { id } = req.params;
    const { format } = req.query; // 'dxf' or 'html' (printable blueprint)

    const drawing = db.drawings.find(d => d.id === id || d.drawingNo.toLowerCase() === id.toLowerCase());
    if (!drawing) {
      return res.status(404).send('Drawing not found');
    }

    const releasedRev = drawing.revisions.find(r => r.status === 'RELEASED') || drawing.revisions[0];
    const product = db.products.find(p => p.id === drawing.productId);

    if (format === 'dxf') {
      const dxfContent = generateAutoCadDxf(
        drawing.drawingNo,
        drawing.title,
        product?.sku || 'GEN-SKU',
        releasedRev.revisionCode
      );
      res.setHeader('Content-Type', 'application/dxf');
      res.setHeader('Content-Disposition', `attachment; filename="${drawing.drawingNo}-${releasedRev.revisionCode}.dxf"`);
      return res.send(dxfContent);
    }

    // Default: Printable standalone high-precision CAD Blueprint
    const htmlBlueprint = generateBlueprintHtml(
      drawing.drawingNo,
      drawing.title,
      product?.sku || 'GENERAL SPEC',
      releasedRev.revisionCode,
      drawing.type,
      releasedRev.uploadedBy,
      releasedRev.releasedBy,
      releasedRev.releasedAt
    );

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlBlueprint);
  },

  // ===================== INTEGRATION APIS FOR M1, M2, M4 =====================
  getReleasedBomForProduction: (req, res) => {
    const db = localDb.read();
    const { productId } = req.params;
    const bom = db.boms.find(b => b.productId === productId);
    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }
    const releasedRev = bom.revisions.find(r => r.status === 'RELEASED');
    if (!releasedRev) {
      return res.status(404).json({ success: false, message: 'No released BOM available for production' });
    }
    res.status(200).json({
      success: true,
      data: {
        productId,
        bomCode: bom.bomCode,
        revision: releasedRev
      }
    });
  },

  getReleasedDrawingsForProduct: (req, res) => {
    const db = localDb.read();
    const { productId } = req.params;
    const drawings = db.drawings
      .filter(d => d.productId === productId)
      .map(d => ({
        drawingNo: d.drawingNo,
        title: d.title,
        type: d.type,
        releasedRevision: d.revisions.find(r => r.status === 'RELEASED')
      }))
      .filter(d => d.releasedRevision);

    res.status(200).json({
      success: true,
      data: drawings
    });
  }
};
