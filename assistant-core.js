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
  eclairage: { name: "Point lumineux (plafond)", price: 6, tempsBase: 35, cable: "3G1.5", ceiling: true },
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
  { id: "eclairage", label: "Lumière", ceiling: true },
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
  return !!(FALLBACK_PRICES[type]?.ceiling) || type === "eclairage";
}

export function parseEquipmentText(text) {
  const t = normStr(text);
  const items = [];
  const patterns = [
    { re: /(\d+)\s*prises?\s+doubles?\b/g, type: "prise-double" },
    { re: /(\d+)\s*prises?\s+simples?\b/g, type: "prise-simple" },
    { re: /(\d+)\s*prises?\b(?!\s*(?:doubles?|simples?|four|plaque|taque|frigo|lave))/g, type: "prise-simple" },
    { re: /prise\s*(?:pour\s*)?(?:le\s*)?four|\bfour\b/g, type: "prise-four", qty: 1 },
    { re: /prise\s*(?:pour\s*)?(?:la\s*)?(?:taque|plaque)|\btaque\b|plaque\s*(?:de\s*)?cuisson/g, type: "prise-plaque", qty: 1 },
    { re: /lave[\s-]?vaisselle/g, type: "prise-lavevaisselle", qty: 1 },
    { re: /\bfrigo\b|refrigerateur/g, type: "prise-frigo", qty: 1 },
    { re: /(\d+)\s*(?:points?\s*)?(?:lumineux|eclairages?|spots?|lumieres?)/g, type: "eclairage" },
    { re: /(\d+)\s*interrupteurs?/g, type: "interrupteur" },
    { re: /(\d+)\s*(?:prises?\s*)?rj\s*45|ethernet/g, type: "rj45" },
  ];
  for (const p of patterns) {
    const re = new RegExp(p.re.source, p.re.flags);
    let m;
    while ((m = re.exec(t)) !== null) {
      const qty = p.qty ?? (parseInt(m[1], 10) || 1);
      const ex = items.find((i) => i.type === p.type);
      if (ex) ex.qty += qty;
      else items.push({ type: p.type, qty, label: FALLBACK_PRICES[p.type]?.name || p.type });
    }
  }
  if (!items.length && /prise/.test(t)) {
    items.push({ type: "prise-simple", qty: 1, label: FALLBACK_PRICES["prise-simple"].name });
  }
  return items;
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
    scope: null,
    projectType: null,
    roomType: null,
    roomName: "",
    dimensions: null,
    equipment: [],
    placements: [],
    arrival: null,
    panel: null,
    tech: { mursNu: null, saignees: null, rewirage: null, tubes: null, apparent: null, cablePath: null },
    client: { nom: "", telephone: "", email: "", adresse: "" },
    messages: [],
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
  };
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
    ];
  }
  return [
    { id: "eq:prise-double", label: "+ Prise double" },
    { id: "eq:prise-simple", label: "+ Prise simple" },
    { id: "eq:interrupteur", label: "+ Inter" },
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
  const type = /double/.test(t) ? "prise-double" : /inter/.test(t) ? "interrupteur" : /lumiere|eclairage|spot/.test(t) ? "eclairage" : "prise-simple";
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
          // Prefer already entered lengths when still matching edge count
          rebuildPolygonFromTemplate(session.dimensions);
        }
        session.step = "equipment";
        session._selectedEdge = null;
        return {
          text: "Plan redessiné avec tes cotes (murs droits fusionnés). Qu'est-ce qu'on installe ?",
          suggestions: equipmentSuggestions(session.roomType),
          showSketch: true, sketchMode: "review-shape", speak: true,
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
    case "equipment": {
      if (choiceId === "walls:simplify" || wantsGeometryFix(t)) {
        const fix = applyGeometryFix(session, userText, t || "simplifier");
        if (fix) return fix;
      }
      if (choiceId?.startsWith("eq:")) {
        const type = choiceId.slice(3);
        const ex = session.equipment.find((e) => e.type === type);
        if (ex) ex.qty += 1;
        else session.equipment.push({ type, qty: 1, label: FALLBACK_PRICES[type]?.name || type });
        if (type === "eclairage") autoPlaceCeilingLights(session);
        return {
          text: `Ajouté : ${FALLBACK_PRICES[type]?.name || type}. Autre chose ?`,
          suggestions: equipmentSuggestions(session.roomType),
          actions: [{ id: "next", label: "Continuer →" }],
          showSketch: true, sketchMode: "review-shape", speak: true,
        };
      }
      if (choiceId === "next" || /suivant|continuer|c.?est bon|ok|passe/.test(t)) {
        if (!session.equipment.length && !session.placements.length) {
          return { text: "Ajoute au moins un équipement.", suggestions: equipmentSuggestions(session.roomType), speak: true };
        }
        session.step = "sketch-arrival";
        return {
          text: "Place l'arrivée (tableau / départ) sur un mur. Zoom : molette ou pincement.",
          showSketch: true, sketchMode: "arrival", speak: true,
        };
      }
      const parsed = parseEquipmentText(t);
      if (parsed.length) {
        for (const p of parsed) {
          const ex = session.equipment.find((e) => e.type === p.type);
          if (ex) ex.qty += p.qty; else session.equipment.push(p);
        }
        autoPlaceCeilingLights(session);
        const list = session.equipment.map((e) => `${e.qty}× ${e.label}`).join(", ");
        return {
          text: `Noté : ${list}. Lumières au plafond. Continuer ?`,
          suggestions: equipmentSuggestions(session.roomType),
          actions: [{ id: "next", label: "Continuer →" }],
          showSketch: true, sketchMode: "review-shape", speak: true,
        };
      }
      return { text: "Ex. « 4 prises doubles, une prise four, 3 lumières ».", suggestions: equipmentSuggestions(session.roomType), speak: true };
    }
    case "sketch-arrival": {
      if (!session.arrival) {
        return { text: "Clique un mur pour l'arrivée électrique.", showSketch: true, sketchMode: "arrival", speak: true };
      }
      session.step = "sketch-points";
      return {
        text: "Place prises/inters sur les murs. Lumière = plafond.\nGlisser = déplacer · sélection + Supprimer · clic = existant / saignée / blochet.",
        actions: [{ id: "next", label: "Continuer →" }],
        showSketch: true, sketchMode: "points", speak: true,
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
