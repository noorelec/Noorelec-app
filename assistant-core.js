/**
 * Volt — moteur conversationnel + géométrie + chiffrage (v2)
 */
export function normStr(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export const FALLBACK_PRICES = {
  "prise-simple": { name: "Prise 2P+T simple", price: 8.5, tempsBase: 25, cable: "3G2.5" },
  "prise-double": { name: "Prise 2P+T double", price: 14, tempsBase: 30, cable: "3G2.5" },
  "prise-triple": { name: "Prise 2P+T triple", price: 18, tempsBase: 35, cable: "3G2.5" },
  "prise-four": { name: "Prise dédiée four", price: 12, tempsBase: 40, cable: "3G2.5" },
  "prise-plaque": { name: "Alim. plaque / taque", price: 18, tempsBase: 50, cable: "5G6" },
  "prise-lavevaisselle": { name: "Prise lave-vaisselle", price: 12, tempsBase: 35, cable: "3G2.5" },
  "prise-frigo": { name: "Prise frigo", price: 10, tempsBase: 25, cable: "3G2.5" },
  interrupteur: { name: "Interrupteur simple", price: 7, tempsBase: 20, cable: "3G1.5" },
  "va-et-vient": { name: "Interrupteur va-et-vient", price: 9, tempsBase: 25, cable: "3G1.5" },
  "inter-prise": { name: "Ensemble inter + prise (vertical)", price: 16, tempsBase: 35, cable: "3G2.5" },
  eclairage: { name: "Point lumineux (plafond)", price: 6, tempsBase: 35, cable: "3G1.5", ceiling: true },
  "eclairage-spot": { name: "Spot plafond", price: 6, tempsBase: 30, cable: "3G1.5", ceiling: true },
  "eclairage-applique": { name: "Applique murale", price: 8, tempsBase: 35, cable: "3G1.5", ceiling: false },
  rj45: { name: "Prise RJ45", price: 15, tempsBase: 35, cable: "RJ45" },
  "cable-3G1.5": { name: "Câble 3G1.5", price: 1.2, unit: "m" },
  "cable-3G2.5": { name: "Câble 3G2.5", price: 1.8, unit: "m" },
  "cable-5G6": { name: "Câble 5G6", price: 3.5, unit: "m" },
  "cable-3G4": { name: "Câble 3G4", price: 2.5, unit: "m" },
  saignee: { name: "Saignée + rebouchage", price: 18, unit: "m", tempsBase: 15 },
  blochet: { name: "Blochet / boîte encastrée", price: 4.5, tempsBase: 10 },
  tube: { name: "Tube IRL / goulotte", price: 2.2, unit: "m" },
};

export const PROJECT_TYPES = [
  { id: "renovation", label: "Rénovation", emoji: "🔨" },
  { id: "neuf", label: "Construction neuve", emoji: "🏗️" },
  { id: "extension", label: "Extension / véranda", emoji: "🏡" },
  { id: "piece", label: "Une seule pièce", emoji: "🚪" },
  { id: "depannage", label: "Dépannage / ajout", emoji: "⚡" },
];

export const SCOPE_OPTIONS = [
  { id: "scope:piece", label: "Une pièce", emoji: "🚪" },
  { id: "scope:appartement", label: "Un appartement", emoji: "🏠" },
  { id: "scope:maison", label: "Toute la maison", emoji: "🏡" },
];

export const FLOOR_COUNT_OPTIONS = [
  { id: "floors:1", label: "1 niveau (RDC)" },
  { id: "floors:2", label: "2 niveaux (RDC + 1)" },
  { id: "floors:3", label: "3 niveaux" },
  { id: "floors:4", label: "4 niveaux +" },
];

export const FLOOR_NAMES = ["RDC", "1er étage", "2e étage", "3e étage"];


export const ROOM_PRESETS = [
  { id: "cuisine", label: "Cuisine", emoji: "🍳" },
  { id: "salon", label: "Salon", emoji: "🛋️" },
  { id: "salle-a-manger", label: "Salle à manger", emoji: "🍽️" },
  { id: "hall", label: "Hall / entrée", emoji: "🚪" },
  { id: "chambre", label: "Chambre", emoji: "🛏️" },
  { id: "sdb", label: "Salle de bain", emoji: "🚿" },
  { id: "wc", label: "WC", emoji: "🚽" },
  { id: "bureau", label: "Bureau", emoji: "💻" },
  { id: "couloir", label: "Couloir", emoji: "↔️" },
  { id: "garage", label: "Garage", emoji: "🚗" },
  { id: "autre", label: "Autre", emoji: "📦" },
];

export const POINT_TOOLS = [
  { id: "prise-simple", label: "Prise", ceiling: false },
  { id: "prise-double", label: "Double", ceiling: false },
  { id: "prise-triple", label: "Triple", ceiling: false },
  { id: "prise-four", label: "Four", ceiling: false },
  { id: "prise-plaque", label: "Taque", ceiling: false },
  { id: "interrupteur", label: "Inter", ceiling: false },
  { id: "va-et-vient", label: "Va-et-vient", ceiling: false },
  { id: "inter-prise", label: "Inter+prise", ceiling: false },
  { id: "eclairage", label: "Lumière", ceiling: true },
  { id: "eclairage-spot", label: "Spot", ceiling: true },
  { id: "eclairage-applique", label: "Applique", ceiling: false },
];

/** Architectural openings drawn on walls (not priced as points). */
export const OPENING_TOOLS = [
  { id: "porte", label: "Porte", kind: "door", defaultWidth: 0.9 },
  { id: "fenetre", label: "Fenêtre", kind: "window", defaultWidth: 1.2 },
  { id: "baie", label: "Baie", kind: "bay", defaultWidth: 2.0 },
];

function round2(n) { return Math.round(n * 100) / 100; }
function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }

export function rectPolygon(width, depth) {
  return [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: depth },
    { x: 0, y: depth },
  ];
}

export function rectWithChimney(width, depth, chimney = {}) {
  const wall = chimney.wall || "top";
  const w = Math.min(chimney.width || 1.5, width * 0.9);
  const d = Math.min(chimney.depth || 0.5, depth * 0.45);
  const mid = width / 2;
  const left = mid - w / 2;
  const right = mid + w / 2;
  if (wall === "bottom") {
    return [
      { x: 0, y: 0 }, { x: left, y: 0 }, { x: left, y: d }, { x: right, y: d },
      { x: right, y: 0 }, { x: width, y: 0 }, { x: width, y: depth }, { x: 0, y: depth },
    ];
  }
  if (wall === "left") {
    const midY = depth / 2;
    return [
      { x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: depth }, { x: 0, y: depth },
      { x: 0, y: midY + w / 2 }, { x: d, y: midY + w / 2 }, { x: d, y: midY - w / 2 }, { x: 0, y: midY - w / 2 },
    ];
  }
  if (wall === "right") {
    const midY = depth / 2;
    return [
      { x: 0, y: 0 }, { x: width, y: 0 },
      { x: width, y: midY - w / 2 }, { x: width - d, y: midY - w / 2 },
      { x: width - d, y: midY + w / 2 }, { x: width, y: midY + w / 2 },
      { x: width, y: depth }, { x: 0, y: depth },
    ];
  }
  // top (default) — encoche vers l'intérieur depuis le mur du haut (y=depth)
  return [
    { x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: depth },
    { x: right, y: depth }, { x: right, y: depth - d }, { x: left, y: depth - d },
    { x: left, y: depth }, { x: 0, y: depth },
  ];
}

export function polygonBounds(poly) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of poly) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, depth: maxY - minY };
}

export function polygonEdges(poly) {
  const edges = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    edges.push({ i, a, b, length: dist(a, b) });
  }
  return edges;
}

export function polygonPerimeter(poly) {
  return polygonEdges(poly).reduce((s, e) => s + e.length, 0);
}

export function polygonCentroid(poly) {
  let x = 0, y = 0;
  for (const p of poly) { x += p.x; y += p.y; }
  return { x: x / poly.length, y: y / poly.length };
}

export function pointOnEdge(edge, t) {
  const u = Math.max(0, Math.min(1, t));
  return { x: edge.a.x + (edge.b.x - edge.a.x) * u, y: edge.a.y + (edge.b.y - edge.a.y) * u };
}

export function nearestEdgePoint(poly, px, py) {
  const edges = polygonEdges(poly);
  let best = null;
  for (const e of edges) {
    const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((px - e.a.x) * dx + (py - e.a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const q = pointOnEdge(e, t);
    const d = dist(q, { x: px, y: py });
    if (!best || d < best.dist) best = { edgeIndex: e.i, t, x: q.x, y: q.y, dist: d, length: e.length };
  }
  return best;
}

export function edgePathLength(poly, from, to) {
  const edges = polygonEdges(poly);
  const P = polygonPerimeter(poly);
  function pos(ref) {
    let s = 0;
    for (let i = 0; i < ref.edgeIndex; i++) s += edges[i].length;
    s += edges[ref.edgeIndex].length * (ref.t || 0);
    return s;
  }
  const d = Math.abs(pos(to) - pos(from));
  return Math.min(d, P - d);
}

export function isCeilingType(type) {
  return !!(FALLBACK_PRICES[type]?.ceiling) || type === "eclairage" || type === "eclairage-spot";
}

export function parseEquipmentText(text) {
  return parseInstallText(text).equipment;
}

/**
 * Parse free text for gear + openings + door-side kits (va-et-vient…).
 * Understands e.g. "2 portes avec inter/prise et va-et-vient".
 */
export function parseInstallText(text) {
  const t = normStr(text);
  const equipment = [];
  const openings = [];
  const notes = [];

  const addEq = (type, qty, labelOverride = null) => {
    if (!(qty > 0)) return;
    const label = labelOverride || FALLBACK_PRICES[type]?.name || type;
    // Light groups stay separate by type; wall gear merges by type
    const ex = equipment.find((i) => i.type === type && i.label === label);
    if (ex) ex.qty += qty;
    else equipment.push({ type, qty, label });
  };

  const wordQty = (s) => {
    if (/deux/.test(s)) return 2;
    if (/trois/.test(s)) return 3;
    if (/quatre/.test(s)) return 4;
    if (/une?\b/.test(s)) return 1;
    const m = s.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  };

  // --- openings ---
  let doorQty = 0;
  const doorNum = t.match(/(\d+)\s*portes?/);
  if (doorNum) doorQty = parseInt(doorNum[1], 10);
  else if (/deux\s+portes?/.test(t)) doorQty = 2;
  else if (/portes?\s+d.?entree|porte\s+d.?entree|portes?/.test(t) && /porte/.test(t)) {
    doorQty = /portes/.test(t) ? 2 : 1;
  }
  if (doorQty > 0) {
    openings.push({ kind: "door", qty: doorQty, width: 0.9 });
    notes.push(`${doorQty} porte${doorQty > 1 ? "s" : ""}`);
  }

  let winQty = 0;
  const winNum = t.match(/(\d+)\s*fenetres?/);
  if (winNum) winQty = parseInt(winNum[1], 10);
  else if (/deux\s+fenetres?/.test(t)) winQty = 2;
  else if (/\bfenetres?\b/.test(t)) winQty = 1;
  if (winQty > 0) {
    openings.push({ kind: "window", qty: winQty, width: 1.2 });
    notes.push(`${winQty} fenêtre${winQty > 1 ? "s" : ""}`);
  }

  let bayQty = 0;
  const bayNum = t.match(/(\d+)\s*baies?/);
  if (bayNum) bayQty = parseInt(bayNum[1], 10);
  else if (/\bbaie\b/.test(t)) bayQty = 1;
  if (bayQty > 0) {
    openings.push({ kind: "bay", qty: bayQty, width: 2 });
    notes.push(`${bayQty} baie${bayQty > 1 ? "s" : ""}`);
  }

  // --- va-et-vient / inter+prise ---
  const hasVev = /va[\s-]*et[\s-]*vient/.test(t);
  const hasInterPrise = /interrupteur\s*\/\s*prise|inter(?:rupteur)?\s*(?:\/|et)\s*prise|prise\s*(?:\/|et)\s*inter|a cote de chaque porte|a cote des? portes?|double\s+prise\s*\/\s*inter|prise\s*\/\s*interrupteur|avec\s+(?:une?\s+)?prise\s+a\s+chaque|vev\s*\+?\s*prise/.test(t);
  const vertical = /vertical/.test(t);
  let vevHandled = false;

  if ((hasVev || hasInterPrise) && doorQty >= 2) {
    // 2+ portes → va-et-vient + prise à chaque porte (1 numéro = inter+prise par porte)
    addEq("inter-prise", doorQty, `Inter+prise / va-et-vient (×${doorQty})`);
    notes.push(`va-et-vient entre les ${doorQty} portes + prise à côté de chaque${vertical ? " (vertical)" : ""}`);
    vevHandled = true;
  } else if (hasVev && hasInterPrise) {
    // « va-et-vient avec une prise à chaque fois » → 2 postes par défaut (circuit)
    const explicit = t.match(/(\d+)\s*(?:va[\s-]*et[\s-]*vient|ensembles?|postes?|inter(?:rupteurs?)?\s*\+\s*prises?)/);
    const q = Math.max(doorQty || 0, explicit ? parseInt(explicit[1], 10) : 0, /chaque/.test(t) ? 2 : 0, 2);
    addEq("inter-prise", q, `Inter+prise / va-et-vient (×${q})`);
    notes.push(`${q} ensemble(s) va-et-vient + prise`);
    vevHandled = true;
  } else if (hasVev && doorQty >= 1) {
    addEq("va-et-vient", Math.max(doorQty, 2));
    notes.push(`va-et-vient (${Math.max(doorQty, 2)} inters, 1 circuit)`);
    if (/prise/.test(t)) {
      addEq("prise-simple", doorQty);
      notes.push("prise à côté de chaque porte");
    }
    vevHandled = true;
  } else if (hasInterPrise && doorQty >= 1) {
    addEq("inter-prise", doorQty);
    notes.push(vertical ? "ensembles verticaux inter+prise à côté des portes" : "inter/prise à côté des portes");
    vevHandled = true;
  } else if (hasVev) {
    // Explicit qty only — never steal "2" from "2x prises"
    const explicit = t.match(/(\d+)\s*x?\s*va[\s-]*et[\s-]*vient/)
      || t.match(/va[\s-]*et[\s-]*vient\s*[x×]?\s*(\d+)/)
      || t.match(/\b(une?|un)\s+va[\s-]*et[\s-]*vient/);
    let q = 1;
    if (explicit) {
      if (/^(une?|un)$/.test(explicit[1] || "")) q = 1;
      else q = parseInt(explicit[1], 10) || 1;
    }
    addEq("va-et-vient", q);
    notes.push(q === 1 ? "1 va-et-vient (à placer — circuit souvent 2 inters)" : `${q} va-et-vient`);
    vevHandled = true;
  }

  // --- light groups (spots / appliques share one number each) ---
  let lightSpots = 0;
  let lightAppliques = 0;
  let lightGeneric = 0;
  const spotM = t.match(/(\d+)\s*spots?\b/);
  if (spotM) lightSpots = parseInt(spotM[1], 10);
  const appM = t.match(/(\d+)\s*appliques?\b/);
  if (appM) lightAppliques = parseInt(appM[1], 10);
  const genLight = [...t.matchAll(/(\d+)\s*(?:points?\s*)?(?:lumineux|eclairages?|lumieres?)(?!\s*spot|\s*applique)/g)];
  for (const m of genLight) lightGeneric += parseInt(m[1], 10) || 1;
  if (lightSpots > 0) {
    addEq("eclairage-spot", lightSpots, `${lightSpots} spot${lightSpots > 1 ? "s" : ""} (même circuit)`);
    notes.push(`${lightSpots} spots → même n° sur le plan`);
  }
  if (lightAppliques > 0) {
    addEq("eclairage-applique", lightAppliques, `${lightAppliques} applique${lightAppliques > 1 ? "s" : ""} (même circuit)`);
    notes.push(`${lightAppliques} appliques → même n° sur le plan`);
  }
  if (lightGeneric > 0) {
    addEq("eclairage", lightGeneric, `${lightGeneric} lumière${lightGeneric > 1 ? "s" : ""} (même circuit)`);
    notes.push(`${lightGeneric} lumières → même n°`);
  }

  // --- classic equipment patterns (supports "2x", "2×", "2 prises") ---
  const patterns = [
    { re: /(\d+)\s*[x×]?\s*prises?\s+triples?\b/g, type: "prise-triple" },
    { re: /(\d+)\s*[x×]?\s*prises?\s+doubles?\b/g, type: "prise-double" },
    { re: /(\d+)\s*[x×]?\s*prises?\s+simples?\b/g, type: "prise-simple" },
    { re: /(\d+)\s*[x×]\s*prises?\b(?!\s*(?:doubles?|simples?|triples?|four|plaque|taque|frigo|lave))/g, type: "prise-simple" },
    { re: /(\d+)\s*prises?\b(?!\s*(?:doubles?|simples?|triples?|four|plaque|taque|frigo|lave))/g, type: "prise-simple" },
    { re: /(\d+)\s*[x×]?\s*interrupteurs?(?!\s*\/\s*prise)/g, type: "interrupteur" },
    { re: /\b(?:un|une)\s+interrupteur(?!\s*\/\s*prise)/g, type: "interrupteur", qty: 1 },
    { re: /prise\s*(?:pour\s*)?(?:le\s*)?four|\bfour\b/g, type: "prise-four", qty: 1 },
    { re: /prise\s*(?:pour\s*)?(?:la\s*)?(?:taque|plaque)|\btaque\b|plaque\s*(?:de\s*)?cuisson/g, type: "prise-plaque", qty: 1 },
    { re: /lave[\s-]?vaisselle/g, type: "prise-lavevaisselle", qty: 1 },
    { re: /\bfrigo\b|refrigerateur/g, type: "prise-frigo", qty: 1 },
    { re: /(\d+)\s*(?:prises?\s*)?rj\s*45|ethernet/g, type: "rj45" },
  ];
  for (const p of patterns) {
    const re = new RegExp(p.re.source, p.re.flags);
    let m;
    while ((m = re.exec(t)) !== null) {
      const qty = p.qty ?? (parseInt(m[1], 10) || 1);
      // skip bare "prise" if already counted as door-side / vev kit prises
      if (p.type === "prise-simple" && (hasInterPrise || vevHandled) && !/prises?\s+simples?/.test(m[0])) {
        continue;
      }
      addEq(p.type, qty);
    }
  }

  if (!equipment.length && !openings.length && /prise/.test(t)) {
    addEq("prise-simple", 1);
  }

  return { equipment, openings, notes };
}

/**
 * Parcours B : un n° par type, qty à placer par multi-tap
 * (ex. n°1 = 2× prises double → tape 2 fois).
 */
export function buildPlacePlan(session) {
  const plan = [];
  let mark = 1;
  for (const eq of session.equipment || []) {
    if (!(eq.qty > 0)) continue;
    plan.push({
      mark,
      type: eq.type,
      qty: eq.qty,
      placed: 0,
      label: eq.label || FALLBACK_PRICES[eq.type]?.name || eq.type,
      group: true,
    });
    mark += 1;
  }
  session.placePlan = plan;
  return plan;
}

function setEquipmentFromParse(session, items) {
  session.equipment = [];
  for (const e of items || []) addEquipment(session, e.type, e.qty);
}

function countPlacedForMark(session, markItem) {
  if (!markItem) return 0;
  return (session.placements || []).filter((p) => p.mark === markItem.mark).length;
}

function syncPlacePlanCounts(session) {
  for (const item of session.placePlan || []) {
    item.placed = countPlacedForMark(session, item);
  }
}

export function formatPlacePlan(session) {
  const plan = session.placePlan || buildPlacePlan(session);
  if (!plan.length) return "";
  return plan
    .map((item) => {
      if (item.group) return `n°${item.mark} = ${item.label} (tape ${item.qty}× sur le plan)`;
      return `n°${item.mark} = ${item.label}`;
    })
    .join("\n");
}

/** Snap ceiling lights into a clean row / grid while multi-tapping. */
export function alignLightPlacement(existing, x, y) {
  const round3 = (n) => Math.round(n * 1000) / 1000;
  if (!existing?.length) return { x: round3(x), y: round3(y) };
  const tol = 0.28;

  if (existing.length === 1) {
    const a = existing[0];
    if (Math.abs(x - a.x) >= Math.abs(y - a.y)) {
      return { x: round3(x), y: round3(a.y) }; // horizontal row
    }
    return { x: round3(a.x), y: round3(y) }; // vertical column
  }

  const uniqSorted = (vals) => {
    const out = [];
    for (const v of [...vals].sort((a, b) => a - b)) {
      if (!out.length || Math.abs(out[out.length - 1] - v) > tol * 0.6) out.push(v);
    }
    return out;
  };
  const cols = uniqSorted(existing.map((p) => p.x));
  const rows = uniqSorted(existing.map((p) => p.y));

  const nearest = (arr, v) => arr.reduce((b, a) => (Math.abs(a - v) < Math.abs(b - v) ? a : b));
  const extend = (arr, v) => {
    if (arr.length < 2) return v;
    const gaps = [];
    for (let i = 1; i < arr.length; i++) gaps.push(arr[i] - arr[i - 1]);
    const spacing = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    if (v < arr[0] - tol * 0.5) return arr[0] - spacing;
    if (v > arr[arr.length - 1] + tol * 0.5) return arr[arr.length - 1] + spacing;
    return nearest(arr, v);
  };

  let sx = x;
  let sy = y;
  const nearRow = nearest(rows, y);
  const nearCol = nearest(cols, x);
  if (Math.abs(nearRow - y) <= tol) sy = nearRow;
  else sy = extend(rows, y);
  if (Math.abs(nearCol - x) <= tol) sx = nearCol;
  else sx = extend(cols, x);

  // Prefer continuing a 2×N / 3×N grid when a full row exists
  if (rows.length === 1 && cols.length >= 2) {
    const rowCount = existing.filter((p) => Math.abs(p.y - rows[0]) < tol).length;
    if (rowCount >= 2 && Math.abs(y - rows[0]) > tol) {
      const spacingY = cols.length >= 2
        ? Math.abs(cols[1] - cols[0])
        : 0.6;
      sy = rows[0] + (y > rows[0] ? spacingY : -spacingY);
      sx = nearCol;
    }
  }

  return { x: round3(sx), y: round3(sy) };
}

export function parseRoomDescription(text) {
  const t = normStr(text).replace(/,/g, ".");
  const num = "(\\d+(?:\\.\\d+)?)";
  const unit = "(?:\\s*(?:m|metres?|mètres?|cm))?";
  let width = null, depth = null, height = 2.5;
  const sur = t.match(new RegExp(`${num}${unit}\\s*(?:sur|x|par|par)\\s*${num}${unit}`, "i"));
  if (sur) {
    width = parseFloat(sur[1]); depth = parseFloat(sur[2]);
    if (width > 30) width /= 100; if (depth > 30) depth /= 100;
  }
  const triple = t.match(new RegExp(`${num}\\s*[x×]\\s*${num}\\s*[x×]\\s*${num}`, "i"));
  if (triple) { width = parseFloat(triple[1]); depth = parseFloat(triple[2]); height = parseFloat(triple[3]); }
  const carre = t.match(new RegExp(`(?:carre|carré|piece carree|pièce carrée)\\s*(?:de\\s*)?${num}${unit}`, "i"))
    || t.match(new RegExp(`${num}${unit}\\s*(?:sur|x)\\s*\\1`, "i"));
  if (carre && (!width || !depth)) {
    const s = parseFloat(carre[1]);
    width = depth = s > 30 ? s / 100 : s;
  }
  const h = t.match(new RegExp(`hauteur\\s*(?:de\\s*)?${num}${unit}`, "i"))
    || t.match(new RegExp(`${num}${unit}\\s*(?:de\\s*)?haut`, "i"));
  if (h) {
    height = parseFloat(h[1]);
    if (height > 10) height /= 100;
  }
  let chimney = null;
  if (/cheminee|foyer|encoche|decrochement|renfoncement/.test(t)) {
    let cw = 1.0, cd = 0.5;
    const wMatch = t.match(new RegExp(`(?:large(?:ur)?|de\\s+large)\\s*(?:de\\s*)?${num}\\s*(cm|m)?`, "i"))
      || t.match(new RegExp(`${num}\\s*(cm|m)?\\s*(?:de\\s*)?large`, "i"));
    const dMatch = t.match(new RegExp(`(?:epaisseur|profondeur)\\s*(?:de\\s*)?${num}\\s*(cm|m)?`, "i"))
      || t.match(new RegExp(`${num}\\s*(cm|m)?\\s*(?:d'?|de\\s*)?(?:epaisseur|profondeur)`, "i"));
    if (wMatch) { cw = parseFloat(wMatch[1]); if ((wMatch[2] || "").includes("cm") || cw > 10) cw /= 100; }
    if (dMatch) { cd = parseFloat(dMatch[1]); if ((dMatch[2] || "").includes("cm") || cd > 5) cd /= 100; }
    let wall = "right";
    if (/mur\s+(?:de\s+)?(?:gauche|left)/.test(t)) wall = "left";
    else if (/mur\s+(?:de\s+)?(?:droite|right)/.test(t)) wall = "right";
    else if (/mur\s+(?:du\s+)?(?:bas|sud)/.test(t)) wall = "bottom";
    else if (/mur\s+(?:du\s+)?(?:haut|nord)/.test(t)) wall = "top";
    chimney = { width: cw, depth: cd, wall };
  }
  if (!width || !depth) return null;
  const polygon = chimney ? rectWithChimney(width, depth, chimney) : rectPolygon(width, depth);
  return { width, depth, height: height || 2.5, chimney, polygon, source: chimney ? "rect+cheminee" : "rect" };
}

function wantsGeometryFix(t) {
  return /(mur\s+(de\s+)?(gauche|droite)|mur droit|fusionne|align|trop de points?|pas besoin .{0,40}points?|points? (different|inutile)|un seul (mur|segment)|simplif(ier)? murs?|redress|carre de|piece de \d|6\s*(m|metres?)?\s*(sur|x|×)\s*6|cheminee sur le mur)/.test(t);
}

function geometryFixActions(extra = []) {
  return [
    { id: "walls:done", label: "Cotes OK → Continuer" },
    { id: "walls:simplify", label: "Simplifier murs droits" },
    { id: "draw:restart", label: "Recommencer le dessin" },
    ...extra,
  ];
}

/** Merge stray points / rebuild a clean room from natural language. */
function applyGeometryFix(session, userText, t) {
  const parsed = parseRoomDescription(userText || "");
  if (parsed && (parsed.width >= 1.5 || /carre|rectangle|cheminee|sur|x/.test(t))) {
    const height = session.dimensions?.height || parsed.height || 2.5;
    session.dimensions = {
      width: parsed.width,
      depth: parsed.depth,
      height,
      polygon: parsed.polygon,
      chimney: parsed.chimney,
      templatePolygon: null,
      edgeLengths: null,
      source: "corrected",
    };
    finalizeDrawnPolygon(session.dimensions);
    const edges = polygonEdges(session.dimensions.polygon);
    session.dimensions.edgeLengths = edges.map((e) => round2(e.length));
    session.dimensions.templatePolygon = session.dimensions.polygon.map((p) => ({ x: p.x, y: p.y }));
    session._selectedEdge = null;
    session.step = "measure-walls";
    return {
      text: `Compris — pièce propre ${parsed.width}×${parsed.depth} m${parsed.chimney ? " avec cheminée" : ""}, murs droits (plus de points inutiles). Vérifie les cotes ou continue.`,
      actions: geometryFixActions(),
      showSketch: true,
      sketchMode: "measure",
      speak: true,
    };
  }

  if (!session.dimensions?.polygon?.length) return null;
  const before = session.dimensions.polygon.length;
  session.dimensions.polygon = cleanRoomPolygon(session.dimensions.polygon);
  finalizeDrawnPolygon(session.dimensions);

  // Optional: "mur de gauche … 6 m" after simplify
  const lenMatch = t.match(/(\d+(?:[.,]\d+)?)\s*m/);
  const len = lenMatch ? parseFloat(lenMatch[1].replace(",", ".")) : NaN;
  if (Number.isFinite(len) && len > 0) {
    const edges = polygonEdges(session.dimensions.polygon);
    let idx = null;
    if (/gauche|left/.test(t)) {
      let best = Infinity;
      edges.forEach((e) => {
        const midX = (e.a.x + e.b.x) / 2;
        const vert = Math.abs(e.a.x - e.b.x) < Math.abs(e.a.y - e.b.y);
        if (vert && midX < best) { best = midX; idx = e.i; }
      });
    } else if (/droite|right/.test(t)) {
      let best = -Infinity;
      edges.forEach((e) => {
        const midX = (e.a.x + e.b.x) / 2;
        const vert = Math.abs(e.a.x - e.b.x) < Math.abs(e.a.y - e.b.y);
        if (vert && midX > best) { best = midX; idx = e.i; }
      });
    } else if (/haut|nord|fond/.test(t)) {
      let best = -Infinity;
      edges.forEach((e) => {
        const midY = (e.a.y + e.b.y) / 2;
        const horiz = Math.abs(e.a.y - e.b.y) < Math.abs(e.a.x - e.b.x);
        if (horiz && midY > best) { best = midY; idx = e.i; }
      });
    } else if (/bas|sud/.test(t)) {
      let best = Infinity;
      edges.forEach((e) => {
        const midY = (e.a.y + e.b.y) / 2;
        const horiz = Math.abs(e.a.y - e.b.y) < Math.abs(e.a.x - e.b.x);
        if (horiz && midY < best) { best = midY; idx = e.i; }
      });
    }
    if (idx != null) setEdgeLength(session.dimensions, idx, len);
  }

  const after = session.dimensions.polygon.length;
  session._selectedEdge = null;
  session.step = "measure-walls";
  return {
    text: after < before
      ? `OK — points alignés fusionnés : ${before} coins → ${after}. Un mur droit = un seul segment${Number.isFinite(len) ? ` (cote ${len} m appliquée si le mur était identifiable)` : ""}. Tu peux aussi écrire « 6 sur 6 avec cheminée sur le mur de droite ».`
      : `Plan réaligné (${after} coins). Pour un résultat nickel : « cuisine 6 sur 6 avec cheminée 1 m sur le mur de droite ».`,
    actions: geometryFixActions(),
    showSketch: true,
    sketchMode: "measure",
    speak: true,
  };
}

export function detectRoomType(text) {
  const t = normStr(text);
  for (const r of ROOM_PRESETS) {
    if (t.includes(normStr(r.id)) || t.includes(normStr(r.label))) return r.id;
  }
  if (/cuisine|kitchen/.test(t)) return "cuisine";
  if (/salon|sejour|living/.test(t)) return "salon";
  if (/chambre|bedroom/.test(t)) return "chambre";
  if (/bain|sdb|douche/.test(t)) return "sdb";
  if (/garage/.test(t)) return "garage";
  if (/bureau|office/.test(t)) return "bureau";
  return null;
}

export function createSession() {
  return {
    step: "scope",
    scope: null, // piece | appartement | maison
    projectType: null,
    floorsCount: null,
    floors: [], // [{ id, name, level, pendingRoomTypes: [] }]
    floorSetupIndex: 0,
    rooms: [], // full room records
    currentRoomId: null,
    pendingEquipment: null, // awaiting confirm (Path B)
    guideIndex: 0,
    roomType: null,
    roomName: "",
    dimensions: null,
    equipment: [],
    placements: [],
    openings: [],
    arrival: null,
    panel: null,
    tech: { mursNu: null, saignees: null, rewirage: null, tubes: null, apparent: null, cablePath: null },
    client: { nom: "", telephone: "", email: "", adresse: "" },
    messages: [],
    notes: [],
    placePlan: [],
    _selectedEdge: null,
  };
}

export function createPoint(type, x, y, extra = {}) {
  const ceiling = isCeilingType(type);
  return {
    id: `p${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    label: FALLBACK_PRICES[type]?.name || type,
    x, y,
    mode: ceiling ? "ceiling" : "wall",
    edgeIndex: extra.edgeIndex ?? null,
    t: extra.t ?? null,
    existing: !!extra.existing,
    saignee: extra.saignee ?? null,
    blochet: !!extra.blochet,
    nearOpeningId: extra.nearOpeningId ?? null,
    mark: extra.mark ?? null,
  };
}

export function createOpening(kind, edgeIndex, t, extra = {}) {
  const tool = OPENING_TOOLS.find((o) => o.kind === kind || o.id === kind) || OPENING_TOOLS[0];
  const k = tool.kind;
  return {
    id: `o${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    kind: k,
    label: tool.label,
    edgeIndex,
    t: Math.min(0.92, Math.max(0.08, t ?? 0.5)),
    width: extra.width ?? tool.defaultWidth ?? 0.9,
    swing: extra.swing || "in-left",
  };
}

/** Place N openings of a kind on the longest walls (evenly). */
export function autoPlaceOpenings(session, kind, qty, width) {
  const poly = session.dimensions?.polygon;
  if (!poly || poly.length < 3 || qty < 1) return [];
  if (!session.openings) session.openings = [];
  const edges = polygonEdges(poly)
    .map((e) => ({ ...e, length: dist(e.a, e.b) }))
    .sort((a, b) => b.length - a.length);
  const placed = [];
  for (let i = 0; i < qty; i++) {
    const edge = edges[i % edges.length];
    const slot = 0.25 + (0.5 * ((i % 3) + 1)) / 4;
    const o = createOpening(kind, edge.i, slot, { width });
    session.openings.push(o);
    placed.push(o);
  }
  return placed;
}

function addEquipment(session, type, qty) {
  if (!(qty > 0)) return;
  const ex = session.equipment.find((e) => e.type === type);
  if (ex) ex.qty += qty;
  else session.equipment.push({ type, qty, label: FALLBACK_PRICES[type]?.name || type });
}

/** Ramer–Douglas–Peucker simplification (world meters). */
export function simplifyStroke(points, epsilon = 0.12) {
  if (!points || points.length < 3) return points ? points.map((p) => ({ x: p.x, y: p.y })) : [];
  const sq = (epsilon) => epsilon * epsilon;
  const segDist2 = (p, a, b) => {
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    if (dx === 0 && dy === 0) return (p.x - a.x) ** 2 + (p.y - a.y) ** 2;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    const x = a.x + t * dx;
    const y = a.y + t * dy;
    return (p.x - x) ** 2 + (p.y - y) ** 2;
  };
  const rdp = (pts) => {
    if (pts.length < 3) return pts;
    let maxD = 0;
    let idx = 0;
    const a = pts[0];
    const b = pts[pts.length - 1];
    for (let i = 1; i < pts.length - 1; i++) {
      const d = segDist2(pts[i], a, b);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > sq(epsilon)) {
      const left = rdp(pts.slice(0, idx + 1));
      const right = rdp(pts.slice(idx));
      return left.slice(0, -1).concat(right);
    }
    return [a, b];
  };
  return rdp(points.map((p) => ({ x: p.x, y: p.y })));
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Remove vertices that sit on an almost-straight wall. */
export function mergeCollinearPoints(poly, angleTolDeg = 14) {
  if (!poly || poly.length < 3) return [];
  const tol = (angleTolDeg * Math.PI) / 180;
  let pts = poly.map((p) => ({ x: p.x, y: p.y }));
  for (let guard = 0; guard < 24; guard++) {
    const n = pts.length;
    if (n < 3) break;
    const keep = [];
    let removed = false;
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n];
      const b = pts[i];
      const c = pts[(i + 1) % n];
      if (dist(a, b) < 1e-6 || dist(b, c) < 1e-6) {
        removed = true;
        continue;
      }
      const angIn = Math.atan2(b.y - a.y, b.x - a.x);
      const angOut = Math.atan2(c.y - b.y, c.x - b.x);
      if (Math.abs(angleDiff(angOut, angIn)) < tol) {
        removed = true;
        continue;
      }
      keep.push(b);
    }
    if (!removed || keep.length < 3) {
      if (keep.length >= 3) pts = keep;
      break;
    }
    pts = keep;
  }
  return pts;
}

/** Snap near-horizontal / near-vertical walls, then merge same-direction runs. */
export function orthogonalizePolygon(poly, angleTolDeg = 22) {
  if (!poly || poly.length < 3) return [];
  const tol = (angleTolDeg * Math.PI) / 180;
  const n = poly.length;
  const lens = [];
  const angs = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    lens.push(Math.max(dist(a, b), 0.01));
    let ang = Math.atan2(b.y - a.y, b.x - a.x);
    const snap = Math.round(ang / (Math.PI / 2)) * (Math.PI / 2);
    if (Math.abs(angleDiff(ang, snap)) <= tol) ang = snap;
    angs.push(ang);
  }

  const mLens = [];
  const mAngs = [];
  for (let i = 0; i < n; i++) {
    if (mAngs.length && Math.abs(angleDiff(angs[i], mAngs[mAngs.length - 1])) < 1e-6) {
      mLens[mLens.length - 1] += lens[i];
    } else {
      mLens.push(lens[i]);
      mAngs.push(angs[i]);
    }
  }
  if (mLens.length < 3) return poly.map((p) => ({ x: p.x, y: p.y }));

  let x = poly[0].x;
  let y = poly[0].y;
  const raw = [{ x, y }];
  for (let i = 0; i < mLens.length; i++) {
    x += Math.cos(mAngs[i]) * mLens[i];
    y += Math.sin(mAngs[i]) * mLens[i];
    raw.push({ x, y });
  }
  const errX = raw[mLens.length].x - raw[0].x;
  const errY = raw[mLens.length].y - raw[0].y;
  const out = [];
  for (let i = 0; i < mLens.length; i++) {
    const t = i / mLens.length;
    out.push({
      x: round2(raw[i].x - errX * t),
      y: round2(raw[i].y - errY * t),
    });
  }
  return out;
}

function dropTinyEdges(poly, minLen) {
  if (!poly || poly.length < 3) return [];
  let pts = poly.map((p) => ({ x: p.x, y: p.y }));
  for (let guard = 0; guard < 16; guard++) {
    const n = pts.length;
    if (n < 3) break;
    const next = [pts[0]];
    let removed = false;
    for (let i = 0; i < n; i++) {
      const a = next[next.length - 1];
      const b = pts[(i + 1) % n];
      // last segment closes to first — handle at end
      if (i === n - 1) {
        if (dist(a, pts[0]) < minLen && next.length > 2) {
          // drop current last by not keeping issue — absorb into first
          removed = true;
        } else if (dist(a, pts[0]) >= minLen) {
          /* closed OK */
        }
        break;
      }
      if (dist(a, b) < minLen) {
        removed = true;
        continue; // skip b
      }
      next.push(b);
    }
    if (next.length >= 3 && dist(next[next.length - 1], next[0]) < minLen) {
      next.pop();
      removed = true;
    }
    if (!removed || next.length < 3) {
      pts = next.length >= 3 ? next : pts;
      break;
    }
    pts = next;
  }
  return pts;
}

/**
 * Clean a freehand room: fewer corners, straight walls, axis-aligned when close.
 * Keeps real corners (chimney notch, L-shape…).
 */
export function cleanRoomPolygon(poly) {
  if (!poly || poly.length < 3) return [];
  const bbox = polygonBounds(poly);
  const span = Math.max(bbox.width, bbox.depth, 1);
  let p = simplifyStroke(poly, Math.max(0.12, span * 0.045));
  if (p.length < 3) p = poly.map((pt) => ({ x: pt.x, y: pt.y }));
  p = mergeCollinearPoints(p, 18);
  p = orthogonalizePolygon(p, 24);
  p = mergeCollinearPoints(p, 12);
  p = dropTinyEdges(p, Math.max(0.15, span * 0.025));
  p = mergeCollinearPoints(p, 10);
  return p.length >= 3 ? p.map((pt) => ({ x: round2(pt.x), y: round2(pt.y) })) : poly.map((pt) => ({ x: pt.x, y: pt.y }));
}

/** Convert a freehand stroke into a closed room polygon. */
export function strokeToPolygon(stroke) {
  if (!stroke || stroke.length < 4) return [];
  const bbox = polygonBounds(stroke);
  const span = Math.max(bbox.width, bbox.depth, 1);
  // More aggressive simplify on fat finger strokes
  let poly = simplifyStroke(stroke, Math.max(0.14, span * 0.05));
  if (poly.length < 3) poly = simplifyStroke(stroke, Math.max(0.08, span * 0.03));
  if (poly.length < 3) return [];

  const first = poly[0];
  const last = poly[poly.length - 1];
  if (dist(first, last) < span * 0.15) poly.pop();
  const cleaned = [];
  for (const p of poly) {
    if (!cleaned.length || dist(cleaned[cleaned.length - 1], p) > Math.max(0.08, span * 0.015)) cleaned.push(p);
  }
  if (cleaned.length >= 3 && dist(cleaned[0], cleaned[cleaned.length - 1]) < 0.08) cleaned.pop();
  if (cleaned.length < 3) return [];
  return cleanRoomPolygon(cleaned);
}

/** Freeze sketch angles as a template before measuring walls. */
export function finalizeDrawnPolygon(dimensions) {
  if (!dimensions?.polygon || dimensions.polygon.length < 3) return false;
  dimensions.polygon = cleanRoomPolygon(dimensions.polygon);
  dimensions.templatePolygon = dimensions.polygon.map((p) => ({ x: p.x, y: p.y }));
  dimensions.edgeLengths = dimensions.polygon.map(() => null);
  const b = polygonBounds(dimensions.polygon);
  dimensions.width = round2(b.width);
  dimensions.depth = round2(b.depth);
  dimensions.source = "drawn";
  return true;
}

/**
 * Snap near-cardinal edge directions to exact H/V (house plans).
 * A freehand "almost square" becomes a real square once cotes are set.
 */
function snapDirOrtho(dx, dy, tolDeg = 28) {
  const len = Math.hypot(dx, dy) || 1;
  let ang = Math.atan2(dy, dx);
  const snap = Math.round(ang / (Math.PI / 2)) * (Math.PI / 2);
  const tol = (tolDeg * Math.PI) / 180;
  if (Math.abs(angleDiff(ang, snap)) <= tol) {
    return { x: Math.cos(snap), y: Math.sin(snap), ang: snap, ortho: true };
  }
  return { x: dx / len, y: dy / len, ang, ortho: false };
}

/**
 * Rebuild polygon from template directions + target lengths.
 * Near-orthogonal freehand sketches are snapped to true right angles so
 * 4× 5 m becomes a real square (not a skewed rhombus).
 */
export function rebuildPolygonFromTemplate(dimensions) {
  const template = dimensions.templatePolygon || dimensions.polygon;
  if (!template || template.length < 3) return;
  const n = template.length;
  const dirs = [];
  const lens = [];
  let allOrtho = true;
  for (let i = 0; i < n; i++) {
    const a = template[i];
    const b = template[(i + 1) % n];
    const d0 = dist(a, b) || 1;
    const snapped = snapDirOrtho(b.x - a.x, b.y - a.y);
    dirs.push(snapped);
    if (!snapped.ortho) allOrtho = false;
    const L = dimensions.edgeLengths?.[i];
    lens.push(L > 0 ? L : d0);
  }

  // Clean rectangle: only when all 4 cotes are set (avoid averaging too early)
  const allCotesSet = (dimensions.edgeLengths || []).length === n
    && (dimensions.edgeLengths || []).every((L) => L > 0);
  if (n === 4 && allOrtho && allCotesSet) {
    const a0 = dirs[0].ang;
    const a1 = dirs[1].ang;
    const turn = angleDiff(a1, a0);
    // Expect ~±90° turns
    if (Math.abs(Math.abs(turn) - Math.PI / 2) < 0.2) {
      // Prefer each entered length; opposite walls should match — use average
      const w = round2((lens[0] + lens[2]) / 2);
      const d = round2((lens[1] + lens[3]) / 2);
      const x0 = template[0].x;
      const y0 = template[0].y;
      const ux = dirs[0].x;
      const uy = dirs[0].y;
      const vx = dirs[1].x;
      const vy = dirs[1].y;
      const out = [
        { x: round2(x0), y: round2(y0) },
        { x: round2(x0 + ux * w), y: round2(y0 + uy * w) },
        { x: round2(x0 + ux * w + vx * d), y: round2(y0 + uy * w + vy * d) },
        { x: round2(x0 + vx * d), y: round2(y0 + vy * d) },
      ];
      dimensions.polygon = out;
      dimensions.templatePolygon = out.map((p) => ({ x: p.x, y: p.y }));
      dimensions.edgeLengths = [w, d, w, d];
      dimensions.width = w;
      dimensions.depth = d;
      return;
    }
  }

  let x = template[0].x;
  let y = template[0].y;
  const raw = [{ x, y }];
  for (let i = 0; i < n; i++) {
    x += dirs[i].x * lens[i];
    y += dirs[i].y * lens[i];
    raw.push({ x, y });
  }
  const errX = raw[n].x - raw[0].x;
  const errY = raw[n].y - raw[0].y;
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    out.push({
      x: round2(raw[i].x - errX * t),
      y: round2(raw[i].y - errY * t),
    });
  }
  dimensions.polygon = out;
  // Once ortho-snapped, refresh template so the skew does not come back
  if (allOrtho) {
    dimensions.templatePolygon = out.map((p) => ({ x: p.x, y: p.y }));
  }
  const b = polygonBounds(out);
  dimensions.width = round2(b.width);
  dimensions.depth = round2(b.depth);
}

/** Set one wall length then rebuild (snaps near-right angles). */
export function setEdgeLength(dimensions, edgeIndex, targetLen) {
  if (!dimensions?.polygon || edgeIndex == null || !(targetLen > 0)) return;
  if (!dimensions.templatePolygon) {
    dimensions.templatePolygon = dimensions.polygon.map((p) => ({ x: p.x, y: p.y }));
  }
  if (!dimensions.edgeLengths || dimensions.edgeLengths.length !== dimensions.templatePolygon.length) {
    dimensions.edgeLengths = dimensions.templatePolygon.map(() => null);
  }
  dimensions.edgeLengths[edgeIndex] = targetLen;
  rebuildPolygonFromTemplate(dimensions);
  dimensions.source = dimensions.source || "drawn";
}

/** @deprecated use setEdgeLength — kept name for older call sites */
export function scaleEdge(dimensions, edgeIndex, targetLen) {
  setEdgeLength(dimensions, edgeIndex, targetLen);
}

export function quoteRoomSources(session) {
  saveCurrentRoom(session);
  const done = (session.rooms || []).filter(
    (r) => r.status === "done" && ((r.equipment || []).length || (r.placements || []).length)
  );
  if (done.length) return done;
  return [{
    name: session.roomName || "Pièce",
    dimensions: session.dimensions,
    equipment: session.equipment || [],
    placements: session.placements || [],
    arrival: session.arrival,
  }];
}

export function buildQuote(session, settings = {}) {
  const tarif = settings.tarif ?? 50;
  const deplacement = settings.deplacement ?? 25;
  const tva = settings.tva ?? 0.06;
  const rebouchageM = settings.rebouchage ?? 18;
  const path = session.tech.cablePath || "murs";
  const rooms = quoteRoomSources(session);

  const byType = {};
  const cableMeters = {};
  let moMinutes = 0, materiel = 0, rebouchage = 0;
  let saigneeM = 0, blochetCount = 0;
  let totalCableM = 0;
  let pointsNeufs = 0, pointsExist = 0;

  for (const room of rooms) {
    const placements = room.placements || [];
    const equipment = room.equipment || [];
    const poly = room.dimensions?.polygon;
    const arrival = room.arrival;
    const H = room.dimensions?.height || 2.5;

    for (const p of placements) {
      if (p.existing) { pointsExist += 1; continue; }
      pointsNeufs += 1;
      byType[p.type] = (byType[p.type] || 0) + 1;
    }
    for (const eq of equipment) {
      const placed = placements.filter((p) => p.type === eq.type && !p.existing).length;
      const missing = Math.max(0, eq.qty - placed);
      if (missing > 0) byType[eq.type] = (byType[eq.type] || 0) + missing;
    }

    if (arrival && poly) {
      for (const p of placements) {
        if (p.existing) continue;
        let len = 0;
        const straight = Math.hypot(p.x - arrival.x, p.y - arrival.y);
        if (p.mode === "ceiling") {
          if (path === "plafond") len = (H - 0.3) + straight + 0.2;
          else if (path === "sol") len = 0.3 + straight + H;
          else if (p.edgeIndex != null && arrival.edgeIndex != null)
            len = edgePathLength(poly, arrival, { edgeIndex: p.edgeIndex, t: p.t || 0.5 }) + H * 0.5;
          else len = straight + H * 0.6;
        } else {
          if (path === "plafond") len = (H - 0.3) + straight + (H - 0.3);
          else if (path === "sol") len = 0.3 + straight + 0.3;
          else if (p.edgeIndex != null && arrival.edgeIndex != null)
            len = edgePathLength(poly, arrival, p) + 0.4;
          else len = straight + 0.4;
        }
        const ct = FALLBACK_PRICES[p.type]?.cable || "3G2.5";
        cableMeters[ct] = (cableMeters[ct] || 0) + len;
      }
    }

    for (const p of placements) {
      if (p.existing) continue;
      if (p.saignee === true || (p.saignee == null && session.tech.saignees === true)) {
        saigneeM += arrival ? Math.hypot(p.x - arrival.x, p.y - arrival.y) * 0.7 : 2;
      }
      if (p.blochet) blochetCount += 1;
    }
  }

  const articles = [];
  for (const [type, qty] of Object.entries(byType)) {
    const meta = FALLBACK_PRICES[type];
    if (!meta || !qty) continue;
    const line = meta.price * qty;
    materiel += line;
    moMinutes += (meta.tempsBase || 20) * qty;
    articles.push({ ref: type.toUpperCase(), name: meta.name, qty, category: "appareillage", prixAchat: meta.price, materiel: line, tempsBase: meta.tempsBase || 20, mo: 0, rebouchage: 0, total: 0 });
  }

  for (const [ct, meters] of Object.entries(cableMeters)) {
    const m = Math.ceil(meters * 10) / 10;
    totalCableM += m;
    const meta = FALLBACK_PRICES[`cable-${ct}`] || { name: `Câble ${ct}`, price: 1.5 };
    const line = meta.price * m;
    materiel += line; moMinutes += m * 8;
    articles.push({ ref: ct, name: meta.name, qty: m, unit: "m", category: "cables", prixAchat: meta.price, materiel: line, tempsBase: 8, mo: 0, rebouchage: 0, total: 0 });
  }

  if (saigneeM > 0) {
    saigneeM = Math.ceil(saigneeM * 10) / 10;
    const line = saigneeM * rebouchageM;
    materiel += line * 0.3; rebouchage += line * 0.7; moMinutes += saigneeM * 15;
    articles.push({ ref: "SAIGNEE", name: "Saignées + rebouchage", qty: saigneeM, unit: "m", category: "main-oeuvre", prixAchat: rebouchageM, materiel: line * 0.3, tempsBase: 15, mo: 0, rebouchage: line * 0.7, total: 0 });
  }
  if (blochetCount > 0) {
    const meta = FALLBACK_PRICES.blochet;
    const line = meta.price * blochetCount;
    materiel += line; moMinutes += meta.tempsBase * blochetCount;
    articles.push({ ref: "BLOCHET", name: meta.name, qty: blochetCount, category: "appareillage", prixAchat: meta.price, materiel: line, tempsBase: meta.tempsBase, mo: 0, rebouchage: 0, total: 0 });
  }
  if (session.tech.tubes === true && totalCableM > 0) {
    const m = Math.ceil(totalCableM * 10) / 10;
    const price = FALLBACK_PRICES.tube.price;
    materiel += price * m; moMinutes += m * 5;
    articles.push({ ref: "TUBE", name: FALLBACK_PRICES.tube.name, qty: m, unit: "m", category: "cables", prixAchat: price, materiel: price * m, tempsBase: 5, mo: 0, rebouchage: 0, total: 0 });
  }
  if (session.tech.rewirage === true || session.panel?.changeArrivalCable) {
    moMinutes += 120;
    articles.push({ ref: "REWIRE", name: session.panel?.changeArrivalCable ? "Reprise / changement câble d'arrivée" : "Remplacement / reprise câblage existant", qty: 1, category: "main-oeuvre", prixAchat: 0, materiel: 0, tempsBase: 120, mo: 0, rebouchage: 0, total: 0 });
  }

  const moHours = moMinutes / 60;
  const moCost = moHours * tarif;
  const totalTemps = articles.reduce((s, a) => s + (a.tempsBase || 0) * (a.qty || 1), 0) || 1;
  articles.forEach((a) => {
    a.mo = moCost * (((a.tempsBase || 0) * (a.qty || 1)) / totalTemps);
    a.total = (a.materiel || 0) + a.mo + (a.rebouchage || 0);
  });
  const totalHT = materiel + moCost + rebouchage + deplacement;
  const totalTVA = totalHT * tva;
  return {
    articles, cableMeters, totalCableM: Math.ceil(totalCableM * 10) / 10,
    roomCount: rooms.length,
    roomNames: rooms.map((r) => r.name).filter(Boolean),
    pointsNeufs, pointsExist,
    totaux: {
      materiel: round2(materiel), mainOeuvre: round2(moCost), rebouchage: round2(rebouchage),
      deplacement: round2(deplacement), totalHT: round2(totalHT), tva: round2(totalTVA),
      totalTTC: round2(totalHT + totalTVA), moHours: round2(moHours), tarif, tvaRate: tva,
    },
    path,
  };
}

function labelProject(id) { return PROJECT_TYPES.find((p) => p.id === id)?.label || id; }

function formatQuoteSpeech(session, quote) {
  const path = { murs: "murs", plafond: "plafond", sol: "sol" }[quote.path] || quote.path;
  const placed = quote.pointsNeufs ?? session.placements.filter((p) => !p.existing).length;
  const exist = quote.pointsExist ?? session.placements.filter((p) => p.existing).length;
  const planned = (quote.articles || [])
    .filter((a) => a.category === "appareillage")
    .reduce((s, a) => s + (a.qty || 0), 0);
  const neuves = Math.max(placed, planned);
  const scope =
    quote.roomCount > 1
      ? `les ${quote.roomCount} pièces (${(quote.roomNames || []).join(", ")})`
      : (quote.roomNames?.[0] || session.roomName || "la pièce");
  return (
    `Voici mon estimation pour ${scope} :\n\n` +
    `${neuves} point(s) à créer` + (exist ? `, ${exist} existant(s) (non facturés en neuf)` : "") + ".\n" +
    `Chemin câble : ${path}.\nLongueur totale : ~${quote.totalCableM} m.\n\n` +
    `Matériel : ${quote.totaux.materiel.toFixed(2)} € HT\n` +
    `Main d'œuvre (~${quote.totaux.moHours} h) : ${quote.totaux.mainOeuvre.toFixed(2)} € HT\n` +
    `Total TTC : ${quote.totaux.totalTTC.toFixed(2)} €\n\n` +
    `Tu peux encore bouger / supprimer des points, ou enregistrer.`
  );
}

function equipmentSuggestions(roomType) {
  if (roomType === "cuisine") {
    return [
      { id: "eq:prise-double", label: "+ Prise double" },
      { id: "eq:prise-four", label: "+ Prise four" },
      { id: "eq:prise-plaque", label: "+ Taque" },
      { id: "eq:eclairage", label: "+ Lumière plafond" },
      { id: "eq:interrupteur", label: "+ Inter" },
      { id: "eq:va-et-vient", label: "+ Va-et-vient" },
      { id: "eq:inter-prise", label: "+ Inter+prise" },
    ];
  }
  return [
    { id: "eq:prise-double", label: "+ Prise double" },
    { id: "eq:prise-simple", label: "+ Prise simple" },
    { id: "eq:interrupteur", label: "+ Inter" },
    { id: "eq:va-et-vient", label: "+ Va-et-vient" },
    { id: "eq:inter-prise", label: "+ Inter+prise" },
    { id: "eq:eclairage", label: "+ Lumière plafond" },
  ];
}

function autoPlaceCeilingLights(session) {
  if (!session.dimensions?.polygon) return;
  const lights = session.equipment.find((e) => e.type === "eclairage");
  if (!lights) return;
  const existing = session.placements.filter((p) => p.type === "eclairage").length;
  const need = lights.qty - existing;
  if (need <= 0) return;
  const c = polygonCentroid(session.dimensions.polygon);
  const b = polygonBounds(session.dimensions.polygon);
  for (let i = 0; i < need; i++) {
    const ox = need === 1 ? 0 : ((i + 1) / (need + 1) - 0.5) * b.width * 0.5;
    const oy = need === 1 ? 0 : (i % 2 === 0 ? -1 : 1) * b.depth * 0.15;
    session.placements.push(createPoint("eclairage", c.x + ox, c.y + oy));
  }
}

function placeFromText(session, t, n, face) {
  if (!session.dimensions?.polygon || !session.arrival) return;
  const type = /va[\s-]*et[\s-]*vient/.test(t)
    ? "va-et-vient"
    : /inter(?:rupteur)?[\s/+-]*prise|inter-prise/.test(t)
      ? "inter-prise"
      : /double/.test(t)
        ? "prise-double"
        : /inter/.test(t)
          ? "interrupteur"
          : /lumiere|eclairage|spot/.test(t)
            ? "eclairage"
            : "prise-simple";
  if (isCeilingType(type)) {
    const c = polygonCentroid(session.dimensions.polygon);
    for (let i = 0; i < n; i++) session.placements.push(createPoint(type, c.x + i * 0.4, c.y));
    return;
  }
  const edges = polygonEdges(session.dimensions.polygon);
  let edgeIndex = 0;
  if (face && session.arrival.edgeIndex != null) edgeIndex = (session.arrival.edgeIndex + Math.floor(edges.length / 2)) % edges.length;
  for (let i = 0; i < n; i++) {
    const tt = (i + 1) / (n + 1);
    const pt = pointOnEdge(edges[edgeIndex], tt);
    session.placements.push(createPoint(type, pt.x, pt.y, { edgeIndex, t: tt }));
  }
}

/** Place remaining VEV / inter+prise / door-side prises next to door openings. */
function autoPlaceNearDoors(session) {
  const poly = session.dimensions?.polygon;
  const doors = (session.openings || []).filter((o) => o.kind === "door");
  if (!poly || doors.length < 1) return;
  const edges = polygonEdges(poly);

  const need = (type) => {
    const eq = session.equipment.find((e) => e.type === type);
    if (!eq) return 0;
    const have = session.placements.filter((p) => p.type === type).length;
    return Math.max(0, eq.qty - have);
  };

  const placeOnDoor = (type, door, sideSign) => {
    const edge = edges[door.edgeIndex];
    if (!edge) return false;
    const len = dist(edge.a, edge.b) || 1;
    const offset = Math.min(0.35, len * 0.12) / len;
    const t = Math.min(0.92, Math.max(0.08, (door.t || 0.5) + sideSign * offset));
    const pt = pointOnEdge(edge, t);
    session.placements.push(createPoint(type, pt.x, pt.y, {
      edgeIndex: door.edgeIndex,
      t,
      nearOpeningId: door.id,
    }));
    return true;
  };

  let vevLeft = need("va-et-vient");
  let interPriseLeft = need("inter-prise");
  let priseLeft = need("prise-simple");

  doors.forEach((door, i) => {
    if (vevLeft > 0) {
      if (placeOnDoor("va-et-vient", door, i % 2 === 0 ? -1 : 1)) vevLeft--;
    } else if (interPriseLeft > 0) {
      if (placeOnDoor("inter-prise", door, -1)) interPriseLeft--;
    }
    if (priseLeft > 0 && session.equipment.some((e) => e.type === "va-et-vient")) {
      // door-side prise paired with VEV
      if (placeOnDoor("prise-simple", door, i % 2 === 0 ? 1 : -1)) priseLeft--;
    }
  });
}


function floorLabel(level, floorsCount) {
  if (floorsCount <= 1) return "l'appartement";
  return FLOOR_NAMES[level] || `niveau ${level}`;
}

function makeRoomId() {
  return `r${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function emptyRoomState(type, name, floorId, floorName) {
  return {
    id: makeRoomId(),
    floorId,
    floorName,
    type,
    name,
    status: "pending", // pending | in_progress | done
    dimensions: null,
    equipment: [],
    placements: [],
    openings: [],
    arrival: null,
    placePlan: [],
    notes: [],
    // Floor-plan assembly (world coords)
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    attach: null, // { roomId, targetEdge, myEdge }
    worldPolygon: null,
  };
}

/** Persist working fields into rooms[] */
export function saveCurrentRoom(session) {
  if (!session.currentRoomId) return;
  const room = session.rooms.find((r) => r.id === session.currentRoomId);
  if (!room) return;
  room.dimensions = session.dimensions;
  room.equipment = session.equipment;
  room.placements = session.placements;
  room.openings = session.openings;
  room.arrival = session.arrival;
  room.placePlan = session.placePlan;
  room.notes = session.notes.filter((n) => true);
  room.type = session.roomType;
  room.name = session.roomName;
}

/** Load a room into the working session fields (UI uses these). */
export function loadRoom(session, roomId) {
  saveCurrentRoom(session);
  const room = session.rooms.find((r) => r.id === roomId);
  if (!room) return null;
  session.currentRoomId = room.id;
  session.roomType = room.type;
  session.roomName = room.name;
  session.dimensions = room.dimensions;
  session.equipment = room.equipment || [];
  session.placements = room.placements || [];
  session.openings = room.openings || [];
  session.arrival = room.arrival;
  session.placePlan = room.placePlan || [];
  session.pendingEquipment = null;
  session.guideIndex = 0;
  room.status = "in_progress";
  return room;
}

function nextPendingRoom(session) {
  return session.rooms.find((r) => r.status !== "done") || null;
}

function startRoomWorkflow(session, room) {
  loadRoom(session, room.id);
  session.step = "shape";
  return {
    text: `On s'occupe de : ${room.name}${room.floorName ? ` (${room.floorName})` : ""}.\nDécris la forme ou dessine le brouillon sur le croquis.`,
    choices: [
      { id: "shape:describe", label: "Je décris à l'écrit" },
      { id: "shape:draw", label: "Je dessine le brouillon" },
    ],
    showSketch: true, sketchMode: "idle", speak: true,
  };
}

function finishCurrentRoom(session) {
  saveCurrentRoom(session);
  const room = session.rooms.find((r) => r.id === session.currentRoomId);
  if (room) {
    applyRoomPlacement(session, room);
    room.status = "done";
  }
}

function buildRoomsFromFloors(session) {
  session.rooms = [];
  for (const floor of session.floors) {
    for (const type of floor.pendingRoomTypes || []) {
      const preset = ROOM_PRESETS.find((r) => r.id === type);
      const base = preset?.label || type;
      const countSame = session.rooms.filter((r) => r.type === type && r.floorId === floor.id).length;
      const finalName = countSame === 0 ? base : `${base} ${countSame + 1}`;
      session.rooms.push(emptyRoomState(type, finalName, floor.id, floor.name));
    }
  }
}

function roomChecklist(session) {
  if (!session.rooms?.length) return "";
  return session.rooms.map((r) => {
    const mark = r.status === "done" ? "✓" : (r.id === session.currentRoomId ? "→" : "·");
    return `${mark} ${r.name}${r.floorName ? ` (${r.floorName})` : ""}`;
  }).join("\n");
}

function floorRoomsChoices(session) {
  const floor = session.floors[session.floorSetupIndex];
  const pending = floor?.pendingRoomTypes || [];
  const counts = {};
  for (const id of pending) counts[id] = (counts[id] || 0) + 1;
  const addChoices = ROOM_PRESETS.map((r) => ({
    id: `roomadd:${r.id}`,
    label: counts[r.id] ? `${r.emoji || ""} ${r.label} (${counts[r.id]})` : `${r.emoji || ""} + ${r.label}`,
  }));
  const list = pending.length
    ? `Déjà : ${pending.map((id, i) => {
        const p = ROOM_PRESETS.find((r) => r.id === id);
        return p?.label || id;
      }).join(", ")}.`
    : "Aucune pièce encore.";
  return { list, choices: addChoices.concat([
    { id: "floor:clear", label: "↺ Vider la liste" },
    { id: "floor:done", label: "✔ Niveau OK → suivant", primary: true },
  ]) };
}


function roomLocalPolygon(room) {
  return room?.dimensions?.polygon || [];
}

/** Polygon in floor-plan world coordinates. */
export function roomWorldPolygon(room) {
  if (room?.worldPolygon?.length) return room.worldPolygon.map((p) => ({ x: p.x, y: p.y }));
  const poly = roomLocalPolygon(room);
  const ox = room?.offsetX || 0;
  const oy = room?.offsetY || 0;
  return poly.map((p) => ({ x: p.x + ox, y: p.y + oy }));
}

function edgeCardinalLabel(poly, edgeIndex) {
  if (!poly?.length) return `mur ${edgeIndex + 1}`;
  const a = poly[edgeIndex];
  const b = poly[(edgeIndex + 1) % poly.length];
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const c = polygonCentroid(poly);
  const dx = mx - c.x;
  const dy = my - c.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "Est" : "Ouest";
  return dy >= 0 ? "Sud" : "Nord";
}

/** Choices to glue the next room onto a finished room of the same floor. */
export function attachRoomChoices(session, nextRoom) {
  const done = (session.rooms || []).filter(
    (r) => r.status === "done" && r.floorId === nextRoom.floorId && r.dimensions?.polygon?.length >= 3
  );
  const choices = [];
  for (const room of done) {
    const poly = roomWorldPolygon(room);
    const n = poly.length;
    for (let i = 0; i < n; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % n];
      const len = round2(dist(a, b));
      const card = edgeCardinalLabel(poly, i);
      choices.push({
        id: `attach:${room.id}:${i}`,
        label: `${room.name} — mur ${card} (${len} m)`,
      });
    }
  }
  choices.push({ id: "attach:none", label: "Pièce séparée (pas collée)" });
  return choices;
}

function rotatePoint(p, origin, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  return { x: origin.x + dx * c - dy * s, y: origin.y + dx * s + dy * c };
}

/**
 * Place room in world coords: first on floor at origin, or glued to a target wall.
 * Shared wall: my edge is reversed onto the target edge so interiors don't overlap.
 */
export function applyRoomPlacement(session, room) {
  if (!room?.dimensions?.polygon?.length) return;
  const local = room.dimensions.polygon.map((p) => ({ x: p.x, y: p.y }));
  const sameFloorDone = (session.rooms || []).filter(
    (r) => r.id !== room.id && r.status === "done" && r.floorId === room.floorId && r.worldPolygon?.length
  );

  if (!room.attach || !sameFloorDone.length) {
    // First room on this floor (or isolated): keep local coords as world
    if (!sameFloorDone.length) {
      room.offsetX = 0;
      room.offsetY = 0;
      room.rotation = 0;
      room.worldPolygon = local;
      return;
    }
    // Isolated but other rooms exist: place to the right of bbox
    let maxX = 0;
    for (const r of sameFloorDone) {
      for (const p of r.worldPolygon) maxX = Math.max(maxX, p.x);
    }
    const gap = 0.5;
    const minX = Math.min(...local.map((p) => p.x));
    const ox = maxX + gap - minX;
    room.offsetX = ox;
    room.offsetY = 0;
    room.rotation = 0;
    room.worldPolygon = local.map((p) => ({ x: round2(p.x + ox), y: round2(p.y) }));
    return;
  }

  const target = session.rooms.find((r) => r.id === room.attach.roomId);
  if (!target?.worldPolygon?.length) {
    room.worldPolygon = local;
    return;
  }
  const tPoly = target.worldPolygon;
  const ti = room.attach.targetEdge ?? 0;
  const tA = tPoly[ti];
  const tB = tPoly[(ti + 1) % tPoly.length];
  const tLen = dist(tA, tB);
  // Auto-pick my wall closest in length to the target wall
  let mi = room.attach.myEdge;
  if (mi == null || mi < 0) {
    let best = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < local.length; i++) {
      const len = dist(local[i], local[(i + 1) % local.length]);
      const d = Math.abs(len - tLen);
      if (d < bestDiff) {
        bestDiff = d;
        best = i;
      }
    }
    mi = best;
    room.attach.myEdge = mi;
  }
  const mA = local[mi];
  const mB = local[(mi + 1) % local.length];
  // Align my edge onto target edge reversed (B→A)
  const tAng = Math.atan2(tA.y - tB.y, tA.x - tB.x);
  const mAng = Math.atan2(mB.y - mA.y, mB.x - mA.x);
  const rot = tAng - mAng;
  const mMid = { x: (mA.x + mB.x) / 2, y: (mA.y + mB.y) / 2 };
  const tMid = { x: (tA.x + tB.x) / 2, y: (tA.y + tB.y) / 2 };
  const rotated = local.map((p) => rotatePoint(p, mMid, rot));
  const rMid = rotatePoint(mMid, mMid, rot);
  const dx = tMid.x - rMid.x;
  const dy = tMid.y - rMid.y;
  room.rotation = rot;
  room.offsetX = dx;
  room.offsetY = dy;
  room.worldPolygon = rotated.map((p) => ({ x: round2(p.x + dx), y: round2(p.y + dy) }));
}

/** All rooms of a floor for floor-plan view. */
export function floorPlanRooms(session, floorId) {
  const fid = floorId || session.rooms.find((r) => r.id === session.currentRoomId)?.floorId;
  return (session.rooms || []).filter(
    (r) => (!fid || r.floorId === fid) && (r.worldPolygon?.length || r.dimensions?.polygon?.length)
  );
}


function afterRoomComplete(session) {
  finishCurrentRoom(session);
  const next = nextPendingRoom(session);
  if (next) {
    session.step = "room-ready";
    return {
      text: `« ${session.roomName} » est terminée.\n\nPièces :\n${roomChecklist(session)}\n\nOn passe à « ${next.name} » ? Tu pourras la coller contre un mur déjà dessiné.`,
      actions: [{ id: "room:next", label: `Continuer → ${next.name}` }],
      choices: [{ id: "room:next", label: `Oui, ${next.name}` }],
      showSketch: true,
      sketchMode: "floor",
      speak: true,
    };
  }
  session.step = "tech-murs";
  return {
    text: `Toutes les pièces sont faites.\n\n${roomChecklist(session)}\n\nQuestions techniques globales : les murs sont-ils à nu ?`,
    choices: [{ id: "yes", label: "Oui, murs à nu" }, { id: "no", label: "Non, finis / peints" }],
    speak: true,
  };
}

function beginGuidedPlacement(session) {
  if (!session.placePlan?.length) buildPlacePlan(session);
  syncPlacePlanCounts(session);
  session.step = "guided-place";
  const plan = session.placePlan || [];
  let idx = session.guideIndex || 0;
  while (idx < plan.length && (plan[idx].placed || 0) >= plan[idx].qty) idx += 1;
  session.guideIndex = idx;
  if (idx >= plan.length) return afterRoomComplete(session);
  const mark = plan[idx];
  const left = Math.max(0, mark.qty - (mark.placed || 0));
  return {
    text: `Place les ${left}× ${mark.label} (n° ${mark.mark}). Tape ${left} fois sur le plan.`,
    actions: [
      { id: "guide:skip", label: "Passer ce type" },
      { id: "guide:done", label: "Terminer cette pièce →" },
    ],
    showSketch: true,
    sketchMode: "points",
    placePlan: session.placePlan,
    guideMark: mark.mark,
    speak: true,
  };
}


export function robotReply(session, userText, choiceId) {
  const t = normStr(userText || "");

  switch (session.step) {
    case "scope": {
      if (choiceId?.startsWith("scope:")) session.scope = choiceId.slice(6);
      else if (/maison|tout/.test(t)) session.scope = "maison";
      else if (/appart|etage/.test(t)) session.scope = "appartement";
      else if (t) session.scope = "piece";
      if (!session.scope) {
        return { text: "C'est pour une pièce, un appartement, ou toute la maison ?", choices: SCOPE_OPTIONS, speak: true };
      }
      session.step = "project";
      const intro = session.scope === "maison"
        ? "OK, toute la maison — on va d'abord lister les étages et les pièces, puis croquis pièce par pièce."
        : session.scope === "appartement"
          ? "OK, un appartement — on liste les pièces, puis croquis une par une."
          : "Parfait, une seule pièce.";
      return { text: `${intro} Type de projet ?`, choices: PROJECT_TYPES, speak: true };
    }
    case "project": {
      const byId = PROJECT_TYPES.find((p) => p.id === choiceId);
      if (byId) session.projectType = byId.id;
      else if (t) {
        if (/renov/.test(t)) session.projectType = "renovation";
        else if (/neuf|construction/.test(t)) session.projectType = "neuf";
        else if (/extension|veranda/.test(t)) session.projectType = "extension";
        else if (/depann|ajout/.test(t)) session.projectType = "depannage";
        else session.projectType = "piece";
      }
      if (!session.projectType) return { text: "Type de projet ?", choices: PROJECT_TYPES, speak: true };
      session.step = "panel";
      return {
        text: "Faut-il changer ou ajouter des câbles d'arrivée depuis le compteur / tableau ?",
        choices: [
          { id: "arrival:keep", label: "Non, arrivée OK" },
          { id: "arrival:change", label: "Oui, reprendre l'arrivée" },
          { id: "arrival:new", label: "Nouvelle arrivée" },
        ],
        speak: true,
      };
    }
    case "panel": {
      if (choiceId === "arrival:change" || choiceId === "arrival:new" || /changer|reprendre|nouvelle?\s+arrivee|oui/.test(t)) {
        session.panel = { changeArrivalCable: true, note: choiceId || t };
      } else if (choiceId === "arrival:keep" || /non|ok|garde/.test(t)) {
        session.panel = { changeArrivalCable: false, note: "keep" };
      } else {
        return {
          text: "Câble d'arrivée ?",
          choices: [
            { id: "arrival:keep", label: "Non, arrivée OK" },
            { id: "arrival:change", label: "Oui, reprendre" },
            { id: "arrival:new", label: "Nouvelle arrivée" },
          ],
          speak: true,
        };
      }
      // Questionnaire multi-pièces
      if (session.scope === "maison") {
        session.step = "floors-count";
        return {
          text: "Combien de niveaux (étages) a la maison ?",
          choices: FLOOR_COUNT_OPTIONS,
          speak: true,
        };
      }
      if (session.scope === "appartement" || session.scope === "etage") {
        session.floorsCount = 1;
        session.floors = [{ id: "f0", name: "Appartement", level: 0, pendingRoomTypes: [] }];
        session.floorSetupIndex = 0;
        session.step = "floor-rooms";
        const fr = floorRoomsChoices(session);
        return {
          text: `Quelles pièces dans l'appartement ? Tape plusieurs fois « Chambre » s'il y en a plusieurs.\n${fr.list}`,
          choices: fr.choices,
          speak: true,
        };
      }
      // Une seule pièce
      session.step = "room";
      return { text: `Noté. Quelle pièce ?`, choices: ROOM_PRESETS, speak: true };
    }
    case "floors-count": {
      let n = null;
      if (choiceId?.startsWith("floors:")) n = parseInt(choiceId.split(":")[1], 10);
      else {
        const m = t.match(/(\d+)/);
        if (m) n = parseInt(m[1], 10);
        else if (/rdc|un\s+seul|seulement/.test(t)) n = 1;
      }
      if (!(n >= 1 && n <= 6)) {
        return { text: "Combien de niveaux ?", choices: FLOOR_COUNT_OPTIONS, speak: true };
      }
      session.floorsCount = n;
      session.floors = Array.from({ length: n }, (_, i) => ({
        id: `f${i}`,
        name: FLOOR_NAMES[i] || `Niveau ${i}`,
        level: i,
        pendingRoomTypes: [],
      }));
      session.floorSetupIndex = 0;
      session.step = "floor-rooms";
      const fr = floorRoomsChoices(session);
      return {
        text: `OK, ${n} niveau${n > 1 ? "x" : ""}. Quelles pièces au ${session.floors[0].name} ? (tu peux ajouter plusieurs chambres)`,
        choices: fr.choices,
        speak: true,
      };
    }
    case "floor-rooms": {
      const floor = session.floors[session.floorSetupIndex];
      if (!floor) {
        session.step = "room";
        return { text: "Quelle pièce ?", choices: ROOM_PRESETS, speak: true };
      }
      if (choiceId?.startsWith("roomadd:")) {
        const id = choiceId.slice(8);
        floor.pendingRoomTypes.push(id);
        const fr = floorRoomsChoices(session);
        return {
          text: `${floor.name} — ${fr.list}\nAjoute d'autres pièces ou « Niveau OK ».`,
          choices: fr.choices,
          speak: true,
        };
      }
      if (choiceId === "floor:clear") {
        floor.pendingRoomTypes = [];
        const fr = floorRoomsChoices(session);
        return { text: `${floor.name} vidé. Quelles pièces ?`, choices: fr.choices, speak: true };
      }
      if (choiceId === "floor:done" || /suivant|ok|termine|c.?est bon/.test(t)) {
        if (!floor.pendingRoomTypes.length) {
          const fr = floorRoomsChoices(session);
          return { text: `Ajoute au moins une pièce pour ${floor.name}.`, choices: fr.choices, speak: true };
        }
        if (session.floorSetupIndex < session.floors.length - 1) {
          session.floorSetupIndex += 1;
          const next = session.floors[session.floorSetupIndex];
          const fr = floorRoomsChoices(session);
          return {
            text: `Parfait. Maintenant les pièces du ${next.name} ?`,
            choices: fr.choices,
            speak: true,
          };
        }
        buildRoomsFromFloors(session);
        const first = nextPendingRoom(session);
        session.step = "room-ready";
        return {
          text: `Récap des pièces :\n${roomChecklist(session)}\n\nOn commence le croquis de « ${first.name} » ?`,
          actions: [{ id: "room:next", label: `Commencer → ${first.name}` }],
          choices: [{ id: "room:next", label: `Oui, ${first.name}` }],
          speak: true,
        };
      }
      const fr = floorRoomsChoices(session);
      return { text: `${floor.name} — ${fr.list}`, choices: fr.choices, speak: true };
    }
    case "room-ready": {
      if (choiceId === "room:next" || /oui|commenc|contin|ok/.test(t)) {
        const next = nextPendingRoom(session);
        if (!next) {
          session.step = "tech-murs";
          return { text: "Plus de pièce en attente. Les murs sont-ils à nu ?", choices: [{ id: "yes", label: "Oui" }, { id: "no", label: "Non" }], speak: true };
        }
        const attachChoices = attachRoomChoices(session, next);
        const canAttach = attachChoices.some((c) => c.id !== "attach:none");
        if (canAttach) {
          session.pendingAttachRoomId = next.id;
          session.step = "attach-room";
          return {
            text: `Où coller « ${next.name} » sur le plan de l'étage ?\nChoisis un mur déjà dessiné — les pièces s'emboîteront.`,
            choices: attachChoices,
            showSketch: true,
            sketchMode: "floor",
            speak: true,
          };
        }
        return startRoomWorkflow(session, next);
      }
      return {
        text: `Pièces :\n${roomChecklist(session)}\nOn continue ?`,
        actions: [{ id: "room:next", label: "Continuer →" }],
        showSketch: true,
        sketchMode: "floor",
        speak: true,
      };
    }
    case "attach-room": {
      const next = session.rooms.find((r) => r.id === session.pendingAttachRoomId) || nextPendingRoom(session);
      if (!next) {
        session.step = "tech-murs";
        return { text: "Plus de pièce en attente. Les murs sont-ils à nu ?", choices: [{ id: "yes", label: "Oui" }, { id: "no", label: "Non" }], speak: true };
      }
      if (choiceId === "attach:none" || /separe|seule|isole|pas\s*colle/.test(t)) {
        next.attach = null;
        session.pendingAttachRoomId = null;
        return startRoomWorkflow(session, next);
      }
      if (choiceId?.startsWith("attach:")) {
        const parts = choiceId.split(":");
        next.attach = { roomId: parts[1], targetEdge: parseInt(parts[2], 10), myEdge: null };
        session.pendingAttachRoomId = null;
        return startRoomWorkflow(session, next);
      }
      return {
        text: `Où coller « ${next.name} » ?`,
        choices: attachRoomChoices(session, next),
        showSketch: true,
        sketchMode: "floor",
        speak: true,
      };
    }
    case "room": {
      const byId = ROOM_PRESETS.find((p) => p.id === choiceId);
      const detected = byId?.id || detectRoomType(t);
      if (!detected && !t) return { text: "Quelle pièce ?", choices: ROOM_PRESETS, speak: true };
      session.roomType = detected || "autre";
      session.roomName = byId?.label || (detected ? ROOM_PRESETS.find((r) => r.id === detected)?.label : t) || "Pièce";
      // Single-room project → one entry in rooms[]
      session.floorsCount = 1;
      session.floors = [{ id: "f0", name: "Pièce", level: 0, pendingRoomTypes: [session.roomType] }];
      buildRoomsFromFloors(session);
      const room = session.rooms[0];
      room.name = session.roomName;
      return startRoomWorkflow(session, room);
    }
    case "shape": {
      if (choiceId === "shape:draw") {
        session.step = "draw";
        session.dimensions = {
          width: 0,
          depth: 0,
          height: 2.5,
          polygon: [],
          templatePolygon: null,
          edgeLengths: null,
          source: "drawn",
          chimney: null,
        };
        session._selectedEdge = null;
        return {
          text: "Dessine la pièce d’un seul trait (doigt sur l’écran), comme un plan rapide. Ensuite on met chaque cote et Volt redessine proprement. 2 doigts = zoom/déplacer. Bouton Effacer = recommencer.",
          actions: [
            { id: "draw:done", label: "Terminer le contour" },
            { id: "draw:clear", label: "Effacer / recommencer" },
          ],
          showSketch: true, sketchMode: "draw", speak: true,
        };
      }
      if (choiceId === "shape:describe") {
        return { text: "Décris : longueur × largeur × hauteur + décrochements (cheminée…).", speak: true };
      }
      const parsed = parseRoomDescription(userText || "");
      if (!parsed) {
        return {
          text: "Exemple : « 3 mètres sur 5, hauteur 3, cheminée 50 cm d'épaisseur sur 1,5 m au milieu du mur ».",
          choices: [{ id: "shape:describe", label: "Réessayer" }, { id: "shape:draw", label: "Dessiner" }],
          speak: true,
        };
      }
      session.dimensions = parsed;
      session.step = "equipment";
      const chim = parsed.chimney ? `\nCheminée/encoche intégrée : ${parsed.chimney.width} m × ${parsed.chimney.depth} m.` : "";
      return {
        text: `Pièce ${parsed.width} × ${parsed.depth} m, hauteur ${parsed.height} m.${chim}\nMatériel ? (les lumières iront au plafond)`,
        suggestions: equipmentSuggestions(session.roomType),
        showSketch: true, sketchMode: "review-shape", speak: true,
      };
    }
    case "draw": {
      if (choiceId === "draw:clear" || choiceId === "draw:undo") {
        if (session.dimensions) {
          session.dimensions.polygon = [];
          session.dimensions.templatePolygon = null;
          session.dimensions.edgeLengths = null;
        }
        return {
          text: "Dessin effacé. Redessine la forme d’un trait, puis Terminer.",
          actions: [
            { id: "draw:done", label: "Terminer le contour" },
            { id: "draw:clear", label: "Effacer / recommencer" },
          ],
          showSketch: true, sketchMode: "draw", speak: true,
        };
      }
      if (choiceId === "draw:done") {
        if (!session.dimensions?.polygon || session.dimensions.polygon.length < 3) {
          return {
            text: "Trace d’abord le contour d’un trait (forme fermée), puis Terminer.",
            actions: [
              { id: "draw:done", label: "Terminer le contour" },
              { id: "draw:clear", label: "Effacer / recommencer" },
            ],
            showSketch: true, sketchMode: "draw", speak: true,
          };
        }
        finalizeDrawnPolygon(session.dimensions);
        session.step = "measure-walls";
        session._selectedEdge = null;
        const corners = session.dimensions.polygon.length;
        return {
          text: `Contour nettoyé : ${corners} coins (murs presque droits fusionnés). Tape chaque mur pour sa cote, ou écris « 6 sur 6 avec cheminée sur le mur de droite ». Bouton « Simplifier murs droits » si un mur a encore trop de points.`,
          actions: geometryFixActions(),
          showSketch: true, sketchMode: "measure", speak: true,
        };
      }
      return {
        text: "Dessine d’un trait, puis Terminer. Effacer pour recommencer.",
        actions: [
          { id: "draw:done", label: "Terminer le contour" },
          { id: "draw:clear", label: "Effacer / recommencer" },
        ],
        showSketch: true, sketchMode: "draw", speak: true,
      };
    }
    case "measure-walls": {
      if (choiceId === "draw:restart") {
        session.step = "draw";
        session.dimensions = {
          width: 0,
          depth: 0,
          height: session.dimensions?.height || 2.5,
          polygon: [],
          templatePolygon: null,
          edgeLengths: null,
          source: "drawn",
          chimney: null,
        };
        session._selectedEdge = null;
        return {
          text: "OK, on recommence. Dessine la pièce d’un trait.",
          actions: [
            { id: "draw:done", label: "Terminer le contour" },
            { id: "draw:clear", label: "Effacer / recommencer" },
          ],
          showSketch: true, sketchMode: "draw", speak: true,
        };
      }
      if (choiceId === "walls:simplify" || wantsGeometryFix(t)) {
        const fix = applyGeometryFix(session, userText, t || "simplifier");
        if (fix) return fix;
      }
      if (choiceId === "walls:done") {
        if (session.dimensions?.polygon) {
          session.dimensions.polygon = cleanRoomPolygon(session.dimensions.polygon);
          finalizeDrawnPolygon(session.dimensions);
          const poly = session.dimensions.polygon;
          const n = poly.length;
          if (!session.dimensions.edgeLengths || session.dimensions.edgeLengths.length !== n) {
            session.dimensions.edgeLengths = poly.map(() => null);
          }
          // Fill any missing cote from current edge length so ortho rebuild can lock a clean rectangle
          for (let i = 0; i < n; i++) {
            if (!(session.dimensions.edgeLengths[i] > 0)) {
              session.dimensions.edgeLengths[i] = round2(dist(poly[i], poly[(i + 1) % n]));
            }
          }
          rebuildPolygonFromTemplate(session.dimensions);
        }
        session.step = "openings";
        session._selectedEdge = null;
        return {
          text: "Plan prêt (murs droits fusionnés). Place les portes et fenêtres sur les murs (outils Porte / Fenêtre), ou décris-les (ex. « 2 portes et 1 fenêtre »). Ensuite on pose le matériel électrique.",
          actions: [
            { id: "openings:done", label: "Ouvertures OK → Matériel" },
            { id: "openings:skip", label: "Passer (pas d'ouverture)" },
          ],
          choices: [
            { id: "tool:porte", label: "🚪 Porte" },
            { id: "tool:fenetre", label: "🪟 Fenêtre" },
            { id: "tool:baie", label: "🪟 Baie" },
          ],
          showSketch: true, sketchMode: "openings", speak: true,
        };
      }
      const n = parseFloat(String(userText || "").replace(",", "."));
      if (Number.isFinite(n) && n > 0 && session._selectedEdge != null && session.dimensions?.polygon) {
        setEdgeLength(session.dimensions, session._selectedEdge, n);
        const setCount = (session.dimensions.edgeLengths || []).filter((L) => L > 0).length;
        const total = session.dimensions.polygon.length;
        return {
          text: `Mur ${session._selectedEdge + 1} → ${n} m (${setCount}/${total} cotes). Autre mur ou Continuer. Si un mur droit a plusieurs points : « Simplifier murs droits ».`,
          actions: geometryFixActions(),
          showSketch: true, sketchMode: "measure", speak: true,
        };
      }
      return {
        text: "Tape un mur, puis envoie sa longueur (ex. 6). Un mur droit ne doit avoir qu’un segment — bouton « Simplifier murs droits » si besoin.",
        actions: geometryFixActions(),
        showSketch: true, sketchMode: "measure", speak: true,
      };
    }
    case "openings": {
      if (choiceId === "openings:skip") {
        session.step = "equipment";
        return {
          text: "OK. Qu'est-ce qu'on installe électriquement ?",
          suggestions: equipmentSuggestions(session.roomType),
          actions: [{ id: "next", label: "Continuer →" }],
          showSketch: true, sketchMode: "review-shape", speak: true,
        };
      }
      if (choiceId === "openings:done") {
        session.step = "equipment";
        const n = session.openings?.length || 0;
        return {
          text: n
            ? `${n} ouverture${n > 1 ? "s" : ""} sur le plan. Matériel électrique ? Tu peux aussi écrire « 2 portes avec va-et-vient et prise à côté ».`
            : "Aucune ouverture placée. Matériel ? (tu pourras encore ajouter portes/fenêtres plus tard sur le croquis)",
          suggestions: equipmentSuggestions(session.roomType),
          actions: [{ id: "next", label: "Continuer →" }],
          showSketch: true, sketchMode: "review-shape", speak: true,
        };
      }
      if (choiceId?.startsWith("tool:")) {
        return {
          text: `Outil ${choiceId.slice(5)} : tape un mur sur le croquis pour placer l'ouverture.`,
          actions: [
            { id: "openings:done", label: "Ouvertures OK → Matériel" },
            { id: "openings:skip", label: "Passer" },
          ],
          choices: [
            { id: "tool:porte", label: "🚪 Porte" },
            { id: "tool:fenetre", label: "🪟 Fenêtre" },
            { id: "tool:baie", label: "🪟 Baie" },
          ],
          showSketch: true, sketchMode: "openings", activeOpeningTool: choiceId.slice(5), speak: true,
        };
      }
      const parsedO = parseInstallText(userText || "");
      if (parsedO.openings.length) {
        for (const o of parsedO.openings) {
          autoPlaceOpenings(session, o.kind, o.qty, o.width);
        }
        for (const e of parsedO.equipment) addEquipment(session, e.type, e.qty);
        if (parsedO.notes.length) session.notes.push(...parsedO.notes);
        return {
          text: `Noté : ${parsedO.notes.join(", ") || "ouvertures"}. Déplace-les sur le croquis si besoin, puis continue.`,
          actions: [
            { id: "openings:done", label: "Ouvertures OK → Matériel" },
          ],
          choices: [
            { id: "tool:porte", label: "🚪 Porte" },
            { id: "tool:fenetre", label: "🪟 Fenêtre" },
          ],
          showSketch: true, sketchMode: "openings", speak: true,
        };
      }
      return {
        text: "Place une porte/fenêtre sur un mur, ou écris « 2 portes et 1 fenêtre ». Puis Ouvertures OK.",
        actions: [
          { id: "openings:done", label: "Ouvertures OK → Matériel" },
          { id: "openings:skip", label: "Passer" },
        ],
        choices: [
          { id: "tool:porte", label: "🚪 Porte" },
          { id: "tool:fenetre", label: "🪟 Fenêtre" },
          { id: "tool:baie", label: "🪟 Baie" },
        ],
        showSketch: true, sketchMode: "openings", speak: true,
      };
    }
    case "equipment": {
      if (choiceId === "walls:simplify" || wantsGeometryFix(t)) {
        const fix = applyGeometryFix(session, userText, t || "simplifier");
        if (fix) return fix;
      }
      if (choiceId?.startsWith("eq:")) {
        const type = choiceId.slice(3);
        addEquipment(session, type, 1);
        return {
          text: `Ajouté : ${FALLBACK_PRICES[type]?.name || type}. Autre chose, ou « C'est bon » pour confirmer le total.`,
          suggestions: equipmentSuggestions(session.roomType),
          actions: [{ id: "next", label: "C'est bon → confirmer" }],
          showSketch: true, sketchMode: "review-shape", speak: true,
        };
      }
      if (choiceId === "next" || /suivant|continuer|c.?est bon|ok|passe|confirme/.test(t)) {
        if (!session.equipment.length) {
          return { text: "Ajoute au moins un équipement (texte ou boutons).", suggestions: equipmentSuggestions(session.roomType), speak: true };
        }
        buildPlacePlan(session);
        session.step = "equipment-confirm";
        session.pendingEquipment = session.equipment.map((e) => ({ ...e }));
        const list = session.equipment.map((e) => `${e.qty}× ${e.label}`).join(", ");
        return {
          text: `Pour ${session.roomName} :\n${list}\n\nC'est bien ça ?`,
          choices: [
            { id: "equip:ok", label: "Oui, on place" },
            { id: "equip:edit", label: "Corriger" },
          ],
          showSketch: true, sketchMode: "review-shape", placePlan: session.placePlan, speak: true,
        };
      }
      const parsed = parseInstallText(userText || "");
      if (parsed.equipment.length || parsed.openings.length) {
        // Remplace le matériel (évite de cumuler si on reformule)
        setEquipmentFromParse(session, parsed.equipment);
        for (const o of parsed.openings) {
          const have = (session.openings || []).filter((x) => x.kind === o.kind).length;
          if (o.qty > have) autoPlaceOpenings(session, o.kind, o.qty - have, o.width);
        }
        if (parsed.notes.length) session.notes.push(...parsed.notes);
        buildPlacePlan(session);
        session.step = "equipment-confirm";
        session.pendingEquipment = session.equipment.map((e) => ({ ...e }));
        const list = session.equipment.map((e) => `${e.qty}× ${e.label}`).join(", ");
        const noteTxt = parsed.notes.length ? `\n(${parsed.notes.join(" · ")})` : "";
        return {
          text: `J'ai noté pour ${session.roomName} :\n${list || "—"}.${noteTxt}\n\nC'est bien ça ? (Sinon dis « corriger » et reformule.)`,
          choices: [
            { id: "equip:ok", label: "Oui, on place" },
            { id: "equip:edit", label: "Corriger" },
          ],
          showSketch: true, sketchMode: "review-shape", placePlan: session.placePlan, speak: true,
        };
      }
      return {
        text: `Matériel pour ${session.roomName} ? Ex. « 1 va-et-vient, 2x prises double, 3x prise simple ».`,
        suggestions: equipmentSuggestions(session.roomType),
        speak: true,
      };
    }
    case "equipment-confirm": {
      if (choiceId === "equip:edit" || /corrig|modifi|non|pas\s*bon|faux/.test(t)) {
        session.equipment = [];
        session.placements = [];
        session.placePlan = [];
        session.guideIndex = 0;
        session.step = "equipment";
        return {
          text: "OK, reformule le matériel (ex. « 1 va-et-vient, 2x prises double… »).",
          suggestions: equipmentSuggestions(session.roomType),
          showSketch: true, sketchMode: "review-shape", speak: true,
        };
      }
      if (choiceId === "equip:ok" || /oui|ok|c.?est\s*bon|place|valide|parfait/.test(t)) {
        buildPlacePlan(session);
        session.guideIndex = 0;
        session.step = "sketch-arrival";
        return {
          text: "Place l'arrivée électrique (tableau / départ) sur un mur. Ensuite on pose le matériel type par type.",
          showSketch: true, sketchMode: "arrival", placePlan: session.placePlan, speak: true,
        };
      }
      const list = session.equipment.map((e) => `${e.qty}× ${e.label}`).join(", ");
      return {
        text: `Confirme : ${list}\nOui = on place · Corriger = reformuler.`,
        choices: [
          { id: "equip:ok", label: "Oui, on place" },
          { id: "equip:edit", label: "Corriger" },
        ],
        speak: true,
      };
    }
    case "sketch-arrival": {
      if (!session.arrival) {
        return { text: "Clique un mur pour l'arrivée électrique.", showSketch: true, sketchMode: "arrival", speak: true };
      }
      // Parcours B : placement guidé type par type (pas d'auto-placement)
      return beginGuidedPlacement(session);
    }
    case "guided-place": {
      if (choiceId === "guide:skip" || /passer|skip/.test(t)) {
        session.guideIndex = (session.guideIndex || 0) + 1;
        return beginGuidedPlacement(session);
      }
      if (choiceId === "guide:done" || choiceId === "next" || /terminer|fini|c.?est\s*bon|continuer/.test(t)) {
        return afterRoomComplete(session);
      }
      if (choiceId === "guide:refresh" || choiceId === "guide:next-type") {
        return beginGuidedPlacement(session);
      }
      return beginGuidedPlacement(session);
    }
    case "sketch-points": {
      // Compat anciennes sessions → bascule en guidé
      if (choiceId === "next" || /suivant|continuer|c.?est bon|fini|ok/.test(t)) {
        return afterRoomComplete(session);
      }
      return beginGuidedPlacement(session);
    }
    case "tech-murs": {
      if (choiceId === "yes" || /oui|nu|a nu/.test(t)) session.tech.mursNu = true;
      else if (choiceId === "no" || /non|finis|peint/.test(t)) session.tech.mursNu = false;
      else return { text: "Murs à nu ?", choices: [{ id: "yes", label: "Oui" }, { id: "no", label: "Non" }], speak: true };
      session.step = "tech-saignees";
      return {
        text: "Saignées par défaut, ou point par point ?",
        choices: [
          { id: "yes", label: "Oui, saignées par défaut" },
          { id: "no", label: "Non / apparent" },
          { id: "per-point", label: "Point par point" },
        ],
        speak: true,
      };
    }
    case "tech-saignees": {
      if (choiceId === "yes" || /^oui/.test(t)) session.tech.saignees = true;
      else if (choiceId === "no" || /^non|apparent/.test(t)) session.tech.saignees = false;
      else if (choiceId === "per-point") session.tech.saignees = null;
      else return { text: "Saignées ?", choices: [{ id: "yes", label: "Oui" }, { id: "no", label: "Non" }, { id: "per-point", label: "Point par point" }], speak: true };
      session.step = "tech-path";
      return {
        text: "Chemin de câble ?",
        choices: [
          { id: "path:murs", label: "Via les murs" },
          { id: "path:plafond", label: "Via le plafond" },
          { id: "path:sol", label: "Via le sol" },
        ],
        speak: true,
      };
    }
    case "tech-path": {
      if (choiceId?.startsWith("path:")) session.tech.cablePath = choiceId.slice(5);
      else if (/plafond/.test(t)) session.tech.cablePath = "plafond";
      else if (/sol/.test(t)) session.tech.cablePath = "sol";
      else session.tech.cablePath = "murs";
      session.step = "quote";
      const quote = buildQuote(session);
      return {
        text: formatQuoteSpeech(session, quote), quote,
        showSketch: true, sketchMode: "floor",
        actions: [
          { id: "plan:view", label: "📐 Voir le plan" },
          { id: "plan:pdf", label: "📄 PDF du plan" },
          { id: "save", label: "💾 Enregistrer le devis" },
          { id: "restart", label: "↻ Recommencer" },
        ],
        speak: true,
      };
    }
    case "quote": {
      if (choiceId === "restart" || /recommenc/.test(t)) {
        const fresh = createSession();
        Object.keys(session).forEach((k) => delete session[k]);
        Object.assign(session, fresh);
        return { text: "Nouveau devis. Périmètre ?", choices: SCOPE_OPTIONS, speak: true };
      }
      if (choiceId === "save" || /enregistr|sauv/.test(t)) return { text: "Je prépare l'enregistrement…", save: true, speak: true };
      if (choiceId === "plan:view" || /voir\s+le\s+plan|consulter\s+le\s+plan|modifier\s+le\s+plan/.test(t)) {
        const quote = buildQuote(session);
        return {
          text: "Voici le plan de l'étage (toutes les pièces). Tu peux encore l'imprimer en PDF, ou enregistrer le devis.",
          quote,
          showSketch: true,
          sketchMode: "floor",
          actions: [
            { id: "plan:pdf", label: "📄 PDF du plan" },
            { id: "save", label: "💾 Enregistrer le devis" },
            { id: "restart", label: "↻ Recommencer" },
          ],
          speak: true,
        };
      }
      if (choiceId === "plan:pdf" || /pdf|imprim/.test(t)) {
        const quote = buildQuote(session);
        return {
          text: "J'ouvre le plan pour impression / PDF…",
          quote,
          showSketch: true,
          sketchMode: "floor",
          exportPlanPdf: true,
          actions: [
            { id: "plan:view", label: "📐 Voir le plan" },
            { id: "save", label: "💾 Enregistrer le devis" },
            { id: "restart", label: "↻ Recommencer" },
          ],
          speak: true,
        };
      }
      const quote = buildQuote(session);
      return {
        text: formatQuoteSpeech(session, quote), quote,
        showSketch: true, sketchMode: "floor",
        actions: [
          { id: "plan:view", label: "📐 Voir le plan" },
          { id: "plan:pdf", label: "📄 PDF du plan" },
          { id: "save", label: "💾 Enregistrer le devis" },
          { id: "restart", label: "↻ Recommencer" },
        ],
        speak: true,
      };
    }
    default:
      session.step = "scope";
      return { text: "Une pièce, un étage, ou toute la maison ?", choices: SCOPE_OPTIONS, speak: true };
  }
}

export function speakFrench(text, onStart, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return null; }
  window.speechSynthesis.cancel();
  const clean = String(text).replace(/[💾↻📄✏️🗑️←→]/gu, "").replace(/\n+/g, ". ").replace(/[~•]/g, "").slice(0, 560);
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "fr-FR"; u.rate = 1.05; u.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const fr = voices.find((v) => /fr(-|_|$)/i.test(v.lang) && /google|thomas|amelie|julie|marie/i.test(v.name))
    || voices.find((v) => /fr(-|_|$)/i.test(v.lang));
  if (fr) u.voice = fr;
  u.onstart = () => onStart?.();
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
  return u;
}
