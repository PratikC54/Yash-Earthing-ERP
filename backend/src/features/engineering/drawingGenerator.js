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

// =========================================================================
// 1. EMBEDDED TECHNICAL PRODUCT ILLUSTRATION GENERATOR (High-Resolution Vector)
// =========================================================================
export function renderProductTechnicalSvg(product, category) {
  const catId = category?.id || product?.categoryId || '';
  const sku = product?.sku || '';
  const name = product?.name || '';
  const isLightning = catId.includes('lightning') || sku.includes('ESE') || name.includes('Lightning');
  const isRod = catId.includes('bonded') || sku.includes('CBR') || name.includes('Rod');
  const isPit = catId.includes('pit') || sku.includes('PIT') || name.includes('Cover');

  if (isLightning) {
    return `
      <svg width="260" height="180" viewBox="0 0 260 180" style="background:#0b1329; border-radius:8px; border:1px solid #334155;">
        <defs>
          <pattern id="dotGrid1" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="#1e293b" />
          </pattern>
        </defs>
        <rect width="260" height="180" fill="url(#dotGrid1)" />
        <line x1="130" y1="10" x2="130" y2="165" stroke="#f43f5e" stroke-dasharray="4,2" stroke-width="1" />
        <!-- SS Central Rod -->
        <polygon points="130,20 127,35 133,35" fill="#f8fafc" stroke="#38bdf8" />
        <rect x="128" y="35" width="4" height="95" fill="#e2e8f0" stroke="#38bdf8" />
        <!-- Ionization Booster Head -->
        <ellipse cx="130" cy="75" rx="20" ry="14" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5" />
        <polygon points="130,68 126,76 134,76 130,84" fill="#facc15" />
        <!-- Radial Fins -->
        <line x1="128" y1="90" x2="95" y2="115" stroke="#38bdf8" stroke-width="2.5" />
        <line x1="132" y1="90" x2="165" y2="115" stroke="#38bdf8" stroke-width="2.5" />
        <circle cx="95" cy="115" r="3" fill="#facc15" />
        <circle cx="165" cy="115" r="3" fill="#facc15" />
        <!-- Mounting Base -->
        <rect x="122" y="130" width="16" height="15" fill="#475569" stroke="#94a3b8" />
        <rect x="124" y="145" width="12" height="15" fill="none" stroke="#facc15" stroke-dasharray="2,2" />
        <!-- Badges -->
        <rect x="10" y="12" width="80" height="16" rx="3" fill="#1e293b" stroke="#334155" />
        <text x="14" y="24" fill="#38bdf8" font-size="8" font-family="monospace" font-weight="bold">ESE TERMINAL</text>
        <rect x="10" y="150" width="105" height="16" rx="3" fill="#064e3b" stroke="#059669" />
        <text x="14" y="162" fill="#34d399" font-size="8" font-family="monospace">NFC 17-102 CERTIFIED</text>
        <text x="172" y="78" fill="#facc15" font-size="8" font-family="sans-serif">Ion Chamber</text>
        <text x="172" y="155" fill="#94a3b8" font-size="8" font-family="sans-serif">2" BSP Thread</text>
      </svg>
    `;
  }

  if (isRod) {
    return `
      <svg width="260" height="180" viewBox="0 0 260 180" style="background:#0b1329; border-radius:8px; border:1px solid #334155;">
        <rect width="260" height="180" fill="#0b1329" />
        <line x1="20" y1="90" x2="240" y2="90" stroke="#f43f5e" stroke-dasharray="4,2" stroke-width="1" />
        <!-- Steel Core -->
        <rect x="50" y="78" width="160" height="24" fill="#334155" stroke="#475569" />
        <!-- Copper Molecular Cladding (Top & Bottom) -->
        <rect x="50" y="74" width="160" height="4" fill="#d97706" />
        <rect x="50" y="102" width="160" height="4" fill="#d97706" />
        <!-- Conical Driving Tip -->
        <polygon points="50,74 25,90 50,106" fill="#d97706" stroke="#f59e0b" />
        <!-- Rolled Coupling Thread -->
        <rect x="185" y="72" width="25" height="36" fill="none" stroke="#facc15" stroke-dasharray="3,2" stroke-width="1.5" />
        <!-- Callout Badges -->
        <rect x="10" y="12" width="105" height="16" rx="3" fill="#1e293b" stroke="#334155" />
        <text x="14" y="24" fill="#f59e0b" font-size="8" font-family="monospace" font-weight="bold">COPPER BONDED ROD</text>
        <rect x="10" y="150" width="115" height="16" rx="3" fill="#064e3b" stroke="#059669" />
        <text x="14" y="162" fill="#34d399" font-size="8" font-family="monospace">254µm Cu CLAD (UL 467)</text>
        <text x="145" y="60" fill="#facc15" font-size="8" font-family="sans-serif">5/8" Cold Threads</text>
        <text x="25" y="125" fill="#cbd5e1" font-size="8" font-family="sans-serif">60° Driving Tip</text>
      </svg>
    `;
  }

  if (isPit) {
    return `
      <svg width="260" height="180" viewBox="0 0 260 180" style="background:#0b1329; border-radius:8px; border:1px solid #334155;">
        <defs>
          <pattern id="pitTread1" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#334155" stroke-width="1" />
          </pattern>
        </defs>
        <rect width="260" height="180" fill="#0b1329" />
        <!-- Top Outer Flange -->
        <circle cx="130" cy="90" r="65" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
        <!-- Checker Lid -->
        <circle cx="130" cy="90" r="50" fill="url(#pitTread1)" stroke="#0284c7" stroke-width="1.5" />
        <!-- Earth Symbol -->
        <line x1="130" y1="78" x2="130" y2="102" stroke="#facc15" stroke-width="2.5" />
        <line x1="120" y1="90" x2="140" y2="90" stroke="#facc15" stroke-width="2.5" />
        <line x1="123" y1="96" x2="137" y2="96" stroke="#facc15" stroke-width="2" />
        <line x1="126" y1="102" x2="134" y2="102" stroke="#facc15" stroke-width="1.5" />
        <!-- Handle Slots -->
        <rect x="88" y="85" width="14" height="10" rx="3" fill="#0b1329" stroke="#94a3b8" />
        <rect x="158" y="85" width="14" height="10" rx="3" fill="#0b1329" stroke="#94a3b8" />
        <!-- Badges -->
        <rect x="10" y="12" width="100" height="16" rx="3" fill="#1e293b" stroke="#334155" />
        <text x="14" y="24" fill="#38bdf8" font-size="8" font-family="monospace" font-weight="bold">EARTH PIT COVER</text>
        <rect x="10" y="150" width="115" height="16" rx="3" fill="#064e3b" stroke="#059669" />
        <text x="14" y="162" fill="#34d399" font-size="8" font-family="monospace">CLASS C250 (25T LOAD)</text>
      </svg>
    `;
  }

  // Default: Chemical Earthing Electrode (Dual pipe cutaway)
  return `
    <svg width="260" height="180" viewBox="0 0 260 180" style="background:#0b1329; border-radius:8px; border:1px solid #334155;">
      <defs>
        <pattern id="elecHatch1" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#0284c7" stroke-width="0.8" opacity="0.6" />
        </pattern>
      </defs>
      <rect width="260" height="180" fill="#0b1329" />
      <line x1="15" y1="90" x2="245" y2="90" stroke="#f43f5e" stroke-dasharray="4,2" stroke-width="1" />
      <!-- Outer Pipe -->
      <rect x="35" y="65" width="165" height="50" rx="2" fill="none" stroke="#d97706" stroke-width="2.5" />
      <!-- Perforations -->
      <circle cx="65" cy="75" r="2.5" fill="#facc15" />
      <circle cx="95" cy="75" r="2.5" fill="#facc15" />
      <circle cx="125" cy="75" r="2.5" fill="#facc15" />
      <circle cx="155" cy="75" r="2.5" fill="#facc15" />
      <circle cx="80" cy="105" r="2.5" fill="#facc15" />
      <circle cx="110" cy="105" r="2.5" fill="#facc15" />
      <circle cx="140" cy="105" r="2.5" fill="#facc15" />
      <!-- Inner Crystalline Core -->
      <rect x="45" y="74" width="145" height="32" fill="url(#elecHatch1)" stroke="#38bdf8" stroke-dasharray="3,2" />
      <!-- Terminal Strip with Dual Holes -->
      <rect x="200" y="75" width="30" height="30" rx="2" fill="#d97706" stroke="#fde68a" stroke-width="1.5" />
      <circle cx="210" cy="90" r="3.5" fill="#0b1329" stroke="#facc15" />
      <circle cx="222" cy="90" r="3.5" fill="#0b1329" stroke="#facc15" />
      <!-- Bottom Seal Cap -->
      <path d="M 35,65 C 25,75 25,105 35,115 Z" fill="#d97706" />
      <!-- Badges -->
      <rect x="10" y="12" width="115" height="16" rx="3" fill="#1e293b" stroke="#334155" />
      <text x="14" y="24" fill="#f59e0b" font-size="8" font-family="monospace" font-weight="bold">CHEMICAL ELECTRODE</text>
      <rect x="10" y="150" width="115" height="16" rx="3" fill="#064e3b" stroke="#059669" />
      <text x="14" y="162" fill="#34d399" font-size="8" font-family="monospace">PIPE-IN-PIPE (IS 3043)</text>
      <text x="170" y="55" fill="#facc15" font-size="8" font-family="sans-serif">Dual M12 Lug</text>
    </svg>
  `;
}

// =========================================================================
// 2. DYNAMIC CAD BLUEPRINT CANVAS PROJECTION GENERATOR
// =========================================================================
export function renderDynamicCadSvg(drawingNo, title, type, product, revision) {
  const catId = product?.categoryId || '';
  const sku = product?.sku || '';
  const tit = title || '';
  const isLightning = catId.includes('lightning') || sku.includes('ESE') || tit.includes('ESE') || tit.includes('Arrester');
  const isRod = catId.includes('bonded') || sku.includes('CBR') || tit.includes('Rod') || tit.includes('Bonded');
  const isPit = catId.includes('pit') || sku.includes('PIT') || tit.includes('Pit') || tit.includes('Cover');
  const isInstall = type === 'INSTALLATION' || tit.includes('Installation') || tit.includes('Mounting');

  if (isInstall) {
    return `
      <svg width="740" height="290" viewBox="0 0 740 290">
        <defs>
          <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#1e293b" stroke-width="0.5" />
            <line x1="0" y1="0" x2="0" y2="20" stroke="#1e293b" stroke-width="0.5" />
          </pattern>
        </defs>
        <rect width="740" height="290" fill="url(#gridPattern)" />
        
        <!-- Building & Roofline Structure -->
        <rect x="80" y="140" width="340" height="150" fill="#0f172a" stroke="#334155" stroke-width="2" />
        <line x1="60" y1="140" x2="440" y2="140" stroke="#64748b" stroke-width="3" />
        <text x="90" y="160" fill="#64748b" font-size="10" font-family="sans-serif">PARAPET / ROOF SLAB</text>

        <!-- Elevation Mast & ESE Terminal atop Roof -->
        <rect x="230" y="45" width="10" height="95" fill="#38bdf8" />
        <polygon points="235,20 230,45 240,45" fill="#facc15" stroke="#f59e0b" />
        <circle cx="235" cy="38" r="6" fill="#0284c7" stroke="#38bdf8" />
        <line x1="230" y1="42" x2="215" y2="48" stroke="#facc15" stroke-width="1.5" />
        <line x1="240" y1="42" x2="255" y2="48" stroke="#facc15" stroke-width="1.5" />

        <!-- 25x3mm Copper Down-Conductor Route -->
        <path d="M 240,45 L 260,65 L 260,140 L 420,140 L 420,270 L 520,270" fill="none" stroke="#f59e0b" stroke-width="2.5" />
        
        <!-- Saddle Clamps at 1m spacing -->
        <circle cx="420" cy="160" r="3" fill="#38bdf8" />
        <circle cx="420" cy="190" r="3" fill="#38bdf8" />
        <circle cx="420" cy="220" r="3" fill="#38bdf8" />
        
        <!-- Test Disconnect Joint Enclosure Box -->
        <rect x="410" y="195" width="20" height="25" rx="2" fill="#0284c7" stroke="#38bdf8" />
        <text x="435" y="210" fill="#38bdf8" font-size="9" font-family="monospace">TEST DISCONNECT BOX (1.5m FGL)</text>

        <!-- Earth Pit Chamber & Ground Electrode -->
        <rect x="520" y="220" width="70" height="70" rx="3" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
        <line x1="555" y1="240" x2="555" y2="290" stroke="#f59e0b" stroke-width="4" />
        <text x="600" y="245" fill="#facc15" font-size="9" font-family="monospace">CHEMICAL ELECTRODE PIT</text>
        <text x="600" y="260" fill="#34d399" font-size="8" font-family="monospace">Target: &lt; 1.0 Ohm</text>

        <!-- Dimensions -->
        <line x1="210" y1="20" x2="210" y2="140" stroke="#facc15" stroke-width="1" />
        <line x1="205" y1="20" x2="215" y2="20" stroke="#facc15" />
        <line x1="205" y1="140" x2="215" y2="140" stroke="#facc15" />
        <text x="180" y="85" fill="#facc15" font-size="10" font-family="monospace">3000 mm</text>
      </svg>
    `;
  }

  if (isLightning) {
    return `
      <svg width="740" height="290" viewBox="0 0 740 290">
        <defs>
          <pattern id="gridPattern2" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#1e293b" stroke-width="0.5" />
            <line x1="0" y1="0" x2="0" y2="20" stroke="#1e293b" stroke-width="0.5" />
          </pattern>
        </defs>
        <rect width="740" height="290" fill="url(#gridPattern2)" />

        <!-- Vertical Center Axis -->
        <line x1="370" y1="15" x2="370" y2="275" stroke="#f43f5e" stroke-dasharray="8,4,2,4" stroke-width="1" />

        <!-- Pointed Apex Finial -->
        <polygon points="370,25 365,55 375,55" fill="#f8fafc" stroke="#38bdf8" stroke-width="1.5" />
        <!-- Central SS Shaft -->
        <rect x="366" y="55" width="8" height="150" fill="#cbd5e1" stroke="#38bdf8" stroke-width="1.5" />

        <!-- Aerodynamic Ionization Capsule Body -->
        <path d="M 330,115 C 330,80 410,80 410,115 C 410,150 330,150 330,115 Z" fill="#0369a1" stroke="#38bdf8" stroke-width="2" />
        <!-- Spark Gap Trigger Symbol -->
        <polygon points="370,105 363,118 377,118 370,132" fill="#facc15" stroke="#f59e0b" />

        <!-- 4 Auxiliary Radial Deflector Wings -->
        <path d="M 366,135 L 290,165 L 275,160" stroke="#38bdf8" stroke-width="3" fill="none" />
        <path d="M 374,135 L 450,165 L 465,160" stroke="#38bdf8" stroke-width="3" fill="none" />
        <circle cx="275" cy="160" r="5" fill="#facc15" stroke="#f59e0b" stroke-width="1.5" />
        <circle cx="465" cy="160" r="5" fill="#facc15" stroke="#f59e0b" stroke-width="1.5" />

        <!-- Base Tightening Collar -->
        <rect x="350" y="205" width="40" height="22" rx="3" fill="#334155" stroke="#94a3b8" stroke-width="2" />
        <!-- 2" BSP Male Thread -->
        <rect x="358" y="227" width="24" height="40" fill="none" stroke="#facc15" stroke-dasharray="3,2" stroke-width="2" />

        <!-- Dimensions -->
        <!-- Total Height -->
        <line x1="220" y1="25" x2="220" y2="267" stroke="#facc15" stroke-width="1.2" />
        <line x1="215" y1="25" x2="225" y2="25" stroke="#facc15" />
        <line x1="215" y1="267" x2="225" y2="267" stroke="#facc15" />
        <text x="145" y="150" fill="#facc15" font-size="11" font-family="monospace">HEIGHT = ${product?.length || '400 mm'} ± 2mm</text>

        <!-- Aux Span -->
        <line x1="275" y1="185" x2="465" y2="185" stroke="#facc15" stroke-width="1" />
        <text x="370" y="198" fill="#facc15" font-size="10" font-family="monospace" text-anchor="middle">AUXILIARY WING SPAN = 190 mm</text>

        <!-- Callouts & Standards -->
        <rect x="480" y="35" width="240" height="58" rx="4" fill="#0f172a" stroke="#1e293b" />
        <text x="490" y="52" fill="#38bdf8" font-size="10" font-family="monospace" font-weight="bold">ESE DISCHARGE TERMINAL</text>
        <text x="490" y="68" fill="#e2e8f0" font-size="9" font-family="sans-serif">Radius: ${product?.size || '108 m'} (Class 1)</text>
        <text x="490" y="82" fill="#34d399" font-size="9" font-family="monospace">Standard: NFC 17-102:2011 / UNE 21186</text>
      </svg>
    `;
  }

  if (isRod) {
    return `
      <svg width="740" height="290" viewBox="0 0 740 290">
        <defs>
          <pattern id="gridPattern3" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#1e293b" stroke-width="0.5" />
            <line x1="0" y1="0" x2="0" y2="20" stroke="#1e293b" stroke-width="0.5" />
          </pattern>
        </defs>
        <rect width="740" height="290" fill="url(#gridPattern3)" />

        <!-- Longitudinal Centerline -->
        <line x1="30" y1="145" x2="710" y2="145" stroke="#f43f5e" stroke-dasharray="8,4,2,4" stroke-width="1.2" />

        <!-- Solid Steel Core Shaft -->
        <rect x="80" y="115" width="560" height="60" fill="#1e293b" stroke="#475569" stroke-width="1.5" />

        <!-- Molecular Copper Cladding (Top & Bottom Bands) -->
        <rect x="80" y="110" width="560" height="6" fill="#d97706" />
        <rect x="80" y="174" width="560" height="6" fill="#d97706" />

        <!-- 60° Penetration Driving Point (Left) -->
        <polygon points="80,110 30,145 80,180" fill="#d97706" stroke="#f59e0b" stroke-width="2" />

        <!-- Cold-Rolled Coupler Thread (Right) -->
        <rect x="580" y="105" width="60" height="80" fill="none" stroke="#facc15" stroke-dasharray="3,2" stroke-width="2" />

        <!-- Dimensions -->
        <line x1="80" y1="215" x2="640" y2="215" stroke="#facc15" stroke-width="1.2" />
        <line x1="80" y1="185" x2="80" y2="222" stroke="#facc15" />
        <line x1="640" y1="185" x2="640" y2="222" stroke="#facc15" />
        <text x="360" y="235" fill="#facc15" font-size="11" font-family="monospace" text-anchor="middle">TOTAL LENGTH = ${product?.length || '3.0 m'} ± 3mm</text>

        <!-- Diameter -->
        <line x1="50" y1="110" x2="50" y2="180" stroke="#facc15" stroke-width="1.2" />
        <text x="40" y="150" fill="#facc15" font-size="10" font-family="monospace" transform="rotate(-90 40 150)" text-anchor="middle">ROD Ø = ${product?.size || '17.2 mm'}</text>

        <!-- Detail Box -->
        <rect x="450" y="25" width="270" height="60" rx="4" fill="#0f172a" stroke="#1e293b" />
        <text x="460" y="42" fill="#f59e0b" font-size="10" font-family="monospace" font-weight="bold">UL 467 LISTED COPPER BONDED ROD</text>
        <text x="460" y="58" fill="#cbd5e1" font-size="9" font-family="sans-serif">Copper Thickness: ${product?.finish || 'Min 254 Microns'}</text>
        <text x="460" y="74" fill="#34d399" font-size="9" font-family="monospace">Core: High Tensile SAE 1018 Steel (600 N/mm²)</text>
      </svg>
    `;
  }

  if (isPit) {
    return `
      <svg width="740" height="290" viewBox="0 0 740 290">
        <defs>
          <pattern id="pitTread2" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" stroke-width="1" />
          </pattern>
        </defs>
        <rect width="740" height="290" fill="#020617" />

        <!-- View 1: Top Plan View -->
        <circle cx="210" cy="145" r="105" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
        <circle cx="210" cy="145" r="85" fill="url(#pitTread2)" stroke="#0284c7" stroke-width="1.5" />
        <!-- Earth Symbol -->
        <line x1="210" y1="125" x2="210" y2="165" stroke="#facc15" stroke-width="3" />
        <line x1="195" y1="145" x2="225" y2="145" stroke="#facc15" stroke-width="3" />
        <line x1="200" y1="153" x2="220" y2="153" stroke="#facc15" stroke-width="2.5" />
        <!-- Handle Slots -->
        <rect x="140" y="137" width="24" height="16" rx="4" fill="#020617" stroke="#cbd5e1" />
        <rect x="256" y="137" width="24" height="16" rx="4" fill="#020617" stroke="#cbd5e1" />
        <text x="210" y="275" fill="#38bdf8" font-size="11" font-family="monospace" text-anchor="middle">PLAN VIEW (TOP INSPECTION LID)</text>

        <!-- View 2: Sectional Elevation & Load Distribution -->
        <path d="M 450,90 L 670,90 L 640,210 L 480,210 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
        <rect x="430" y="80" width="260" height="18" rx="2" fill="#334155" stroke="#38bdf8" />
        <!-- Load Test Vectors -->
        <line x1="560" y1="35" x2="560" y2="75" stroke="#f43f5e" stroke-width="3" />
        <polygon points="560,78 554,65 566,65" fill="#f43f5e" />
        <text x="560" y="28" fill="#f43f5e" font-size="11" font-family="monospace" font-weight="bold" text-anchor="middle">250 kN WHEEL LOAD (CLASS C250)</text>
        <text x="560" y="275" fill="#38bdf8" font-size="11" font-family="monospace" text-anchor="middle">SECTION A-A (LOAD DEFLECTION PROFILE)</text>
      </svg>
    `;
  }

  // Default: Chemical Earthing Electrode Pipe-in-Pipe CAD Projection
  return `
    <svg width="740" height="290" viewBox="0 0 740 290">
      <defs>
        <pattern id="hatchCad" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" style="stroke:#38bdf8; stroke-width:0.8; opacity: 0.4;" />
        </pattern>
      </defs>
      
      <!-- Longitudinal Center Axis -->
      <line x1="30" y1="140" x2="710" y2="140" stroke="#f43f5e" stroke-dasharray="8,4,2,4" stroke-width="1.2" />
      
      <!-- Outer Conductor Tube with Copper Cladding -->
      <rect x="70" y="80" width="540" height="120" rx="4" fill="none" stroke="#d97706" stroke-width="3" />
      
      <!-- Perforation Holes for Electrolyte Release -->
      <circle cx="130" cy="100" r="5" fill="#090e1a" stroke="#facc15" stroke-width="1.5" />
      <circle cx="210" cy="100" r="5" fill="#090e1a" stroke="#facc15" stroke-width="1.5" />
      <circle cx="290" cy="100" r="5" fill="#090e1a" stroke="#facc15" stroke-width="1.5" />
      <circle cx="370" cy="100" r="5" fill="#090e1a" stroke="#facc15" stroke-width="1.5" />
      <circle cx="450" cy="100" r="5" fill="#090e1a" stroke="#facc15" stroke-width="1.5" />
      <circle cx="530" cy="100" r="5" fill="#090e1a" stroke="#facc15" stroke-width="1.5" />

      <circle cx="170" cy="180" r="5" fill="#090e1a" stroke="#facc15" stroke-width="1.5" />
      <circle cx="250" cy="180" r="5" fill="#090e1a" stroke="#facc15" stroke-width="1.5" />
      <circle cx="330" cy="180" r="5" fill="#090e1a" stroke="#facc15" stroke-width="1.5" />
      <circle cx="410" cy="180" r="5" fill="#090e1a" stroke="#facc15" stroke-width="1.5" />
      <circle cx="490" cy="180" r="5" fill="#090e1a" stroke="#facc15" stroke-width="1.5" />

      <!-- Inner Secondary Pipe Filled with Crystalline Minerals -->
      <rect x="100" y="100" width="480" height="80" fill="url(#hatchCad)" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4,2" />
      
      <!-- Bottom Welded Sealing Cap -->
      <path d="M 70,80 C 50,110 50,170 70,200 Z" fill="#d97706" stroke="#f59e0b" stroke-width="2" />

      <!-- Terminal Strip with Dual M12 Bolting Holes (Right) -->
      <rect x="610" y="105" width="80" height="70" rx="3" fill="#0284c7" stroke="#38bdf8" stroke-width="2" />
      <circle cx="635" cy="140" r="9" fill="#090e1a" stroke="#facc15" stroke-width="2" />
      <circle cx="665" cy="140" r="9" fill="#090e1a" stroke="#facc15" stroke-width="2" />
      
      <!-- Dimension Lines -->
      <!-- Length Dim -->
      <line x1="70" y1="230" x2="610" y2="230" stroke="#facc15" stroke-width="1.2" />
      <line x1="70" y1="205" x2="70" y2="238" stroke="#facc15" stroke-width="1" />
      <line x1="610" y1="205" x2="610" y2="238" stroke="#facc15" stroke-width="1" />
      <text x="340" y="248" fill="#facc15" font-size="11" font-family="monospace" text-anchor="middle">NOMINAL LENGTH = ${product?.length || '3000 mm'} ± 5mm</text>
      
      <!-- Diameter Dim -->
      <line x1="45" y1="80" x2="45" y2="200" stroke="#facc15" stroke-width="1.2" />
      <line x1="40" y1="80" x2="65" y2="80" stroke="#facc15" stroke-width="1" />
      <line x1="40" y1="200" x2="65" y2="200" stroke="#facc15" stroke-width="1" />
      <text x="32" y="145" fill="#facc15" font-size="11" font-family="monospace" transform="rotate(-90 32 145)" text-anchor="middle">OD = ${product?.size || '50.0 mm'} ± 0.2mm</text>

      <!-- Terminal Lug Callout -->
      <line x1="635" y1="130" x2="635" y2="60" stroke="#facc15" stroke-width="1" />
      <line x1="665" y1="130" x2="665" y2="60" stroke="#facc15" stroke-width="1" />
      <line x1="635" y1="65" x2="665" y2="65" stroke="#facc15" stroke-width="1" />
      <text x="650" y="55" fill="#facc15" font-size="9" font-family="monospace" text-anchor="middle">2x Ø12.5mm @ 30mm C/C</text>
    </svg>
  `;
}

// =========================================================================
// 3. OFFICIAL STANDALONE ENGINEERING BLUEPRINT (Print & PDF Engine)
// =========================================================================
export function generateBlueprintHtml(drawingNo, title, productSku, revision, type, uploadedBy, releasedBy, date, product, drawing) {
  const now = date ? new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const catId = product?.categoryId || '';
  const sku = product?.sku || '';
  const tit = title || '';
  const isLightning = catId.includes('lightning') || sku.includes('ESE') || tit.includes('ESE');
  const isRod = catId.includes('bonded') || sku.includes('CBR') || tit.includes('Rod');
  const isPit = catId.includes('pit') || sku.includes('PIT') || tit.includes('Cover');

  let ctqRows = '';
  if (isLightning) {
    ctqRows = `
      <tr><td>1</td><td>Total Air Terminal Height</td><td>${product?.length || '400 mm'}</td><td>± 2.0 mm</td><td>Digital Height Vernier</td><td>100% (All Parts)</td><td style="color:#34d399;font-weight:bold;">PASS (QC-1)</td></tr>
      <tr><td>2</td><td>Ion Trigger Timing ΔT</td><td>60 µs</td><td>± 5 µs</td><td>High-Voltage Impulse Gen</td><td>1 / Batch (CPRI)</td><td style="color:#34d399;font-weight:bold;">VERIFIED</td></tr>
      <tr><td>3</td><td>Mounting Thread Pitch & Gauge</td><td>2" BSP (ISO 7-1)</td><td>Class 6g Fit</td><td>Thread Ring Gauge</td><td>100%</td><td style="color:#34d399;font-weight:bold;">PASS</td></tr>
      <tr><td>4</td><td>SS 316L Chemical Passivation</td><td>ASTM A967 Spec</td><td>Zero Oxidation</td><td>Copper Sulfate Test</td><td>Sample 5/lot</td><td style="color:#34d399;font-weight:bold;">COMPLIANT</td></tr>
    `;
  } else if (isRod) {
    ctqRows = `
      <tr><td>1</td><td>Overall Rod Length</td><td>${product?.length || '3.0 m'}</td><td>± 3.0 mm</td><td>Steel Measuring Tape</td><td>100%</td><td style="color:#34d399;font-weight:bold;">PASS</td></tr>
      <tr><td>2</td><td>Outer Core Diameter</td><td>${product?.size || '17.2 mm'}</td><td>± 0.15 mm</td><td>Micrometer 0-25mm</td><td>100%</td><td style="color:#34d399;font-weight:bold;">PASS</td></tr>
      <tr><td>3</td><td>Copper Molecular Clad Thickness</td><td>254 Microns (Min)</td><td>-0 / +40 µm</td><td>Elcometer Magnetic Gauge</td><td>100% (3 points)</td><td style="color:#34d399;font-weight:bold;">PASS (UL 467)</td></tr>
      <tr><td>4</td><td>Driving Tip Point Angle</td><td>60 Degrees</td><td>± 2°</td><td>Optical Profile Gauge</td><td>10%</td><td style="color:#34d399;font-weight:bold;">PASS</td></tr>
    `;
  } else if (isPit) {
    ctqRows = `
      <tr><td>1</td><td>Top Rim Outer Diameter</td><td>${product?.size || '300 mm'}</td><td>± 2.0 mm</td><td>Large Vernier Caliper</td><td>100%</td><td style="color:#34d399;font-weight:bold;">PASS</td></tr>
      <tr><td>2</td><td>Overall Chamber Depth</td><td>260 mm</td><td>± 3.0 mm</td><td>Depth Gauge</td><td>100%</td><td style="color:#34d399;font-weight:bold;">PASS</td></tr>
      <tr><td>3</td><td>Load Bearing Capacity</td><td>Class C250 (250 kN)</td><td>No Cracking</td><td>Hydraulic Compression Rig</td><td>Type Test Sample</td><td style="color:#34d399;font-weight:bold;">CERTIFIED</td></tr>
      <tr><td>4</td><td>Lid Seating & Latch Fit</td><td>Flush Fit</td><td>< 1.5mm Play</td><td>Go / No-Go Template</td><td>100%</td><td style="color:#34d399;font-weight:bold;">PASS</td></tr>
    `;
  } else {
    ctqRows = `
      <tr><td>1</td><td>Total Electrode Length</td><td>${product?.length || '3000 mm'}</td><td>± 5.0 mm</td><td>Calibrated Steel Tape</td><td>100%</td><td style="color:#34d399;font-weight:bold;">PASS</td></tr>
      <tr><td>2</td><td>Outer Pipe Diameter (OD)</td><td>${product?.size || '50.0 mm'}</td><td>± 0.2 mm</td><td>Digital Vernier Caliper</td><td>100%</td><td style="color:#34d399;font-weight:bold;">PASS</td></tr>
      <tr><td>3</td><td>Terminal Strip Hole Size & Center</td><td>2x Ø12.5mm @ 35mm</td><td>± 0.2 mm</td><td>Plug Gauge / Caliper</td><td>100%</td><td style="color:#34d399;font-weight:bold;">PASS</td></tr>
      <tr><td>4</td><td>Copper Cladding Thickness</td><td>250 Microns (Min)</td><td>-0 / +30 µm</td><td>Digital Coating Gauge</td><td>100%</td><td style="color:#34d399;font-weight:bold;">PASS (IS 3043)</td></tr>
      <tr><td>5</td><td>Crystalline Compound Fill Net Weight</td><td>18.5 kg</td><td>± 0.5 kg</td><td>Digital Load Cell Scale</td><td>100%</td><td style="color:#34d399;font-weight:bold;">PASS</td></tr>
    `;
  }

  const cadSvg = renderDynamicCadSvg(drawingNo, title, type, product, revision);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${drawingNo} - ${title} (Official Blueprint)</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 16px;
      background: #0f172a;
      color: #e2e8f0;
      box-sizing: border-box;
    }
    .no-print {
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e293b;
      padding: 10px 18px;
      border-radius: 8px;
      border: 1px solid #334155;
    }
    .action-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      transition: all 0.2s;
    }
    .download-pdf-btn {
      background: #0284c7;
      color: white;
      border: 1px solid #38bdf8;
    }
    .download-pdf-btn:hover { background: #0369a1; }
    .download-cad-btn {
      background: #334155;
      color: #e2e8f0;
      border: 1px solid #475569;
    }
    .download-cad-btn:hover { background: #475569; }

    .sheet {
      border: 2px solid #38bdf8;
      border-radius: 8px;
      padding: 16px;
      background: #090e1a;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      position: relative;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #1e293b;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .company-title {
      font-size: 18px;
      font-weight: 900;
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
      font-size: 11px;
      font-weight: 800;
    }
    .cad-canvas {
      width: 100%;
      height: 290px;
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      overflow: hidden;
    }
    .ctq-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      font-family: monospace;
      background: #020617;
      border: 1px solid #1e293b;
      margin-bottom: 12px;
    }
    .ctq-table th {
      background: #1e293b;
      color: #94a3b8;
      padding: 6px 10px;
      text-align: left;
      border: 1px solid #334155;
      font-weight: 700;
      text-transform: uppercase;
    }
    .ctq-table td {
      padding: 5px 10px;
      border: 1px solid #1e293b;
      color: #cbd5e1;
    }
    .title-block {
      display: grid;
      grid-template-columns: 2fr 1.2fr 1fr 1fr;
      border: 2px solid #38bdf8;
      background: #0f172a;
      font-size: 10px;
      font-family: monospace;
    }
    .block-cell {
      padding: 6px 10px;
      border-right: 1px solid #1e293b;
      border-bottom: 1px solid #1e293b;
    }
    .block-label {
      font-size: 8px;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .block-value {
      font-weight: bold;
      color: #ffffff;
      font-size: 11px;
    }
    @media print {
      body { background: white; color: black; padding: 0; }
      .no-print { display: none !important; }
      .sheet { border: 2px solid black; background: white; box-shadow: none; padding: 6px; }
      .company-title { color: black; }
      .cad-canvas { background: white; border: 1px solid black; }
      .title-block { border: 1px solid black; background: white; }
      .block-value { color: black; }
      .block-label { color: #333; }
      .ctq-table { background: white; border: 1px solid black; color: black; }
      .ctq-table th { background: #eee; color: black; border: 1px solid black; }
      .ctq-table td { border: 1px solid black; color: black; }
    }
  </style>
</head>
<body>
  <!-- Top Navigation & Role Based Download Toolbar -->
  <div class="no-print">
    <div style="display: flex; align-items: center; gap: 10px;">
      <button onclick="window.print()" class="action-btn download-pdf-btn">
        ⬇️ Download Official PDF (A4 Landscape Print)
      </button>
      <a href="?format=dxf" class="action-btn download-cad-btn">
        📐 Download CAD Vector (.DXF)
      </a>
    </div>
    <div style="font-size: 11px; color: #94a3b8; font-family: monospace;">
      <span style="color: #34d399; font-weight: bold;">● ROLE ACCESS AUTHORIZED:</span> All Roles (Production M4, QC, Stores M2, Engineering M3)
    </div>
  </div>

  <div class="sheet">
    <div class="header-bar">
      <div>
        <div class="company-title">YASH GROUP — ENGINEERING DRAWING OFFICE</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Standard Manufacturing & Fabrication Blueprint (IS 3043 / UL 467 / IEC 62561 / NFC 17-102)</div>
      </div>
      <div>
        <span class="badge">RELEASED FOR SHOP-FLOOR (PRODUCTION M4)</span>
      </div>
    </div>

    <!-- Dynamic 2D Scaled CAD Diagram Projection -->
    <div class="cad-canvas">
      ${cadSvg}
    </div>

    <!-- Critical to Quality (CTQ) Manufacturing Inspection Table -->
    <div style="margin-bottom: 10px;">
      <div style="font-size: 10px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
        Critical-to-Quality (CTQ) Manufacturing & Quality Inspection Checklist (ISO 9001:2015)
      </div>
      <table class="ctq-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Inspection Parameter</th>
            <th>Nominal Design Value</th>
            <th>Permissible Tolerance</th>
            <th>Inspection Gauge / Method</th>
            <th>Sampling Frequency</th>
            <th>QA Acceptance</th>
          </tr>
        </thead>
        <tbody>
          ${ctqRows}
        </tbody>
      </table>
    </div>

    <!-- Shop-Floor Routing -->
    <div style="display: flex; justify-content: space-between; align-items: center; background: #020617; border: 1px solid #1e293b; border-radius: 6px; padding: 6px 12px; margin-bottom: 10px; font-size: 9px; font-family: monospace;">
      <span style="color: #94a3b8; font-weight: bold;">SHOP ROUTING:</span>
      <span style="color: #38bdf8;">01. Cutting & CNC</span>
      <span style="color: #64748b;">➔</span>
      <span style="color: #38bdf8;">02. Cladding / Plating</span>
      <span style="color: #64748b;">➔</span>
      <span style="color: #38bdf8;">03. Filling / Assembly</span>
      <span style="color: #64748b;">➔</span>
      <span style="color: #38bdf8;">04. Resistance / Surge Test</span>
      <span style="color: #64748b;">➔</span>
      <span style="color: #34d399; font-weight: bold;">05. QC Passed & Packing</span>
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
        <div class="block-label">Released Date</div>
        <div class="block-value">${now}</div>
      </div>
      <div class="block-cell">
        <div class="block-label">Prepared By</div>
        <div class="block-value">${uploadedBy || 'Eng. Vikram Sharma'}</div>
      </div>
      <div class="block-cell">
        <div class="block-label">Approved & Released By</div>
        <div class="block-value" style="color: #38bdf8;">${releasedBy || 'Head of Engineering (Pratik Senapati)'}</div>
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
  const vectorSvgSchematic = renderProductTechnicalSvg(product, category);

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
    .no-print {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .download-btn {
      padding: 10px 18px;
      background: #0284c7;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .download-btn:hover { background: #0369a1; }
    .product-visual-box {
      width: 260px;
      min-width: 260px;
      height: 180px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      background: #0b1329;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @media print {
      body { background: white; padding: 0; }
      .no-print { display: none !important; }
      .report-sheet { border: none; box-shadow: none; padding: 0; width: 100%; max-width: 100%; }
      .print-btn { display: none; }
    }
  </style>
  <script>
    function handleImageFallback(img) {
      img.style.display = 'none';
      var fallback = img.parentElement.querySelector('.fallback-schematic');
      if (fallback) fallback.style.display = 'block';
    }
  </script>
</head>
<body>
  <!-- Top Download Action Toolbar -->
  <div class="no-print">
    <div>
      <button class="download-btn" onclick="window.print()">
        ⬇️ Download / Save Official PDF
      </button>
    </div>
    <div style="font-size: 11px; color: #64748b; font-family: monospace;">
      <span style="color: #059669; font-weight: bold;">● ROLE AUTHORIZED:</span> Product Engineering Master & Datasheet (All Roles)
    </div>
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
      <div class="product-visual-box">
        ${imageSrc ? `
          <img src="${imageSrc}" alt="${product.name}" class="product-img" onerror="handleImageFallback(this)" />
          <div class="fallback-schematic" style="display: none; width: 100%; height: 100%;">
            ${vectorSvgSchematic}
          </div>
        ` : `
          <div class="fallback-schematic" style="width: 100%; height: 100%;">
            ${vectorSvgSchematic}
          </div>
        `}
      </div>
      
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
