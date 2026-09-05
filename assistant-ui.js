/**
 * Volt UI — branche Firebase + croquis + chat
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
  createSession,
  robotReply,
  speakFrench,
  nearestWallPoint,
  FALLBACK_PRICES,
  PROJECT_TYPES,
  buildQuote,
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
let sketchMode = null; // 'arrival' | 'outlets' | 'review' | null
let placeType = "prise-simple";
let voiceOn = true;
let settings = { tarif: 50, deplacement: 25, tva: 0.06, rebouchage: 18 };

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
};
const ctx = els.canvas.getContext("2d");

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
  els.messages.innerHTML = "";
  clearChips();
  applyReply({
    text:
      "Salut ! Je suis Volt. On construit le devis ensemble — tu me parles comme sur le chantier, je gère le croquis et les métrés.\n\nC'est quoi comme projet ?",
    choices: PROJECT_TYPES,
    speak: true,
  });
}

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
  if (reply.actions) renderChips(els.actions, reply.actions, ["save", "next"]);

  if (reply.showSketch && session.dimensions) {
    sketchMode = reply.sketchMode || "outlets";
    showSketch();
    drawRoom();
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
  await wait(180 + Math.random() * 160);
  const reply = robotReply(session, text || "", choiceId);
  applyReply(reply);
  if (session.dimensions) drawRoom();
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

els.tools.querySelectorAll(".tool").forEach((btn) => {
  btn.addEventListener("click", () => {
    els.tools.querySelectorAll(".tool").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    placeType = btn.dataset.type;
  });
});

function showSketch() {
  els.wrap.classList.remove("empty");
  els.canvas.classList.add("on");
  els.legend.classList.add("on");
  const d = session.dimensions;
  els.meta.textContent = `${session.roomName || "Pièce"} · ${d.width} × ${d.depth} × ${d.height} m`;
  els.tools.classList.toggle("on", sketchMode === "outlets");
}

function showQuote(quote) {
  els.quote.classList.add("on");
  els.quote.innerHTML =
    `Estimation Volt<strong>${quote.totaux.totalTTC.toFixed(2)} € TTC</strong>` +
    `Câble ~${quote.totalCableM} m · MO ~${quote.totaux.moHours} h · HT ${quote.totaux.totalHT.toFixed(2)} €`;
}

function layout() {
  const d = session.dimensions;
  const pad = 56;
  const scale = Math.min(
    (els.canvas.width - pad * 2) / d.width,
    (els.canvas.height - pad * 2) / d.depth
  );
  const roomW = d.width * scale;
  const roomH = d.depth * scale;
  return {
    scale,
    ox: (els.canvas.width - roomW) / 2,
    oy: (els.canvas.height - roomH) / 2,
    roomW,
    roomH,
  };
}

function toCanvas(x, y, L) {
  return {
    cx: L.ox + x * L.scale,
    cy: L.oy + (L.roomH / L.scale - y) * L.scale,
  };
}

function toRoom(clientX, clientY) {
  const rect = els.canvas.getBoundingClientRect();
  const mx = ((clientX - rect.left) / rect.width) * els.canvas.width;
  const my = ((clientY - rect.top) / rect.height) * els.canvas.height;
  const L = layout();
  return {
    x: (mx - L.ox) / L.scale,
    y: L.roomH / L.scale - (my - L.oy) / L.scale,
  };
}

function drawRoom() {
  if (!session.dimensions) return;
  showSketch();
  const d = session.dimensions;
  const L = layout();
  const W = els.canvas.width;
  const H = els.canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0a1520";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(62,224,197,0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, H);
    ctx.stroke();
  }
  for (let j = 0; j < H; j += 24) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(W, j);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(62,224,197,0.06)";
  ctx.strokeStyle = "rgba(62,224,197,0.65)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(L.ox, L.oy, L.roomW, L.roomH);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#8ba3b5";
  ctx.font = "600 14px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${d.width} m`, L.ox + L.roomW / 2, L.oy + L.roomH + 28);
  ctx.save();
  ctx.translate(L.ox - 28, L.oy + L.roomH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${d.depth} m`, 0, 0);
  ctx.restore();

  const path = session.tech.cablePath || "murs";
  if (session.arrival) {
    for (const p of session.placements) drawCable(session.arrival, p, path, L);
    const a = toCanvas(session.arrival.x, session.arrival.y, L);
    drawMarker(a.cx, a.cy, "#f5a623", "A");
  }
  session.placements.forEach((p, i) => {
    const c = toCanvas(p.x, p.y, L);
    drawMarker(c.cx, c.cy, "#3ee0c5", String(i + 1));
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(139,163,181,0.9)";
  ctx.font = "500 13px IBM Plex Sans, sans-serif";
  if (sketchMode === "arrival") {
    ctx.fillText("Clique un mur pour placer l'arrivée électrique", W / 2, 28);
  } else if (sketchMode === "outlets") {
    ctx.fillText("Clique les murs pour placer les prises", W / 2, 28);
  }
}

function drawCable(from, to, pathMode, L) {
  const a = toCanvas(from.x, from.y, L);
  const b = toCanvas(to.x, to.y, L);
  ctx.save();
  ctx.strokeStyle = "rgba(125,211,252,0.55)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  if (pathMode === "murs" && from.wall !== to.wall) {
    const corners = [
      { x: 0, y: 0 },
      { x: session.dimensions.width, y: 0 },
      { x: session.dimensions.width, y: session.dimensions.depth },
      { x: 0, y: session.dimensions.depth },
    ];
    let best = corners[0];
    let bestScore = Infinity;
    for (const c of corners) {
      const score =
        Math.hypot(c.x - from.x, c.y - from.y) + Math.hypot(c.x - to.x, c.y - to.y);
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }
    const mid = toCanvas(best.x, best.y, L);
    ctx.moveTo(a.cx, a.cy);
    ctx.lineTo(mid.cx, mid.cy);
    ctx.lineTo(b.cx, b.cy);
  } else {
    ctx.moveTo(a.cx, a.cy);
    ctx.lineTo(b.cx, b.cy);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawMarker(cx, cy, color, label) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#071018";
  ctx.font = "700 11px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy + 0.5);
}

function onPointer(clientX, clientY) {
  if (!session.dimensions) return;
  if (sketchMode !== "arrival" && sketchMode !== "outlets") return;

  const { x, y } = toRoom(clientX, clientY);
  const snapped = nearestWallPoint(session.dimensions, x, y);

  if (sketchMode === "arrival") {
    session.arrival = {
      wall: snapped.wall,
      t: snapped.t,
      x: snapped.x,
      y: snapped.y,
    };
    drawRoom();
    handleUser(`Arrivée placée (${snapped.wall})`, `wall:${snapped.wall}`);
    return;
  }

  const meta = FALLBACK_PRICES[placeType];
  session.placements.push({
    id: `p${Date.now()}`,
    type: placeType,
    wall: snapped.wall,
    t: snapped.t,
    x: snapped.x,
    y: snapped.y,
    label: meta?.name || placeType,
  });
  const eq = session.equipment.find((e) => e.type === placeType);
  const count = session.placements.filter((p) => p.type === placeType).length;
  if (eq) {
    if (count > eq.qty) eq.qty = count;
  } else {
    session.equipment.push({
      type: placeType,
      qty: 1,
      label: meta?.name || placeType,
    });
  }
  drawRoom();
  toast(`${meta?.name || "Point"} placé · ${session.placements.length} au total`);
}

els.canvas.addEventListener("click", (e) => onPointer(e.clientX, e.clientY));
els.canvas.addEventListener(
  "touchend",
  (e) => {
    if (!e.changedTouches[0]) return;
    e.preventDefault();
    onPointer(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  },
  { passive: false }
);

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
