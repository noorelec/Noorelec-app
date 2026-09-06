import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { checkElectricianAccess, paywallMessage } from "./devtech-access.js";

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

const $ = (id) => document.getElementById(id);

function setStatus(msg) {
  const el = $("status");
  if (el) el.textContent = msg || "";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function roomLabel(room) {
  return String(room?.name || room?.label || "Pièce").trim() || "Pièce";
}

function normalizePlan(raw, devis) {
  const plan = raw && typeof raw === "object" ? { ...raw } : {};
  if (!Array.isArray(plan.rooms) || !plan.rooms.length) {
    const rooms = Array.isArray(devis?.rooms) ? devis.rooms : [];
    plan.rooms = rooms
      .map((r) => {
        const poly = r.worldPolygon || r.polygon || r.sketch?.polygon || null;
        if (!Array.isArray(poly) || poly.length < 3) return null;
        return {
          name: roomLabel(r),
          worldPolygon: poly.map((p) => ({ x: Number(p.x), y: Number(p.y) })),
        };
      })
      .filter(Boolean);
  } else {
    plan.rooms = plan.rooms
      .map((r) => ({
        ...r,
        name: roomLabel(r),
        worldPolygon: (r.worldPolygon || r.polygon || []).map((p) => ({
          x: Number(p.x),
          y: Number(p.y),
        })),
      }))
      .filter((r) => r.worldPolygon?.length >= 3);
  }
  if (!Array.isArray(plan.symbols)) plan.symbols = [];
  const client = devis?.client || {};
  if (!plan.cartouche || typeof plan.cartouche !== "object") {
    plan.cartouche = {
      client: client.nom || devis?.clientName || "",
      address: client.adresse || "",
      ref: devis?.ref || devis?.id || "",
      scaleMPerCm: 1,
      date: todayISO(),
      notes: "",
    };
  }
  if (!plan.cartouche.scaleMPerCm) plan.cartouche.scaleMPerCm = 1;
  if (!plan.cartouche.date) plan.cartouche.date = todayISO();
  return plan;
}

function boundsOfRooms(rooms) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const room of rooms || []) {
    for (const p of room.worldPolygon || []) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 10, maxY: 10 };
  return { minX, minY, maxX, maxY };
}

function makeView(canvas, rooms) {
  const w = canvas.width;
  const h = canvas.height;
  const b = boundsOfRooms(rooms);
  const padX = (28 / 210) * w;
  const padY = (28 / 297) * h;
  const bw = Math.max(0.5, b.maxX - b.minX);
  const bh = Math.max(0.5, b.maxY - b.minY);
  const usableW = w - padX * 2;
  const usableH = h - padY * 2 - 90;
  const scale = Math.min(usableW / bw, usableH / bh);
  const ox = padX + (usableW - bw * scale) / 2 - b.minX * scale;
  const oy = padY + 70 + (usableH - bh * scale) / 2 - b.minY * scale;
  return {
    toScreen(p) { return { x: ox + p.x * scale, y: oy + p.y * scale }; },
    toWorld(p) { return { x: (p.x - ox) / scale, y: (p.y - oy) / scale }; },
  };
}

function drawCartouche(ctx, canvas, cartouche) {
  const w = canvas.width;
  ctx.save();
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, w, 64);
  ctx.strokeStyle = "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(24, 64);
  ctx.lineTo(w - 24, 64);
  ctx.stroke();
  ctx.fillStyle = "#0f2744";
  ctx.font = "700 22px Georgia, serif";
  ctx.fillText("VOLT · Plan d’installation", 28, 28);
  ctx.font = "500 14px Segoe UI, sans-serif";
  ctx.fillStyle = "#334155";
  const line1 = [
    cartouche.client ? `Client : ${cartouche.client}` : null,
    cartouche.ref ? `Réf. ${cartouche.ref}` : null,
    cartouche.date || null,
  ].filter(Boolean).join("  ·  ");
  ctx.fillText(line1 || "Cartouche à compléter", 28, 50);
  if (cartouche.address) {
    ctx.font = "400 12px Segoe UI, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(String(cartouche.address).slice(0, 90), w * 0.42, 28);
  }
  ctx.font = "600 12px Segoe UI, sans-serif";
  ctx.fillStyle = "#0f2744";
  ctx.fillText(`Échelle 1 cm = ${Number(cartouche.scaleMPerCm || 1)} m`, w - 220, 50);
  ctx.restore();
}

function drawRoom(ctx, view, room) {
  const poly = room.worldPolygon || [];
  if (poly.length < 3) return;
  const pts = poly.map((p) => view.toScreen(p));
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = "rgba(13, 148, 136, 0.08)";
  ctx.fill();
  ctx.strokeStyle = "#0d9488";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  ctx.fillStyle = "#0f2744";
  ctx.font = "600 16px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(roomLabel(room), cx, cy);
  ctx.restore();
}

const SYMBOL_META = {
  prise: { label: "Prise", color: "#0d9488", glyph: "P" },
  interrupteur: { label: "Interrupteur", color: "#ca8a04", glyph: "I" },
  luminaire: { label: "Luminaire", color: "#2563eb", glyph: "L" },
  tableau: { label: "Tableau", color: "#7c3aed", glyph: "T" },
  arrivee: { label: "Arrivée", color: "#ea580c", glyph: "A" },
  annotation: { label: "Texte", color: "#334155", glyph: "…" },
};

function drawSymbol(ctx, view, sym, selected) {
  const s = view.toScreen(sym);
  const meta = SYMBOL_META[sym.type] || { label: sym.type, color: "#64748b", glyph: "?" };
  ctx.save();
  if (sym.type === "annotation") {
    ctx.fillStyle = meta.color;
    ctx.font = "500 14px Segoe UI, sans-serif";
    ctx.fillText(sym.text || "Note", s.x, s.y);
  } else {
    ctx.beginPath();
    ctx.arc(s.x, s.y, selected ? 14 : 11, 0, Math.PI * 2);
    ctx.fillStyle = meta.color;
    ctx.fill();
    ctx.strokeStyle = selected ? "#fbbf24" : "#fff";
    ctx.lineWidth = selected ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "700 11px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(meta.glyph, s.x, s.y + 0.5);
  }
  ctx.restore();
}

function hitSymbol(symbols, world, tol = 0.35) {
  let best = -1, bestD = tol;
  symbols.forEach((s, i) => {
    const d = Math.hypot(s.x - world.x, s.y - world.y);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

async function main() {
  const canvas = $("atelier-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let user = null;
  let devisId = new URLSearchParams(location.search).get("devis") || "";
  let plan = normalizePlan(null, null);
  let tool = "select";
  let selected = -1;
  let view = makeView(canvas, []);

  function readCartoucheFromForm() {
    plan.cartouche = {
      client: $("f-client")?.value || "",
      address: $("f-addr")?.value || "",
      ref: $("f-ref")?.value || "",
      scaleMPerCm: Number($("f-scale")?.value) || 1,
      date: $("f-date")?.value || todayISO(),
      notes: $("f-notes")?.value || "",
    };
  }

  function writeCartoucheToForm() {
    const c = plan.cartouche || {};
    if ($("f-client")) $("f-client").value = c.client || "";
    if ($("f-addr")) $("f-addr").value = c.address || "";
    if ($("f-ref")) $("f-ref").value = c.ref || "";
    if ($("f-scale")) $("f-scale").value = String(c.scaleMPerCm || 1);
    if ($("f-date")) $("f-date").value = c.date || todayISO();
    if ($("f-notes")) $("f-notes").value = c.notes || "";
  }

  function renderSymbolList() {
    const ul = $("symbol-list");
    if (!ul) return;
    ul.innerHTML = "";
    (plan.symbols || []).forEach((s, i) => {
      const meta = SYMBOL_META[s.type] || { label: s.type };
      const li = document.createElement("li");
      li.innerHTML = `<span>${meta.label}${s.text ? ` · ${s.text}` : ""} <small>(${s.x.toFixed(2)}, ${s.y.toFixed(2)})</small></span>`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "×";
      btn.addEventListener("click", () => {
        plan.symbols.splice(i, 1);
        if (selected === i) selected = -1;
        else if (selected > i) selected -= 1;
        render();
      });
      li.appendChild(btn);
      ul.appendChild(li);
    });
  }

  function render() {
    readCartoucheFromForm();
    view = makeView(canvas, plan.rooms);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(18, 18, canvas.width - 36, canvas.height - 36);
    drawCartouche(ctx, canvas, plan.cartouche);
    for (const room of plan.rooms || []) drawRoom(ctx, view, room);
    (plan.symbols || []).forEach((s, i) => drawSymbol(ctx, view, s, i === selected));
    if (plan.cartouche.notes) {
      ctx.fillStyle = "#64748b";
      ctx.font = "400 12px Segoe UI, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(String(plan.cartouche.notes).slice(0, 140), 28, canvas.height - 28);
    }
    renderSymbolList();
  }

  function showGate(msg) {
    $("atelier-gate").hidden = false;
    $("atelier-picker").hidden = true;
    $("atelier-workspace").hidden = true;
    $("atelier-gate-msg").textContent = msg;
  }

  function showPicker() {
    $("atelier-gate").hidden = true;
    $("atelier-picker").hidden = false;
    $("atelier-workspace").hidden = true;
  }

  function showWorkspace() {
    $("atelier-gate").hidden = true;
    $("atelier-picker").hidden = true;
    $("atelier-workspace").hidden = false;
    writeCartoucheToForm();
    render();
  }

  async function loadDevis(id) {
    const snap = await getDoc(doc(db, "devis", id));
    if (!snap.exists()) throw new Error("Devis introuvable.");
    const devis = { id: snap.id, ...snap.data() };
    if (devis.userId && user?.uid && devis.userId !== user.uid) {
      throw new Error("Ce devis ne t’appartient pas.");
    }
    plan = normalizePlan(devis.plan, devis);
    setStatus(
      plan.rooms.length
        ? `${plan.rooms.length} pièce(s) — peaufine, enregistre, imprime A4.`
        : "Aucun plan d’étage sur ce devis. Termine un devis multi-pièces puis reviens."
    );
    devisId = id;
    const url = new URL(location.href);
    url.searchParams.set("devis", id);
    history.replaceState({}, "", url);
    showWorkspace();
  }

  async function listDevis() {
    const q = query(
      collection(db, "devis"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(40)
    );
    const snap = await getDocs(q);
    const ul = $("devis-list");
    ul.innerHTML = "";
    let n = 0;
    snap.forEach((d) => {
      const data = d.data();
      const hasPlan =
        (data.plan && Array.isArray(data.plan.rooms) && data.plan.rooms.length) ||
        (Array.isArray(data.rooms) &&
          data.rooms.some((r) => r.worldPolygon || r.polygon || r.sketch?.polygon));
      if (!hasPlan) return;
      n += 1;
      const li = document.createElement("li");
      const title = data.client?.nom || data.clientName || data.title || data.ref || d.id.slice(0, 8);
      li.innerHTML = `<span>${title}</span>`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Ouvrir";
      btn.style.color = "#0d9488";
      btn.addEventListener("click", () => loadDevis(d.id).catch((e) => setStatus(e.message)));
      li.appendChild(btn);
      ul.appendChild(li);
    });
    if (!n) {
      ul.innerHTML =
        `<li class="atelier-empty">Aucun devis avec plan pour l’instant. Termine un devis multi-pièces dans l’assistant, puis reviens.</li>`;
    }
    showPicker();
  }

  async function savePlan() {
    if (!devisId) return;
    readCartoucheFromForm();
    await updateDoc(doc(db, "devis", devisId), {
      plan: {
        rooms: plan.rooms,
        symbols: plan.symbols,
        cartouche: plan.cartouche,
        updatedAt: new Date().toISOString(),
      },
    });
    setStatus("Plan enregistré sur le devis.");
  }

  function pointerWorld(ev) {
    const rect = canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((ev.clientY - rect.top) / rect.height) * canvas.height;
    return view.toWorld({ x, y });
  }

  canvas.addEventListener("pointerdown", (ev) => {
    const world = pointerWorld(ev);
    if (tool === "select") {
      selected = hitSymbol(plan.symbols, world);
      render();
      return;
    }
    if (tool === "erase") {
      const i = hitSymbol(plan.symbols, world, 0.45);
      if (i >= 0) {
        plan.symbols.splice(i, 1);
        selected = -1;
        render();
      }
      return;
    }
    if (tool === "annotation") {
      const text = window.prompt("Texte à placer sur le plan :", "Note");
      if (!text) return;
      plan.symbols.push({ type: "annotation", x: world.x, y: world.y, text });
      render();
      return;
    }
    plan.symbols.push({ type: tool, x: world.x, y: world.y });
    selected = plan.symbols.length - 1;
    render();
  });

  $("tool-bar")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-tool]");
    if (!btn) return;
    tool = btn.getAttribute("data-tool");
    $("tool-bar").querySelectorAll(".atelier-tool").forEach((el) => {
      el.classList.toggle("active", el === btn);
    });
  });

  ["f-client", "f-addr", "f-ref", "f-scale", "f-date", "f-notes"].forEach((id) => {
    $(id)?.addEventListener("input", () => render());
  });

  $("btn-save")?.addEventListener("click", () => {
    savePlan().catch((e) => setStatus(e.message || "Erreur enregistrement"));
  });
  $("btn-reload")?.addEventListener("click", () => {
    if (devisId) loadDevis(devisId).catch((e) => setStatus(e.message));
    else listDevis().catch((e) => setStatus(e.message));
  });
  $("btn-print")?.addEventListener("click", () => {
    readCartoucheFromForm();
    render();
    window.print();
  });
  $("btn-pdf")?.addEventListener("click", () => {
    readCartoucheFromForm();
    render();
    const a = document.createElement("a");
    a.download = `plan-volt-${(plan.cartouche.ref || devisId || "a4").replace(/\W+/g, "-")}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
    setStatus("PNG A4 téléchargé. Utilise Imprimer A4 pour le PDF navigateur.");
  });

  onAuthStateChanged(auth, async (u) => {
    user = u;
    if (!u) {
      showGate("Connecte-toi pour ouvrir l’atelier plan.");
      return;
    }
    try {
      const userSnap = await getDoc(doc(db, "users", u.uid));
      const access = checkElectricianAccess(userSnap.exists() ? userSnap.data() : null);
      if (!access?.allowed) {
        const msg = paywallMessage(access.reason);
        showGate((msg && (msg.text || msg.title)) || "Accès électricien requis.");
        return;
      }
      if (devisId) await loadDevis(devisId);
      else await listDevis();
    } catch (e) {
      showGate(e.message || "Impossible de charger l’atelier.");
    }
  });
}

main().catch((e) => {
  console.error(e);
  const gate = document.getElementById("atelier-gate");
  if (gate) {
    gate.hidden = false;
    const msg = document.getElementById("atelier-gate-msg");
    if (msg) msg.textContent = e.message || String(e);
  }
});
