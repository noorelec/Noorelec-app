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
  { id: "scope:etage", label: "Un étage", emoji: "🏠" },
  { id: "scope:maison", label: "Toute la maison", emoji: "🏡" },
];

export const ROOM_PRESETS = [
  { id: "cuisine", label: "Cuisine", emoji: "🍳" },
  { id: "salon", label: "Salon", emoji: "🛋️" },
  { id: "chambre", label: "Chambre", emoji: "🛏️" },
  { id: "sdb", label: "Salle de bain", emoji: "🚿" },
  { id: "bureau", label: "Bureau", emoji: "💻" },
  { id: "garage", label: "Garage", emoji: "🚗" },
  { id: "autre", label: "Autre", emoji: "📦" },
];

export const POINT_TOOLS = [
  { id: "prise-simple", label: "Prise", ceiling: false },
  { id: "prise-double", label: "Double", ceiling: false },
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
    const q = wordQty(t) || 2;
    addEq("va-et-vient", Math.max(q, 2));
    notes.push("va-et-vient");
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

  // --- classic equipment patterns (avoid double-counting portes / lights / vev kits) ---
  const patterns = [
    { re: /(\d+)\s*prises?\s+doubles?\b/g, type: "prise-double" },
    { re: /(\d+)\s*prises?\s+simples?\b/g, type: "prise-simple" },
    { re: /(\d+)\s*prises?\b(?!\s*(?:doubles?|simples?|four|plaque|taque|frigo|lave))/g, type: "prise-simple" },
    { re: /prise\s*(?:pour\s*)?(?:le\s*)?four|\bfour\b/g, type: "prise-four", qty: 1 },
    { re: /prise\s*(?:pour\s*)?(?:la\s*)?(?:taque|plaque)|\btaque\b|plaque\s*(?:de\s*)?cuisson/g, type: "prise-plaque", qty: 1 },
    { re: /lave[\s-]?vaisselle/g, type: "prise-lavevaisselle", qty: 1 },
    { re: /\bfrigo\b|refrigerateur/g, type: "prise-frigo", qty: 1 },
    { re: /(\d+)\s*interrupteurs?(?!\s*\/\s*prise)/g, type: "interrupteur" },
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
 * Build numbered place plan:
 * - wall gear → one number per unit (1, 2, 3…)
 * - lights of same type → one shared number, qty to place by multi-tap
 */
export function buildPlacePlan(session) {
  const plan = [];
  let mark = 1;
  for (const eq of session.equipment || []) {
    const isLightGroup =
      eq.type === "eclairage" ||
      eq.type === "eclairage-spot" ||
      eq.type === "eclairage-applique";
    if (isLightGroup) {
      plan.push({
        mark,
        type: eq.type,
        qty: eq.qty,
        placed: 0,
        label: eq.label,
        group: true,
      });
      mark += 1;
    } else {
      for (let i = 0; i < eq.qty; i++) {
        plan.push({
          mark,
          type: eq.type,
          qty: 1,
          placed: 0,
          label: eq.label,
          group: false,
        });
        mark += 1;
      }
    }
  }
  session.placePlan = plan;
  return plan;
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
  const sur = t.match(new RegExp(`${num}${unit}\\s*(?:sur|x|par)\\s*${num}${unit}`, "i"));
  if (sur) {
    width = parseFloat(sur[1]); depth = parseFloat(sur[2]);
    if (width > 30) width /= 100; if (depth > 30) depth /= 100;
  }
  const triple = t.match(new RegExp(`${num}\\s*[x×]\\s*${num}\\s*[x×]\\s*${num}`, "i"));
  if (triple) { width = parseFloat(triple[1]); depth = parseFloat(triple[2]); height = parseFloat(triple[3]); }
  const h = t.match(new RegExp(`hauteur\\s*(?:de\\s*)?${num}${unit}`, "i"))
    || t.match(new RegExp(`${num}${unit}\\s*(?:de\\s*)?haut`, "i"));
  if (h) {
    height = parseFloat(h[1]);
    if (height > 10) height /= 100;
  }
  let chimney = null;
  if (/cheminee|foyer|encoche|decrochement|renfoncement/.test(t)) {
    let cw = 1.5, cd = 0.5;
    const wMatch = t.match(new RegExp(`(?:large(?:ur)?|de\\s+large)\\s*(?:de\\s*)?${num}\\s*(cm|m)?`, "i"))
      || t.match(new RegExp(`${num}\\s*(cm|m)?\\s*(?:de\\s*)?large`, "i"));
    const dMatch = t.match(new RegExp(`(?:epaisseur|profondeur)\\s*(?:de\\s*)?${num}\\s*(cm|m)?`, "i"))
      || t.match(new RegExp(`${num}\\s*(cm|m)?\\s*(?:d'?|de\\s*)?(?:epaisseur|profondeur)`, "i"));
    if (wMatch) { cw = parseFloat(wMatch[1]); if ((wMatch[2] || "").includes("cm") || cw > 10) cw /= 100; }
    if (dMatch) { cd = parseFloat(dMatch[1]); if ((dMatch[2] || "").includes("cm") || cd > 5) cd /= 100; }
    let wall = "top";
    if (/mur\s+(?:de\s+)?(?:gauche|left)/.test(t)) wall = "left";
    else if (/mur\s+(?:de\s+)?(?:droite|right)/.test(t)) wall = "right";
    else if (/mur\s+(?:du\s+)?(?:bas|sud)/.test(t)) wall = "bottom";
    chimney = { width: cw, depth: cd, wall };
  }
  if (!width || !depth) return null;
  const polygon = chimney ? rectWithChimney(width, depth, chimney) : rectPolygon(width, depth);
  return { width, depth, height: height || 2.5, chimney, polygon, source: chimney ? "rect+cheminee" : "rect" };
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
    scope: null,
    projectType: null,
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

/** Convert a freehand stroke into a closed room polygon. */
export function strokeToPolygon(stroke) {
  if (!stroke || stroke.length < 4) return [];
  const bbox = polygonBounds(stroke);
  const span = Math.max(bbox.width, bbox.depth, 1);
  let poly = simplifyStroke(stroke, Math.max(0.08, span * 0.03));
  if (poly.length < 3) poly = simplifyStroke(stroke, Math.max(0.05, span * 0.02));
  if (poly.length < 3) return [];

  // Close shape if ends are near
  const first = poly[0];
  const last = poly[poly.length - 1];
  if (dist(first, last) < span * 0.12) poly.pop();
  // Drop near-duplicate consecutive points
  const cleaned = [];
  for (const p of poly) {
    if (!cleaned.length || dist(cleaned[cleaned.length - 1], p) > 0.05) cleaned.push(p);
  }
  if (cleaned.length >= 3 && dist(cleaned[0], cleaned[cleaned.length - 1]) < 0.05) cleaned.pop();
  return cleaned.length >= 3 ? cleaned.map((p) => ({ x: round2(p.x), y: round2(p.y) })) : [];
}

/** Freeze sketch angles as a template before measuring walls. */
export function finalizeDrawnPolygon(dimensions) {
  if (!dimensions?.polygon || dimensions.polygon.length < 3) return false;
  dimensions.templatePolygon = dimensions.polygon.map((p) => ({ x: p.x, y: p.y }));
  dimensions.edgeLengths = dimensions.polygon.map(() => null);
  const b = polygonBounds(dimensions.polygon);
  dimensions.width = round2(b.width);
  dimensions.depth = round2(b.depth);
  dimensions.source = "drawn";
  return true;
}

/**
 * Rebuild polygon from template edge directions + target lengths.
 * Preserves chimney notches / angles from the freehand sketch.
 */
export function rebuildPolygonFromTemplate(dimensions) {
  const template = dimensions.templatePolygon || dimensions.polygon;
  if (!template || template.length < 3) return;
  const n = template.length;
  const dirs = [];
  for (let i = 0; i < n; i++) {
    const a = template[i];
    const b = template[(i + 1) % n];
    const d = dist(a, b) || 1;
    dirs.push({ x: (b.x - a.x) / d, y: (b.y - a.y) / d });
  }
  const lens = [];
  for (let i = 0; i < n; i++) {
    const L = dimensions.edgeLengths?.[i];
    lens.push(L > 0 ? L : dist(template[i], template[(i + 1) % n]));
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
  const b = polygonBounds(out);
  dimensions.width = round2(b.width);
  dimensions.depth = round2(b.depth);
}

/** Set one wall length then rebuild the whole room (keeps sketch angles). */
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

export function buildQuote(session, settings = {}) {
  const tarif = settings.tarif ?? 50;
  const deplacement = settings.deplacement ?? 25;
  const tva = settings.tva ?? 0.06;
  const rebouchageM = settings.rebouchage ?? 18;
  const path = session.tech.cablePath || "murs";
  const poly = session.dimensions?.polygon;
  const articles = [];
  const cableMeters = {};
  let moMinutes = 0, materiel = 0, rebouchage = 0;

  const byType = {};
  for (const p of session.placements) {
    if (p.existing) continue;
    byType[p.type] = (byType[p.type] || 0) + 1;
  }
  for (const eq of session.equipment) {
    const placed = session.placements.filter((p) => p.type === eq.type && !p.existing).length;
    const missing = Math.max(0, eq.qty - placed);
    if (missing > 0) byType[eq.type] = (byType[eq.type] || 0) + missing;
  }

  for (const [type, qty] of Object.entries(byType)) {
    const meta = FALLBACK_PRICES[type];
    if (!meta || !qty) continue;
    const line = meta.price * qty;
    materiel += line;
    moMinutes += (meta.tempsBase || 20) * qty;
    articles.push({ ref: type.toUpperCase(), name: meta.name, qty, category: "appareillage", prixAchat: meta.price, materiel: line, tempsBase: meta.tempsBase || 20, mo: 0, rebouchage: 0, total: 0 });
  }

  let totalCableM = 0;
  if (session.arrival && poly) {
    for (const p of session.placements) {
      if (p.existing) continue;
      let len = 0;
      const H = session.dimensions.height || 2.5;
      const straight = Math.hypot(p.x - session.arrival.x, p.y - session.arrival.y);
      if (p.mode === "ceiling") {
        if (path === "plafond") len = (H - 0.3) + straight + 0.2;
        else if (path === "sol") len = 0.3 + straight + H;
        else if (p.edgeIndex != null && session.arrival.edgeIndex != null)
          len = edgePathLength(poly, session.arrival, { edgeIndex: p.edgeIndex, t: p.t || 0.5 }) + H * 0.5;
        else len = straight + H * 0.6;
      } else {
        if (path === "plafond") len = (H - 0.3) + straight + (H - 0.3);
        else if (path === "sol") len = 0.3 + straight + 0.3;
        else if (p.edgeIndex != null && session.arrival.edgeIndex != null)
          len = edgePathLength(poly, session.arrival, p) + 0.4;
        else len = straight + 0.4;
      }
      const ct = FALLBACK_PRICES[p.type]?.cable || "3G2.5";
      cableMeters[ct] = (cableMeters[ct] || 0) + len;
    }
  }

  for (const [ct, meters] of Object.entries(cableMeters)) {
    const m = Math.ceil(meters * 10) / 10;
    totalCableM += m;
    const meta = FALLBACK_PRICES[`cable-${ct}`] || { name: `Câble ${ct}`, price: 1.5 };
    const line = meta.price * m;
    materiel += line; moMinutes += m * 8;
    articles.push({ ref: ct, name: meta.name, qty: m, unit: "m", category: "cables", prixAchat: meta.price, materiel: line, tempsBase: 8, mo: 0, rebouchage: 0, total: 0 });
  }

  let saigneeM = 0, blochetCount = 0;
  for (const p of session.placements) {
    if (p.existing) continue;
    if (p.saignee === true || (p.saignee == null && session.tech.saignees === true)) {
      saigneeM += session.arrival ? Math.hypot(p.x - session.arrival.x, p.y - session.arrival.y) * 0.7 : 2;
    }
    if (p.blochet) blochetCount += 1;
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
  const neuves = session.placements.filter((p) => !p.existing).length;
  const exist = session.placements.filter((p) => p.existing).length;
  return (
    `Voici mon estimation pour ${session.roomName || "la pièce"} :\n\n` +
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

export function robotReply(session, userText, choiceId) {
  const t = normStr(userText || "");

  switch (session.step) {
    case "scope": {
      if (choiceId?.startsWith("scope:")) session.scope = choiceId.slice(6);
      else if (/maison|tout/.test(t)) session.scope = "maison";
      else if (/etage/.test(t)) session.scope = "etage";
      else if (t) session.scope = "piece";
      if (!session.scope) {
        return { text: "On commence comment ? Une pièce, un étage, ou toute la maison ?", choices: SCOPE_OPTIONS, speak: true };
      }
      session.step = "project";
      return {
        text: session.scope === "maison"
          ? "OK, toute la maison — on fera pièce par pièce. Type de projet ?"
          : session.scope === "etage"
            ? "OK, un étage. Type de projet ?"
            : "Parfait, une pièce. Type de projet ?",
        choices: PROJECT_TYPES, speak: true,
      };
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
      session.step = "room";
      return { text: `Noté. Projet « ${labelProject(session.projectType)} ». Quelle pièce en premier ?`, choices: ROOM_PRESETS, speak: true };
    }
    case "room": {
      const byId = ROOM_PRESETS.find((p) => p.id === choiceId);
      const detected = byId?.id || detectRoomType(t);
      if (!detected && !t) return { text: "Quelle pièce ?", choices: ROOM_PRESETS, speak: true };
      session.roomType = detected || "autre";
      session.roomName = byId?.label || (detected ? ROOM_PRESETS.find((r) => r.id === detected)?.label : t) || "Pièce";
      session.step = "shape";
      return {
        text: `Pour ${session.roomName.toLowerCase()} : décris la forme (ex. « 3 sur 5 hauteur 3 avec cheminée 50 cm d'épaisseur sur 1,5 m au milieu du mur ») OU dessine le brouillon sur le croquis.`,
        choices: [
          { id: "shape:describe", label: "Je décris à l'écrit" },
          { id: "shape:draw", label: "Je dessine le brouillon" },
        ],
        showSketch: true, sketchMode: "idle", speak: true,
      };
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
        return {
          text: "Contour noté. Tape chaque mur et envoie sa vraie longueur (ex. 4). La forme (rectangle + cheminée…) est conservée — Volt recalcule le plan propre à la fin.",
          actions: [
            { id: "walls:done", label: "Cotes OK → Continuer" },
            { id: "draw:restart", label: "Recommencer le dessin" },
          ],
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
      if (choiceId === "walls:done") {
        if (session.dimensions) rebuildPolygonFromTemplate(session.dimensions);
        session.step = "openings";
        session._selectedEdge = null;
        return {
          text: "Plan prêt. Place les portes et fenêtres sur les murs (outils Porte / Fenêtre), ou décris-les (ex. « 2 portes et 1 fenêtre »). Ensuite on pose le matériel électrique.",
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
          text: `Mur ${session._selectedEdge + 1} → ${n} m (${setCount}/${total} cotes). Autre mur ou Continuer.`,
          actions: [
            { id: "walls:done", label: "Cotes OK → Continuer" },
            { id: "draw:restart", label: "Recommencer le dessin" },
          ],
          showSketch: true, sketchMode: "measure", speak: true,
        };
      }
      return {
        text: "Tape un mur, puis envoie sa longueur (ex. 4.5).",
        actions: [
          { id: "walls:done", label: "Cotes OK → Continuer" },
          { id: "draw:restart", label: "Recommencer le dessin" },
        ],
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
      if (choiceId?.startsWith("eq:")) {
        const type = choiceId.slice(3);
        addEquipment(session, type, 1);
        if (type === "eclairage") autoPlaceCeilingLights(session);
        return {
          text: `Ajouté : ${FALLBACK_PRICES[type]?.name || type}. Autre chose ?`,
          suggestions: equipmentSuggestions(session.roomType),
          actions: [{ id: "next", label: "Continuer → place sur le plan" }],
          showSketch: true, sketchMode: "review-shape", speak: true,
        };
      }
      if (choiceId === "next" || /suivant|continuer|c.?est bon|ok|passe/.test(t)) {
        if (!session.equipment.length && !session.placements.length) {
          return { text: "Ajoute au moins un équipement.", suggestions: equipmentSuggestions(session.roomType), speak: true };
        }
        session.step = "sketch-arrival";
        return {
          text: "Place l'arrivée (tableau / départ) sur un mur. Ensuite on place prises, va-et-vient, etc. à côté des portes.",
          showSketch: true, sketchMode: "arrival", speak: true,
        };
      }
      const parsed = parseInstallText(userText || "");
      if (parsed.equipment.length || parsed.openings.length) {
        for (const e of parsed.equipment) addEquipment(session, e.type, e.qty);
        for (const o of parsed.openings) {
          if (!(session.openings || []).some((x) => x.kind === o.kind)) {
            autoPlaceOpenings(session, o.kind, o.qty, o.width);
          } else {
            // already have some — add the missing count
            const have = session.openings.filter((x) => x.kind === o.kind).length;
            if (o.qty > have) autoPlaceOpenings(session, o.kind, o.qty - have, o.width);
          }
        }
        if (parsed.notes.length) session.notes.push(...parsed.notes);
        autoPlaceCeilingLights(session);
        buildPlacePlan(session);
        const list = session.equipment.map((e) => `${e.qty}× ${e.label}`).join(", ");
        const openTxt = (session.openings || []).length
          ? `\nOuvertures sur le plan : ${(session.openings || []).map((o) => o.label).join(", ")}.`
          : "";
        const noteTxt = parsed.notes.length ? `\nCompris aussi : ${parsed.notes.join(" · ")}.` : "";
        const planTxt = formatPlacePlan(session);
        return {
          text: `Noté : ${list || "—"}.${noteTxt}${openTxt}\n\nNuméros pour le croquis :\n${planTxt}\n\nContinuer pour placer (choisis un n° puis tape sur le plan) ?`,
          suggestions: equipmentSuggestions(session.roomType),
          actions: [{ id: "next", label: "Continuer → place sur le plan" }],
          showSketch: true, sketchMode: "review-shape", placePlan: session.placePlan, speak: true,
        };
      }
      return {
        text: "Ex. « 3 prises doubles, 2 prises simples, 2 portes avec va-et-vient et prise à côté de chaque porte ».",
        suggestions: equipmentSuggestions(session.roomType),
        speak: true,
      };
    }
    case "sketch-arrival": {
      if (!session.arrival) {
        return { text: "Clique un mur pour l'arrivée électrique.", showSketch: true, sketchMode: "arrival", speak: true };
      }
      session.step = "sketch-points";
      autoPlaceNearDoors(session);
      if (!session.placePlan?.length) buildPlacePlan(session);
      return {
        text: "Choisis un n° dans la barre d'outils, puis tape sur le plan.\nLumières = même n° : tape autant de fois que la qty (alignement auto 2×2 / 3×3).\nOutils Porte/Fenêtre encore dispo. Glisser = déplacer · 🗑️ = supprimer.",
        actions: [{ id: "next", label: "Continuer →" }],
        showSketch: true, sketchMode: "points", placePlan: session.placePlan, speak: true,
      };
    }
    case "sketch-points": {
      if (choiceId === "next" || /suivant|continuer|c.?est bon|fini|ok/.test(t)) {
        if (!session.placements.length) {
          return { text: "Place au moins un point.", actions: [{ id: "next", label: "Continuer →" }], showSketch: true, sketchMode: "points", speak: true };
        }
        session.step = "tech-murs";
        return {
          text: "Les murs sont-ils à nu ?",
          choices: [{ id: "yes", label: "Oui, murs à nu" }, { id: "no", label: "Non, finis / peints" }],
          speak: true,
        };
      }
      const face = /(?:mur\s+)?(?:en\s+)?face|oppose/.test(t);
      const n = parseInt((t.match(/(\d+)/) || [])[1], 10) || 1;
      if (/prise|inter|lumiere|eclairage|point/.test(t) || face) {
        placeFromText(session, t, n, face);
        return { text: `Placé ${n} élément(s). Continue ou Continuer.`, actions: [{ id: "next", label: "Continuer →" }], showSketch: true, sketchMode: "points", speak: true };
      }
      return { text: "Place sur le croquis, ou « 2 prises sur le mur en face ».", actions: [{ id: "next", label: "Continuer →" }], showSketch: true, sketchMode: "points", speak: true };
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
        showSketch: true, sketchMode: "review",
        actions: [{ id: "save", label: "💾 Enregistrer le devis" }, { id: "restart", label: "↻ Recommencer" }],
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
      const quote = buildQuote(session);
      return {
        text: formatQuoteSpeech(session, quote), quote,
        showSketch: true, sketchMode: "review",
        actions: [{ id: "save", label: "💾 Enregistrer le devis" }, { id: "restart", label: "↻ Recommencer" }],
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
