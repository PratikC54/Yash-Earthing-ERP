// Utility to generate a valid ASCII AutoCAD DXF (Drawing Exchange Format) file
export function generateAutoCadDxf(drawingNo, title, productSku, revision) {
  return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LTYPE
0
LTYPE
2
CONTINUOUS
70
0
3
Solid line
72
65
73
0
40
0.0
0
ENDTAB
0
TABLE
2
LAYER
0
LAYER
2
0
70
0
62
7
6
CONTINUOUS
0
LAYER
2
BORDER_AND_TITLE
70
0
62
3
6
CONTINUOUS
0
LAYER
2
GEOMETRY
70
0
62
4
6
CONTINUOUS
0
LAYER
2
DIMENSIONS
70
0
62
1
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
BORDER_AND_TITLE
10
0.0
20
0.0
30
0.0
11
420.0
21
0.0
31
0.0
0
LINE
8
BORDER_AND_TITLE
10
420.0
20
0.0
30
0.0
11
420.0
21
297.0
31
0.0
0
LINE
8
BORDER_AND_TITLE
10
420.0
20
297.0
30
0.0
11
0.0
21
297.0
31
0.0
0
LINE
8
BORDER_AND_TITLE
10
0.0
20
297.0
30
0.0
11
0.0
21
0.0
31
0.0
0
LINE
8
GEOMETRY
10
100.0
20
150.0
30
0.0
11
320.0
21
150.0
31
0.0
0
CIRCLE
8
GEOMETRY
10
210.0
20
150.0
30
0.0
40
25.0
0
TEXT
8
BORDER_AND_TITLE
10
240.0
20
20.0
30
0.0
40
4.0
1
YASH GROUP ERP - ENGINEERING DRAWING
0
TEXT
8
BORDER_AND_TITLE
10
240.0
20
14.0
30
0.0
40
3.0
1
DRAWING NO: ${drawingNo} | REV: ${revision}
0
TEXT
8
BORDER_AND_TITLE
10
240.0
20
8.0
30
0.0
40
3.0
1
PRODUCT: ${productSku} | TITLE: ${title}
0
ENDSEC
0
EOF`;
}

// Generate an official standalone HTML / Vector SVG Engineering Blueprint
export function generateBlueprintHtml(drawingNo, title, productSku, revision, type, uploadedBy, releasedBy, date) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${drawingNo} - ${title}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      background: #0f172a;
      color: #e2e8f0;
      box-sizing: border-box;
    }
    .sheet {
      border: 3px solid #38bdf8;
      border-radius: 8px;
      padding: 16px;
      background: #090e1a;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      position: relative;
      min-height: 580px;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #1e293b;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .company-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #38bdf8;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #064e3b;
      color: #34d399;
      border: 1px solid #059669;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
    }
    .cad-canvas {
      width: 100%;
      height: 340px;
      background: #020617;
      border: 1px dashed #334155;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .title-block {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      border: 2px solid #38bdf8;
      background: #0f172a;
      font-size: 11px;
      font-family: monospace;
    }
    .block-cell {
      padding: 8px 12px;
      border-right: 1px solid #1e293b;
      border-bottom: 1px solid #1e293b;
    }
    .block-label {
      font-size: 9px;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .block-value {
      font-weight: bold;
      color: #ffffff;
      font-size: 12px;
    }
    @media print {
      body { background: white; color: black; padding: 0; }
      .sheet { border: 2px solid black; background: white; }
      .company-title { color: black; }
      .cad-canvas { background: white; border: 1px solid black; }
      .title-block { border: 1px solid black; background: white; }
      .block-value { color: black; }
      .block-label { color: #555; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header-bar">
      <div>
        <div class="company-title">YASH GROUP — ENGINEERING DRAWING OFFICE</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Standard Manufacturing & Fabrication Blueprint (IS 3043 / UL 467 / IEC 62561)</div>
      </div>
      <div>
        <span class="badge">RELEASED FOR SHOP-FLOOR (PRODUCTION)</span>
      </div>
    </div>

    <!-- 2D Scaled CAD Diagram Projection -->
    <div class="cad-canvas">
      <svg width="680" height="280" viewBox="0 0 680 280">
        <defs>
          <pattern id="hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" style="stroke:#38bdf8; stroke-width:0.8; opacity: 0.3;" />
          </pattern>
        </defs>
        <!-- Center line -->
        <line x1="40" y1="140" x2="640" y2="140" stroke="#f43f5e" stroke-dasharray="8,4,2,4" stroke-width="1.2" />
        
        <!-- Outer Conductor Tube -->
        <rect x="80" y="80" width="480" height="120" rx="4" fill="none" stroke="#38bdf8" stroke-width="2.5" />
        
        <!-- Inner Crystalline Core Filling with Hatch -->
        <rect x="120" y="100" width="400" height="80" fill="url(#hatch)" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3,2" />
        
        <!-- Terminal Clamp Lug -->
        <rect x="560" y="110" width="60" height="60" rx="3" fill="#e2e8f0" stroke="#0284c7" stroke-width="2" />
        <circle cx="590" cy="140" r="10" fill="#090e1a" stroke="#f59e0b" stroke-width="2" />
        
        <!-- Dimension Lines -->
        <!-- Length Dim -->
        <line x1="80" y1="230" x2="560" y2="230" stroke="#facc15" stroke-width="1.2" />
        <line x1="80" y1="205" x2="80" y2="238" stroke="#facc15" stroke-width="1" />
        <line x1="560" y1="205" x2="560" y2="238" stroke="#facc15" stroke-width="1" />
        <text x="320" y="248" fill="#facc15" font-size="11" font-family="monospace" text-anchor="middle">NOMINAL LENGTH = 3000 mm ± 5mm</text>
        
        <!-- Diameter Dim -->
        <line x1="50" y1="80" x2="50" y2="200" stroke="#facc15" stroke-width="1.2" />
        <line x1="45" y1="80" x2="75" y2="80" stroke="#facc15" stroke-width="1" />
        <line x1="45" y1="200" x2="75" y2="200" stroke="#facc15" stroke-width="1" />
        <text x="35" y="145" fill="#facc15" font-size="11" font-family="monospace" transform="rotate(-90 35 145)" text-anchor="middle">OD = 50.0 mm ± 0.2mm</text>

        <!-- Annotation labels -->
        <text x="140" y="65" fill="#94a3b8" font-size="10" font-family="sans-serif">99.9% Pure Electrolytic Copper Cladding (Min 250 Microns)</text>
        <line x1="200" y1="70" x2="220" y2="80" stroke="#94a3b8" stroke-width="1" />

        <text x="540" y="65" fill="#f59e0b" font-size="10" font-family="sans-serif">M12 Terminal Stud with SS304 Nut</text>
        <line x1="570" y1="70" x2="585" y2="110" stroke="#f59e0b" stroke-width="1" />
      </svg>
    </div>

    <!-- Official Title Block -->
    <div class="title-block">
      <div class="block-cell">
        <div class="block-label">Drawing Title & Description</div>
        <div class="block-value">${title}</div>
      </div>
      <div class="block-cell">
        <div class="block-label">Drawing Number</div>
        <div class="block-value" style="color: #38bdf8;">${drawingNo}</div>
      </div>
      <div class="block-cell">
        <div class="block-label">Revision Code</div>
        <div class="block-value" style="color: #34d399;">${revision}</div>
      </div>
      <div class="block-cell">
        <div class="block-label">Target Product SKU</div>
        <div class="block-value">${productSku || 'GENERAL SPEC'}</div>
      </div>
      <div class="block-cell">
        <div class="block-label">Drawing Type</div>
        <div class="block-value">${type}</div>
      </div>
      <div class="block-cell">
        <div class="block-label">Approved & Released By</div>
        <div class="block-value">${releasedBy || 'Head of Engineering (Pratik Senapati)'}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Generate Official Yash Group Product Master & Technical Registry Report (PDF / Printable)
export function generateProductRegistryReportHtml(product, category, bom) {
  const releasedRev = bom?.revisions?.find(r => r.status === 'RELEASED');
  const now = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const imageSrc = product.referenceImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600';

  const specRows = (product.specifications || []).map((s, idx) => `
    <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
      <td style="padding: 10px 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${s.attribute}</td>
      <td style="padding: 10px 14px; font-family: monospace; font-weight: bold; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${s.value} ${s.unit || ''}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">${s.tolerance || 'Factory Spec'}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #0284c7; font-weight: 600; font-size: 11px;">${s.standard || 'IS 3043 / UL 467'}</td>
    </tr>
  `).join('');

  const bomRows = releasedRev?.items ? releasedRev.items.map((it, idx) => `
    <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-mono; color: #64748b;">${idx + 1}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${it.componentName} <span style="font-size: 10px; color: #64748b;">(${it.componentSku})</span></td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: bold;">${it.quantity} ${it.uom}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #d97706; font-family: monospace;">${it.scrapPercent}%</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: bold; color: #059669;">₹${Number(it.lineCost).toFixed(2)}</td>
    </tr>
  `).join('') : `<tr><td colspan="5" style="padding: 15px; text-align: center; color: #94a3b8;">No released BOM recipe associated yet.</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Engineering Registry Report — ${product.sku}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background: #f1f5f9;
      color: #0f172a;
    }
    .report-sheet {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .header-table {
      width: 100%;
      border-bottom: 3px solid #0284c7;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .logo-text {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #0369a1;
    }
    .doc-type {
      font-size: 13px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .meta-badge {
      display: inline-block;
      padding: 3px 10px;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0369a1;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .grid-2 {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }
    .product-img {
      width: 260px;
      height: 180px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .details-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .label-col {
      color: #64748b;
      font-weight: 600;
      width: 38%;
    }
    .val-col {
      font-weight: 700;
      color: #0f172a;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 8px;
    }
    .data-table th {
      background: #f1f5f9;
      padding: 10px 12px;
      font-weight: 800;
      font-size: 11px;
      text-align: left;
      color: #475569;
      text-transform: uppercase;
      border-bottom: 2px solid #cbd5e1;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    .sig-box {
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
      background: #f8fafc;
    }
    .sig-title {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 24px;
    }
    .sig-name {
      font-size: 12px;
      font-weight: bold;
      color: #0f172a;
    }
    .print-btn {
      margin-bottom: 20px;
      padding: 10px 20px;
      background: #0284c7;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 13px;
    }
    @media print {
      body { background: white; padding: 0; }
      .report-sheet { border: none; box-shadow: none; padding: 0; width: 100%; max-width: 100%; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div style="text-align: center;">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as Official PDF</button>
  </div>

  <div class="report-sheet">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td>
          <div class="logo-text">YASH GROUP — EARTHING & LIGHTNING PROTECTION</div>
          <div class="doc-type">Engineering Master Specification & Registry Report</div>
        </td>
        <td style="text-align: right;">
          <span class="meta-badge">STATUS: ${product.status}</span>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-family: monospace;">Doc Ref: YASH-ENG-${product.sku}</div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace;">Generated: ${now}</div>
        </td>
      </tr>
    </table>

    <!-- Product Master & Photo Section -->
    <div class="section-title">1. Master Item Identity & Classification</div>
    <div class="grid-2">
      <img src="${imageSrc}" alt="${product.name}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'" />
      
      <table class="details-table">
        <tr>
          <td class="label-col">Product SKU (Code):</td>
          <td class="val-col" style="color: #0284c7; font-family: monospace; font-size: 14px;">${product.sku}</td>
        </tr>
        <tr>
          <td class="label-col">Official Name:</td>
          <td class="val-col">${product.name}</td>
        </tr>
        <tr>
          <td class="label-col">Category Family:</td>
          <td class="val-col">${category?.name || 'Earthing Electrodes'}</td>
        </tr>
        <tr>
          <td class="label-col">Item Master Type:</td>
          <td class="val-col">${product.itemType} (Sellable SKU)</td>
        </tr>
        <tr>
          <td class="label-col">Dimensions / Size:</td>
          <td class="val-col">${product.size || 'Standard'} · ${product.length || ''}</td>
        </tr>
        <tr>
          <td class="label-col">Conductor Metallurgy:</td>
          <td class="val-col">${product.material}</td>
        </tr>
        <tr>
          <td class="label-col">Surface Plating:</td>
          <td class="val-col">${product.finish}</td>
        </tr>
        <tr>
          <td class="label-col">Standard Indian GST:</td>
          <td class="val-col" style="color: #059669;">${product.gstPercent}% (Fixed Statutory Slab)</td>
        </tr>
        <tr>
          <td class="label-col">Commercial List Rate:</td>
          <td class="val-col" style="font-family: monospace;">₹${Number(product.rate).toLocaleString()} per ${product.uom}</td>
        </tr>
      </table>
    </div>

    <!-- Approved Technical Specifications Table -->
    <div class="section-title">2. Approved Technical Specifications & Compliance Standards</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Engineering Parameter</th>
          <th>Nominal Value & Unit</th>
          <th>Tolerance</th>
          <th>Testing Standard / Compliance</th>
        </tr>
      </thead>
      <tbody>
        ${specRows}
      </tbody>
    </table>

    <!-- Released BOM Composition & Cost Snapshot -->
    <div class="section-title">3. Manufacturing Bill of Materials (BOM) & Cost Composition</div>
    <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
      Active Released Recipe: <strong style="color: #0f172a;">${bom?.bomCode || 'BOM-' + product.sku}</strong> — 
      Revision: <span style="color: #059669; font-weight: bold;">${releasedRev?.revisionCode || 'Pending Release'}</span> ·
      Frozen Factory Unit Cost: <strong style="color: #0369a1;">₹${releasedRev?.costSnapshot ? releasedRev.costSnapshot.totalCost.toFixed(2) : Number(product.rate * 0.7).toFixed(2)}</strong>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>Raw Material / Sub-assembly</th>
          <th style="text-align: right;">Unit Quantity</th>
          <th style="text-align: right;">Scrap %</th>
          <th style="text-align: right;">Component Cost (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${bomRows}
      </tbody>
    </table>

    <!-- Quality & Approval Signatures Block -->
    <div class="signature-grid">
      <div class="sig-box">
        <div class="sig-title">Prepared By (Design)</div>
        <div class="sig-name">Eng. Vikram Sharma</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 3px;">Product Engineer</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Verified By (Standards & QC)</div>
        <div class="sig-name">Quality & Testing Division</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 3px;">ISO 9001 / CPRI Tested</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Approved & Released By</div>
        <div class="sig-name" style="color: #0369a1;">Pratik Senapati</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 3px;">Head of Engineering</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
