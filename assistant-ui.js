/**
 * Volt UI — Firebase + croquis interactif + chat
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { checkElectricianAccess, paywallMessage } from "./devtech-access.js";
import {
  buildQuote,
  createPoint,
  createSession,
  isCeilingType,
  nearestEdgePoint,
  POINT_TOOLS,
  polygonBounds,
  polygonEdges,
  pointOnEdge,
  robotReply,
  speakFrench,
  strokeToPolygon,
} from "./assistant-core.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQ9YFHCYhKG-65rqJp31QEb68F9oY4HFk",
  authDomain: "devtech-20997.firebaseapp.com",
  projectId: "devtech-20997",
  storageBucket: "devtech-20997.firebasestorage.app",
  messagingSenderId: "95961701207",
  appId: "1:95961701207:web:25ac1e97f292c58797bc12",
  measurementId: "G-7S08YYT59J",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let session = createSession();
let sketchMode = "idle";
let placeType = POINT_TOOLS[0]?.id || "prise-simple";
let selectedPointId = null;
let voiceOn = true;
let settings = { tarif: 50, deplacement: 25, tva: 0.06, rebouchage: 18 };

let viewZoom = 1;
let viewPanX = 0;
let viewPanY = 0;
let dragPoint = null;
let sketchVisible = false;

/** Active pointer tracking for mobile-friendly pan / pinch / tap */
const pointers = new Map();
let gesture = null; // { type: 'pan'|'pinch'|'drag'|'tap', ... }
const TAP_MOVE_PX = 12;
let suppressClickUntil = 0;
let freehandStroke = null; // [{x,y}] world points while drawing
let lastTapTs = 0;
let lastTapMx = 0;
let lastTapMy = 0;

const $ = (id) => document.getElementById(id);
const els = {
  messages: $("messages"),
  choices: $("choices"),
  suggestions: $("suggestions"),
  actions: $("actions"),
  input: $("input"),
  composer: $("composer"),
  robot: $("robot"),
  mute: $("mute"),
  status: $("status"),
  canvas: $("canvas"),
  wrap: $("wrap"),
  meta: $("meta"),
  tools: $("tools"),
  legend: $("legend"),
  quote: $("quote"),
  toast: $("toast"),
  paywall: $("paywall"),
  shell: $("shell"),
  sketchBar: $("sketchBar"),
  props: $("props"),
  zoomIn: $("zoomIn"),
  zoomOut: $("zoomOut"),
  zoomReset: $("zoomReset"),
  btnDelete: $("btnDelete"),
  btnUndo: $("btnUndo"),
  btnClearDraw: $("btnClearDraw"),
  chkExisting: $("chkExisting"),
  chkSaignee: $("chkSaignee"),
  chkBlochet: $("chkBlochet"),
};
const ctx = els.canvas.getContext("2d");

// ─── Auth ───────────────────────────────────────────────────────────────────

onAuthStateChanged(auth, async (user) => {
  if (!user || !user.emailVerified) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  try {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const access = checkElectricianAccess(userSnap.exists() ? userSnap.data() : null);
    if (!access.allowed) {
      const msg = paywallMessage(access.reason);
      $("pw-title").textContent = msg.title;
      $("pw-text").textContent = msg.text;
      els.paywall.style.display = "flex";
      els.shell.style.display = "none";
      return;
    }
    const setSnap = await getDoc(doc(db, "settings", user.uid));
    if (setSnap.exists()) {
      const s = setSnap.data();
      settings.tarif = s.tarifs?.standard ?? s.tarifs?.tarif ?? 50;
      settings.deplacement = s.tarifs?.deplacement ?? 25;
      settings.rebouchage = s.tarifs?.rebouchage ?? 18;
    }
  } catch (err) {
    console.error(err);
  }
  boot();
});

function boot() {
  session = createSession();
  selectedPointId = null;
  resetView();
  els.messages.innerHTML = "";
  els.quote.classList.remove("on");
  clearChips();
  buildToolButtons();
  applyReply(robotReply(session, "", null));
}

function buildToolButtons() {
  els.tools.innerHTML = "";
  POINT_TOOLS.forEach((tool, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tool" + (i === 0 ? " active" : "");
    btn.dataset.type = tool.id;
    btn.textContent = tool.label;
    btn.title = tool.ceiling ? "Plafond" : "Mur";
    btn.addEventListener("click", () => {
      els.tools.querySelectorAll(".tool").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      placeType = tool.id;
    });
    els.tools.appendChild(btn);
  });
}

// ─── Chat ───────────────────────────────────────────────────────────────────

function addBubble(text, who) {
  const div = document.createElement("div");
  div.className = `bubble ${who}`;
  div.textContent = text;
  els.messages.appendChild(div);
  els.messages.scrollTop = els.messages.scrollHeight;
}

function clearChips() {
  els.choices.innerHTML = "";
  els.suggestions.innerHTML = "";
  els.actions.innerHTML = "";
}

function renderChips(container, items, primaryIds = []) {
  container.innerHTML = "";
  (items || []).forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    const primary = primaryIds.includes(item.id) || item.primary;
    btn.className = "chip" + (primary ? " primary" : "");
    btn.textContent = `${item.emoji ? item.emoji + " " : ""}${item.label || item.id}`;
    btn.addEventListener("click", () => handleUser(item.label || item.id, item.id));
    container.appendChild(btn);
  });
}

function applyReply(reply) {
  if (!reply) return;
  clearChips();
  if (reply.text) {
    addBubble(reply.text, "bot");
    session.messages.push({ role: "bot", text: reply.text });
  }
  if (reply.choices) renderChips(els.choices, reply.choices);
  if (reply.suggestions) renderChips(els.suggestions, reply.suggestions);
  if (reply.actions) renderChips(els.actions, reply.actions, ["save", "next", "draw:done", "walls:done", "draw:clear", "draw:restart"]);

  if (reply.showSketch) {
    const prevMode = sketchMode;
    sketchMode = reply.sketchMode || "idle";
    sketchVisible = true;
    if (
      (sketchMode === "draw" && prevMode !== "draw") ||
      (prevMode === "draw" && sketchMode !== "draw") ||
      sketchMode === "measure"
    ) {
      fitToView();
    } else {
      showSketchPanel();
      drawRoom();
    }
  }
  if (reply.quote) showQuote(reply.quote);
  if (reply.save) {
    saveDevis();
    return;
  }
  if (reply.speak && voiceOn && reply.text) speak(reply.text);
}

function speak(text) {
  els.robot.classList.add("speaking");
  els.status.textContent = "Volt parle…";
  speakFrench(
    text,
    () => els.robot.classList.add("speaking"),
    () => {
      els.robot.classList.remove("speaking");
      els.status.textContent = "En ligne";
    }
  );
}

async function handleUser(text, choiceId = null) {
  if (text) {
    addBubble(text, "user");
    session.messages.push({ role: "user", text });
  }
  clearChips();
  els.status.textContent = "Volt réfléchit…";
  await wait(140 + Math.random() * 120);
  const reply = robotReply(session, text || "", choiceId);
  applyReply(reply);
  updatePropsPanel();
  drawRoom();
}

els.composer.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = els.input.value.trim();
  if (!value) return;
  els.input.value = "";
  handleUser(value, null);
});

els.mute.addEventListener("click", () => {
  voiceOn = !voiceOn;
  els.mute.classList.toggle("off", !voiceOn);
  els.mute.textContent = voiceOn ? "🔊 Voix" : "🔇 Muet";
  if (!voiceOn && window.speechSynthesis) window.speechSynthesis.cancel();
  els.robot.classList.remove("speaking");
});

if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

// ─── View transform ─────────────────────────────────────────────────────────

function resetView() {
  viewZoom = 1;
  viewPanX = 0;
  viewPanY = 0;
}

function fitToView() {
  resetView();
  drawRoom();
}

function getPoly() {
  return session.dimensions?.polygon || [];
}

function computeBaseLayout() {
  const poly = getPoly();
  const W = els.canvas.width;
  const H = els.canvas.height;
  const pad = 52;
  // Stable world during freehand draw so adding corners doesn't jump the view
  if (sketchMode === "draw" || !poly.length) {
    const span = 10;
    const scale = Math.min((W - pad * 2) / span, (H - pad * 2) / span);
    return { minX: 0, minY: 0, maxX: span, maxY: span, scale, ox: pad, oy: pad, width: span, depth: span };
  }
  const b = polygonBounds(poly);
  const w = Math.max(b.width || 1, 0.5);
  const d = Math.max(b.depth || 1, 0.5);
  const scale = Math.min((W - pad * 2) / w, (H - pad * 2) / d);
  const roomW = w * scale;
  const roomH = d * scale;
  const ox = (W - roomW) / 2;
  const oy = (H - roomH) / 2;
  return { minX: b.minX, minY: b.minY, maxX: b.maxX, maxY: b.maxY, scale, ox, oy, width: w, depth: d, roomW, roomH };
}

function worldToScreen(x, y) {
  const L = computeBaseLayout();
  const s = L.scale * viewZoom;
  return {
    sx: viewPanX + L.ox + (x - L.minX) * s,
    sy: viewPanY + L.oy + (L.maxY - y) * s,
  };
}

function screenToWorld(sx, sy) {
  const L = computeBaseLayout();
  const s = L.scale * viewZoom;
  return {
    x: L.minX + (sx - viewPanX - L.ox) / s,
    y: L.maxY - (sy - viewPanY - L.oy) / s,
  };
}

function zoomAt(factor, cx, cy) {
  const before = screenToWorld(cx, cy);
  viewZoom = Math.max(0.35, Math.min(4, viewZoom * factor));
  const after = worldToScreen(before.x, before.y);
  viewPanX += cx - after.sx;
  viewPanY += cy - after.sy;
  drawRoom();
}

function canvasCoords(clientX, clientY) {
  const rect = els.canvas.getBoundingClientRect();
  const mx = ((clientX - rect.left) / rect.width) * els.canvas.width;
  const my = ((clientY - rect.top) / rect.height) * els.canvas.height;
  return { mx, my };
}

// ─── Geometry helpers ───────────────────────────────────────────────────────

function pointInPolygon(poly, px, py) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function findPointAt(wx, wy) {
  const hitPx = 18 / (computeBaseLayout().scale * viewZoom);
  let best = null;
  for (const p of session.placements) {
    const d = Math.hypot(p.x - wx, p.y - wy);
    if (d < hitPx && (!best || d < best.dist)) best = { point: p, dist: d };
  }
  return best?.point || null;
}

function pointAtPerimeter(edges, s, P) {
  let acc = 0;
  const pos = ((s % P) + P) % P;
  for (let ei = 0; ei < edges.length; ei++) {
    if (pos <= acc + edges[ei].length || ei === edges.length - 1) {
      const localT = (pos - acc) / (edges[ei].length || 1);
      return pointOnEdge(edges[ei], Math.min(1, Math.max(0, localT)));
    }
    acc += edges[ei].length;
  }
  return edges[0].a;
}

function perimeterPath(poly, fromRef, toRef) {
  const edges = polygonEdges(poly);
  const P = edges.reduce((s, e) => s + e.length, 0) || 1;
  function pos(ref) {
    let s = 0;
    for (let i = 0; i < ref.edgeIndex; i++) s += edges[i].length;
    s += edges[ref.edgeIndex].length * (ref.t || 0);
    return s;
  }
  const pFrom = pos(fromRef);
  const pTo = pos(toRef);
  const cw = (pTo - pFrom + P) % P;
  const ccw = (pFrom - pTo + P) % P;
  const forward = cw <= ccw;
  const dist = forward ? cw : ccw;
  const steps = Math.max(4, Math.ceil(dist * 6));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const s = forward ? pFrom + dist * t : pFrom - dist * t;
    pts.push(pointAtPerimeter(edges, s, P));
  }
  return pts;
}

function cableRoute(from, to, pathMode) {
  const poly = getPoly();
  if (!poly.length) return [from, to];
  if (pathMode !== "murs" || from.edgeIndex == null) {
    return [{ x: from.x, y: from.y }, { x: to.x, y: to.y }];
  }
  const toRef = to.edgeIndex != null
    ? { edgeIndex: to.edgeIndex, t: to.t || 0 }
    : nearestEdgePoint(poly, to.x, to.y);
  if (!toRef) return [{ x: from.x, y: from.y }, { x: to.x, y: to.y }];
  try {
    return perimeterPath(poly, from, toRef);
  } catch {
    return [{ x: from.x, y: from.y }, { x: to.x, y: to.y }];
  }
}

// ─── Sketch panel ───────────────────────────────────────────────────────────

function showSketchPanel() {
  els.wrap.classList.remove("empty");
  els.wrap.classList.add("has-sketch");
  els.canvas.classList.add("on");
  els.legend.classList.add("on");
  els.sketchBar.classList.add("on");

  const d = session.dimensions;
  const modeHints = {
    draw: "1 doigt = dessiner · 2 doigts = zoom/déplacer · Effacer = recommencer",
    measure: "Tape un mur → envoie la longueur · la forme est conservée",
    arrival: "Place l'arrivée sur un mur",
    points: "Place les points · glisser pour déplacer",
    "review-shape": "Aperçu de la pièce",
    review: "Revue finale",
    idle: "Croquis",
  };
  if (d?.polygon?.length >= 3) {
    els.meta.textContent = `${session.roomName || "Pièce"} · ${d.width || "—"} × ${d.depth || "—"} × ${d.height || 2.5} m · ${modeHints[sketchMode] || ""}`;
  } else {
    els.meta.textContent = `${session.roomName || "Pièce"} · ${modeHints[sketchMode] || "Croquis"}`;
  }

  const showTools = sketchMode === "points";
  const showDrawEdit = sketchMode === "draw" || sketchMode === "measure";
  els.tools.style.display = showTools ? "flex" : "none";
  els.btnUndo.classList.toggle("on", sketchMode === "draw");
  els.btnClearDraw.classList.toggle("on", showDrawEdit);
  els.btnDelete.classList.toggle("on", showTools && !!selectedPointId);
  if (els.btnClearDraw) els.btnClearDraw.textContent = sketchMode === "measure" ? "Recommencer" : "Effacer";
  updatePropsPanel();
}

function showQuote(quote) {
  els.quote.classList.add("on");
  els.quote.innerHTML =
    `Estimation Volt<strong>${quote.totaux.totalTTC.toFixed(2)} € TTC</strong>` +
    `Câble ~${quote.totalCableM} m · MO ~${quote.totaux.moHours} h · HT ${quote.totaux.totalHT.toFixed(2)} €`;
}

function updatePropsPanel() {
  const p = session.placements.find((x) => x.id === selectedPointId);
  const show = sketchMode === "points" && p;
  els.props.classList.toggle("on", show);
  els.btnDelete.classList.toggle("on", show);
  if (!p) return;
  els.chkExisting.checked = !!p.existing;
  els.chkSaignee.checked = p.saignee === true;
  els.chkBlochet.checked = !!p.blochet;
}

function selectedPoint() {
  return session.placements.find((p) => p.id === selectedPointId) || null;
}

els.chkExisting.addEventListener("change", () => {
  const p = selectedPoint();
  if (!p) return;
  p.existing = els.chkExisting.checked;
  drawRoom();
});

els.chkSaignee.addEventListener("change", () => {
  const p = selectedPoint();
  if (!p) return;
  p.saignee = els.chkSaignee.checked;
});

els.chkBlochet.addEventListener("change", () => {
  const p = selectedPoint();
  if (!p) return;
  p.blochet = els.chkBlochet.checked;
});

els.btnDelete.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  const p = selectedPoint();
  if (!p) return;
  session.placements = session.placements.filter((x) => x.id !== p.id);
  selectedPointId = null;
  updatePropsPanel();
  drawRoom();
  toast("Point supprimé");
});

function undoLastCorner() {
  freehandStroke = null;
  const poly = session.dimensions?.polygon;
  if (!poly?.length) {
    toast("Rien à annuler");
    return;
  }
  // Freehand = one whole shape: undo clears it
  session.dimensions.polygon = [];
  session.dimensions.templatePolygon = null;
  session.dimensions.edgeLengths = null;
  fitToView();
  toast("Dessin annulé");
}

function clearDrawing() {
  freehandStroke = null;
  if (sketchMode === "measure") {
    handleUser("Recommencer le dessin", "draw:restart");
    return;
  }
  if (session.dimensions) {
    session.dimensions.polygon = [];
    session.dimensions.templatePolygon = null;
    session.dimensions.edgeLengths = null;
  }
  fitToView();
  toast("Dessin effacé — tu peux redessiner");
}

els.btnUndo.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  undoLastCorner();
});
els.btnClearDraw.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  clearDrawing();
});

function bindZoomButton(el, fn) {
  if (!el) return;
  const run = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    fn();
  };
  el.addEventListener("pointerdown", (ev) => {
    if (ev.pointerType === "touch") run(ev);
  });
  el.addEventListener("click", run);
}

bindZoomButton(els.zoomIn, () => {
  zoomAt(1.35, els.canvas.width / 2, els.canvas.height / 2);
  toast("Zoom +");
});
bindZoomButton(els.zoomOut, () => {
  zoomAt(1 / 1.35, els.canvas.width / 2, els.canvas.height / 2);
  toast("Zoom −");
});
bindZoomButton(els.zoomReset, () => {
  if (sketchMode === "draw") {
    clearDrawing();
    return;
  }
  fitToView();
  toast("Vue recadrée");
});

// ─── Drawing ────────────────────────────────────────────────────────────────

function drawRoom() {
  if (!sketchVisible) return;
  showSketchPanel();

  const W = els.canvas.width;
  const H = els.canvas.height;
  const poly = getPoly();
  const d = session.dimensions;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0a1520";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(62,224,197,0.05)";
  ctx.lineWidth = 1;
  const gridStep = 24 * viewZoom;
  for (let i = -viewPanX % gridStep; i < W; i += gridStep) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, H);
    ctx.stroke();
  }
  for (let j = -viewPanY % gridStep; j < H; j += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(W, j);
    ctx.stroke();
  }

  if (poly.length >= 1) {
    ctx.beginPath();
    const first = worldToScreen(poly[0].x, poly[0].y);
    ctx.moveTo(first.sx, first.sy);
    for (let i = 1; i < poly.length; i++) {
      const p = worldToScreen(poly[i].x, poly[i].y);
      ctx.lineTo(p.sx, p.sy);
    }
    if (poly.length >= 3 && sketchMode !== "draw") {
      ctx.closePath();
      ctx.fillStyle = "rgba(62,224,197,0.07)";
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(62,224,197,0.7)";
    ctx.lineWidth = 3;
    ctx.stroke();

    if (sketchMode === "draw" && poly.length >= 3) {
      const last = worldToScreen(poly[poly.length - 1].x, poly[poly.length - 1].y);
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = "rgba(62,224,197,0.35)";
      ctx.beginPath();
      ctx.moveTo(last.sx, last.sy);
      ctx.lineTo(first.sx, first.sy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    poly.forEach((v, i) => {
      const c = worldToScreen(v.x, v.y);
      ctx.beginPath();
      ctx.fillStyle = i === 0 ? "#f5a623" : "#3ee0c5";
      ctx.arc(c.sx, c.sy, sketchMode === "draw" ? 9 : 6, 0, Math.PI * 2);
      ctx.fill();
      if (sketchMode === "draw") {
        ctx.fillStyle = "#04201a";
        ctx.font = "700 11px Outfit, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), c.sx, c.sy + 0.5);
      }
    });

    if (poly.length >= 2) {
      const edges = polygonEdges(poly);
      ctx.font = "600 12px Outfit, sans-serif";
      ctx.fillStyle = "rgba(139,163,181,0.95)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      edges.forEach((e) => {
        const mid = pointOnEdge(e, 0.5);
        const c = worldToScreen(mid.x, mid.y);
        const target = session.dimensions?.edgeLengths?.[e.i];
        const len = target > 0 ? target : e.length;
        if (len < 0.05) return;
        const label = target > 0 ? `${len.toFixed(2)} m ✓` : `${len.toFixed(2)} m`;
        if (session._selectedEdge === e.i) {
          const a = worldToScreen(e.a.x, e.a.y);
          const b = worldToScreen(e.b.x, e.b.y);
          ctx.save();
          ctx.strokeStyle = "#f5a623";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
          ctx.restore();
        }
        ctx.fillText(label, c.sx, c.sy - 10);
      });
    }
  }

  const path = session.tech?.cablePath || "murs";
  if (session.arrival && poly.length >= 3) {
    for (const p of session.placements) {
      if (p.existing) continue;
      drawCable(session.arrival, p, path);
    }
    const a = worldToScreen(session.arrival.x, session.arrival.y);
    drawArrival(a.sx, a.sy);
  }

  session.placements.forEach((p, i) => {
    const c = worldToScreen(p.x, p.y);
    const sel = p.id === selectedPointId;
    if (p.mode === "ceiling" || isCeilingType(p.type)) {
      drawCeilingLight(c.sx, c.sy, sel, p.existing);
    } else {
      drawWallPoint(c.sx, c.sy, sel, p.existing, i + 1);
    }
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(139,163,181,0.9)";
  ctx.font = "500 13px IBM Plex Sans, sans-serif";
  // Live freehand stroke
  if (freehandStroke && freehandStroke.length >= 2) {
    ctx.beginPath();
    const s0 = worldToScreen(freehandStroke[0].x, freehandStroke[0].y);
    ctx.moveTo(s0.sx, s0.sy);
    for (let i = 1; i < freehandStroke.length; i++) {
      const s = worldToScreen(freehandStroke[i].x, freehandStroke[i].y);
      ctx.lineTo(s.sx, s.sy);
    }
    ctx.strokeStyle = "#f5a623";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const hints = {
    draw: "Glisse = tracer la pièce · 2 doigts = zoom · Effacer = recommencer",
    measure: "Tape un mur · envoie la longueur · la forme reste correcte",
    arrival: "Tape un mur pour l'arrivée électrique",
    points: "Tape pour placer · glisse un point pour le bouger",
  };
  if (hints[sketchMode]) ctx.fillText(hints[sketchMode], W / 2, 22);
}

function drawCable(from, to, pathMode) {
  const route = cableRoute(from, to, pathMode);
  ctx.save();
  ctx.strokeStyle = "rgba(125,211,252,0.55)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  route.forEach((pt, i) => {
    const c = worldToScreen(pt.x, pt.y);
    if (i === 0) ctx.moveTo(c.sx, c.sy);
    else ctx.lineTo(c.sx, c.sy);
  });
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawArrival(sx, sy) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "#f5a623";
  ctx.shadowColor = "#f5a623";
  ctx.shadowBlur = 14;
  ctx.arc(sx, sy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#1a1205";
  ctx.font = "700 12px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("A", sx, sy + 0.5);
  ctx.restore();
}

function drawWallPoint(sx, sy, selected, existing, label) {
  ctx.save();
  const color = existing ? "rgba(139,163,181,0.7)" : "#3ee0c5";
  if (selected) {
    ctx.strokeStyle = "#f5a623";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, sy, 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = selected ? 14 : 8;
  ctx.arc(sx, sy, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#071018";
  ctx.font = "700 11px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(label), sx, sy + 0.5);
  ctx.restore();
}

function drawCeilingLight(sx, sy, selected, existing) {
  ctx.save();
  const color = existing ? "rgba(255,224,138,0.5)" : "#ffe08a";
  if (selected) {
    ctx.strokeStyle = "#f5a623";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 14, sy - 14, 28, 28);
  }
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillRect(sx - 9, sy - 9, 18, 18);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  const r = 10;
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(ang) * 4, sy + Math.sin(ang) * 4);
    ctx.lineTo(sx + Math.cos(ang) * r, sy + Math.sin(ang) * r);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Pointer handling ─────────────────────────────────────────────────────────

function handleCanvasClick(mx, my) {
  const { x, y } = screenToWorld(mx, my);
  const poly = getPoly();

  if (sketchMode === "draw") {
    // Drawing is freehand (drag). A tap alone does nothing.
    toast("Glisse le doigt pour tracer la pièce d’un trait");
    return;
  }

  if (!poly.length) return;

  if (sketchMode === "measure") {
    const hit = nearestEdgePoint(poly, x, y);
    if (hit) {
      session._selectedEdge = hit.edgeIndex;
      drawRoom();
      toast(`Mur ${hit.edgeIndex + 1} sélectionné — saisis la longueur`);
    }
    return;
  }

  if (sketchMode === "arrival") {
    const hit = nearestEdgePoint(poly, x, y);
    if (!hit) return;
    session.arrival = { x: hit.x, y: hit.y, edgeIndex: hit.edgeIndex, t: hit.t };
    drawRoom();
    handleUser("Arrivée placée", `wall:${hit.edgeIndex}`);
    return;
  }

  if (sketchMode === "points") {
    const existing = findPointAt(x, y);
    if (existing) {
      selectedPointId = existing.id;
      updatePropsPanel();
      drawRoom();
      return;
    }

    const ceilingTool = isCeilingType(placeType);
    if (ceilingTool && poly.length >= 3 && pointInPolygon(poly, x, y)) {
      const pt = createPoint(placeType, round3(x), round3(y));
      session.placements.push(pt);
      selectedPointId = pt.id;
      syncEquipmentQty(placeType);
      updatePropsPanel();
      drawRoom();
      toast(`${pt.label} placé au plafond`);
      return;
    }

    if (!ceilingTool) {
      const hit = nearestEdgePoint(poly, x, y);
      if (!hit) return;
      const pt = createPoint(placeType, hit.x, hit.y, { edgeIndex: hit.edgeIndex, t: hit.t });
      session.placements.push(pt);
      selectedPointId = pt.id;
      syncEquipmentQty(placeType);
      updatePropsPanel();
      drawRoom();
      toast(`${pt.label} placé`);
    }
  }
}

function syncEquipmentQty(type) {
  const eq = session.equipment.find((e) => e.type === type);
  const count = session.placements.filter((p) => p.type === type).length;
  if (eq) {
    if (count > eq.qty) eq.qty = count;
  } else {
    const meta = POINT_TOOLS.find((t) => t.id === type);
    session.equipment.push({ type, qty: 1, label: meta?.label || type });
  }
}

function movePoint(p, wx, wy) {
  const poly = getPoly();
  if (p.mode === "ceiling" || isCeilingType(p.type)) {
    if (poly.length >= 3 && pointInPolygon(poly, wx, wy)) {
      p.x = round3(wx);
      p.y = round3(wy);
      p.edgeIndex = null;
      p.t = null;
    }
  } else if (poly.length) {
    const hit = nearestEdgePoint(poly, wx, wy);
    if (hit) {
      p.x = hit.x;
      p.y = hit.y;
      p.edgeIndex = hit.edgeIndex;
      p.t = hit.t;
    }
  }
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

// ─── Pointer / touch (freehand draw + stable pinch/pan) ───────────────────────

function pointerList() {
  return [...pointers.values()];
}

function finishFreehand() {
  if (!freehandStroke || freehandStroke.length < 6) {
    freehandStroke = null;
    drawRoom();
    toast("Trait trop court — redessine la pièce d’un geste continu");
    return;
  }
  const poly = strokeToPolygon(freehandStroke);
  freehandStroke = null;
  if (!poly.length) {
    toast("Forme illisible — réessaie plus lentement, en fermant le contour");
    drawRoom();
    return;
  }
  if (!session.dimensions) {
    session.dimensions = {
      width: 0, depth: 0, height: 2.5,
      polygon: [], templatePolygon: null, edgeLengths: null,
      source: "drawn", chimney: null,
    };
  }
  session.dimensions.polygon = poly;
  session.dimensions.templatePolygon = null;
  session.dimensions.edgeLengths = null;
  fitToView();
  toast(`Contour capturé (${poly.length} coins) — appuie sur Terminer le contour`);
}

function onCanvasPointerDown(e) {
  if (!sketchVisible) return;
  if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 1) return;

  const { mx, my } = canvasCoords(e.clientX, e.clientY);
  pointers.set(e.pointerId, { id: e.pointerId, mx, my, cx: e.clientX, cy: e.clientY });
  try { els.canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }

  const pts = pointerList();

  // Two fingers: cancel freehand, prepare pinch (no move until armed)
  if (pts.length >= 2) {
    freehandStroke = null;
    dragPoint = null;
    const [a, b] = pts;
    gesture = {
      type: "pinch",
      dist: Math.hypot(b.mx - a.mx, b.my - a.my) || 1,
      midX: (a.mx + b.mx) / 2,
      midY: (a.my + b.my) / 2,
      armed: false,
    };
    els.canvas.classList.add("panning", "active");
    e.preventDefault();
    return;
  }

  if (e.pointerType === "mouse" && e.button === 1) {
    gesture = { type: "pan", startMx: mx, startMy: my, panX: viewPanX, panY: viewPanY, moved: true };
    els.canvas.classList.add("panning", "active");
    e.preventDefault();
    return;
  }

  if (sketchMode === "points") {
    const { x, y } = screenToWorld(mx, my);
    const hit = findPointAt(x, y);
    if (hit) {
      dragPoint = hit;
      selectedPointId = hit.id;
      updatePropsPanel();
      drawRoom();
      gesture = { type: "drag", moved: false };
      e.preventDefault();
      return;
    }
  }

  // Draw mode: one finger starts freehand stroke
  if (sketchMode === "draw") {
    const { x, y } = screenToWorld(mx, my);
    freehandStroke = [{ x, y }];
    gesture = {
      type: "draw",
      startMx: mx, startMy: my,
      startCx: e.clientX, startCy: e.clientY,
      moved: false,
    };
    drawRoom();
    e.preventDefault();
    return;
  }

  // Other modes: tap or pan
  gesture = {
    type: "tap",
    startMx: mx, startMy: my,
    startCx: e.clientX, startCy: e.clientY,
    panX: viewPanX, panY: viewPanY,
    moved: false,
  };
  e.preventDefault();
}

function onCanvasPointerMove(e) {
  if (!pointers.has(e.pointerId)) return;
  const { mx, my } = canvasCoords(e.clientX, e.clientY);
  pointers.set(e.pointerId, { id: e.pointerId, mx, my, cx: e.clientX, cy: e.clientY });
  const pts = pointerList();

  if (pts.length >= 2) {
    const [a, b] = pts;
    const dist = Math.hypot(b.mx - a.mx, b.my - a.my) || 1;
    const midX = (a.mx + b.mx) / 2;
    const midY = (a.my + b.my) / 2;
    if (!gesture || gesture.type !== "pinch") {
      gesture = { type: "pinch", dist, midX, midY, armed: false };
      e.preventDefault();
      return;
    }
    // Ignore finger-down jump: wait until real movement
    if (!gesture.armed) {
      const midJump = Math.hypot(midX - gesture.midX, midY - gesture.midY);
      const distJump = Math.abs(dist - gesture.dist);
      if (midJump > 16 || distJump > 14) {
        gesture.armed = true;
        gesture.dist = dist;
        gesture.midX = midX;
        gesture.midY = midY;
      }
      e.preventDefault();
      return;
    }
    const factor = dist / (gesture.dist || 1);
    viewPanX += midX - gesture.midX;
    viewPanY += midY - gesture.midY;
    zoomAt(factor, midX, midY);
    gesture.dist = dist;
    gesture.midX = midX;
    gesture.midY = midY;
    e.preventDefault();
    return;
  }

  if (gesture?.type === "draw" && freehandStroke) {
    const clientDist = Math.hypot(e.clientX - gesture.startCx, e.clientY - gesture.startCy);
    if (clientDist > 4) gesture.moved = true;
    const { x, y } = screenToWorld(mx, my);
    const last = freehandStroke[freehandStroke.length - 1];
    if (!last || Math.hypot(x - last.x, y - last.y) > 0.03) {
      freehandStroke.push({ x, y });
      drawRoom();
    }
    e.preventDefault();
    return;
  }

  if (gesture?.type === "drag" && dragPoint) {
    gesture.moved = true;
    const { x, y } = screenToWorld(mx, my);
    movePoint(dragPoint, x, y);
    drawRoom();
    e.preventDefault();
    return;
  }

  if (gesture?.type === "pan" || gesture?.type === "tap") {
    const dx = mx - gesture.startMx;
    const dy = my - gesture.startMy;
    const clientDist = Math.hypot(
      e.clientX - (gesture.startCx ?? e.clientX),
      e.clientY - (gesture.startCy ?? e.clientY)
    );
    if (gesture.type === "tap" && clientDist > TAP_MOVE_PX) {
      gesture.type = "pan";
      gesture.moved = true;
      els.canvas.classList.add("panning", "active");
    }
    if (gesture.type === "pan") {
      viewPanX = gesture.panX + dx;
      viewPanY = gesture.panY + dy;
      drawRoom();
    }
    e.preventDefault();
  }
}

function onCanvasPointerUp(e) {
  if (!pointers.has(e.pointerId)) return;
  const was = gesture;
  pointers.delete(e.pointerId);
  try { els.canvas.releasePointerCapture(e.pointerId); } catch { /* ignore */ }

  if (pointers.size >= 2) {
    const pts = pointerList();
    const [a, b] = pts;
    gesture = {
      type: "pinch",
      dist: Math.hypot(b.mx - a.mx, b.my - a.my) || 1,
      midX: (a.mx + b.mx) / 2,
      midY: (a.my + b.my) / 2,
      armed: false,
    };
    return;
  }

  // End of pinch: remaining finger must NOT keep panning (prevents drift)
  if (pointers.size === 1) {
    dragPoint = null;
    freehandStroke = null;
    const p = pointerList()[0];
    gesture = {
      type: "tap",
      startMx: p.mx, startMy: p.my,
      startCx: p.cx, startCy: p.cy,
      panX: viewPanX, panY: viewPanY,
      moved: false,
    };
    els.canvas.classList.remove("panning", "active");
    return;
  }

  els.canvas.classList.remove("panning", "active");

  if (was?.type === "draw") {
    if (was.moved) finishFreehand();
    else {
      freehandStroke = null;
      toast("Glisse le doigt pour tracer la pièce d’un trait");
      drawRoom();
    }
    gesture = null;
    suppressClickUntil = performance.now() + 450;
    return;
  }

  if (was?.type === "drag") {
    dragPoint = null;
    gesture = null;
    suppressClickUntil = performance.now() + 400;
    return;
  }

  if (was?.type === "pinch") {
    gesture = null;
    suppressClickUntil = performance.now() + 400;
    return;
  }

  if (was?.type === "tap" && !was.moved) {
    // Double-tap = zoom in (one-finger zoom)
    const now = performance.now();
    const near = Math.hypot(was.startMx - lastTapMx, was.startMy - lastTapMy) < 40;
    if (now - lastTapTs < 320 && near) {
      zoomAt(1.4, was.startMx, was.startMy);
      toast("Zoom + (double tap)");
      lastTapTs = 0;
    } else {
      lastTapTs = now;
      lastTapMx = was.startMx;
      lastTapMy = was.startMy;
      handleCanvasClick(was.startMx, was.startMy);
    }
    suppressClickUntil = performance.now() + 400;
  }

  dragPoint = null;
  gesture = null;
}

function onCanvasPointerCancel(e) {
  pointers.delete(e.pointerId);
  if (pointers.size === 0) {
    dragPoint = null;
    freehandStroke = null;
    gesture = null;
    els.canvas.classList.remove("panning", "active");
    drawRoom();
  }
}

els.canvas.addEventListener("pointerdown", onCanvasPointerDown);
els.canvas.addEventListener("pointermove", onCanvasPointerMove);
els.canvas.addEventListener("pointerup", onCanvasPointerUp);
els.canvas.addEventListener("pointercancel", onCanvasPointerCancel);
els.canvas.addEventListener("lostpointercapture", (e) => {
  if (pointers.has(e.pointerId)) onCanvasPointerCancel(e);
});

els.canvas.addEventListener("click", (e) => {
  if (performance.now() < suppressClickUntil) {
    e.preventDefault();
    e.stopPropagation();
  }
});

els.canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const { mx, my } = canvasCoords(e.clientX, e.clientY);
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  zoomAt(factor, mx, my);
}, { passive: false });

els.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

function resizeCanvas() {
  const rect = els.wrap.getBoundingClientRect();
  const size = Math.min(640, Math.max(280, rect.width - 24));
  if (els.canvas.width !== size) {
    els.canvas.width = size;
    els.canvas.height = size;
    drawRoom();
  }
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ─── Save ───────────────────────────────────────────────────────────────────

async function saveDevis() {
  if (!currentUser) return;
  const quote = buildQuote(session, settings);
  const payload = {
    userId: currentUser.uid,
    createdAt: new Date().toISOString(),
    status: "pending",
    source: "volt-assistant",
    client: {
      nom: session.client.nom || "Client (Volt)",
      telephone: session.client.telephone || "",
      email: session.client.email || "",
      adresse: session.client.adresse || "",
    },
    rooms: [
      {
        id: 1,
        name: session.roomName || "Pièce",
        articles: quote.articles,
        cabling: {
          cables: Object.entries(quote.cableMeters || {}).map(([type, length]) => ({
            type,
            length: Math.ceil(length * 10) / 10,
          })),
          internal: { cost: 0, length: 0 },
          tableau: { cost: 0, length: 0 },
        },
        sketch: {
          arrival: session.arrival,
          placements: session.placements,
          path: session.tech.cablePath,
          polygon: session.dimensions?.polygon,
        },
      },
    ],
    projectType: session.projectType,
    tech: { ...session.tech },
    dimensions: session.dimensions,
    totaux: {
      materielHT: quote.totaux.materiel,
      moHT: quote.totaux.mainOeuvre,
      servicesHT: 0,
      totalTTC: quote.totaux.totalTTC,
      totalHT: quote.totaux.totalHT,
      tva: quote.totaux.tva,
      rebouchage: quote.totaux.rebouchage,
      deplacement: quote.totaux.deplacement,
    },
    voltSummary: quote,
  };

  try {
    const ref = await addDoc(collection(db, "devis"), payload);
    toast("Devis enregistré ✓");
    addBubble(
      `Devis sauvegardé ! Réf. ${ref.id.slice(0, 8).toUpperCase()}. Tu le retrouves dans « Mes devis ».`,
      "bot"
    );
    if (voiceOn) speak("Devis sauvegardé. Tu le retrouves dans Mes devis.");
    clearChips();
    renderChips(
      els.actions,
      [
        { id: "goto", label: "Voir mes devis", primary: true },
        { id: "restart", label: "Nouveau devis" },
      ],
      ["goto"]
    );
    els.actions.querySelectorAll(".chip").forEach((btn) => {
      const label = btn.textContent || "";
      btn.onclick = () => {
        if (label.includes("Voir")) window.location.href = "mes-devis.html";
        else handleUser("Recommencer", "restart");
      };
    });
  } catch (err) {
    console.error(err);
    toast("Erreur enregistrement");
    addBubble("Oups, je n'ai pas pu enregistrer. Réessaie dans un instant.", "bot");
  }
}

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("on");
  setTimeout(() => els.toast.classList.remove("on"), 2200);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
