/**
 * Volt Bêta — devis minute sur chantier (parcours séparé de Volt croquis).
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

const CATALOG = {
  "prise-simple": { label: "Prise 2P+T", mat: 8.5, min: 25, cableM: 4 },
  "prise-double": { label: "Prise double", mat: 14, min: 30, cableM: 4 },
  "prise-usb": { label: "Prise USB", mat: 22, min: 30, cableM: 4 },
  "prise-etanche": { label: "Prise étanche", mat: 16, min: 35, cableM: 4 },
  "inter-simple": { label: "Interrupteur simple", mat: 7, min: 20, cableM: 3 },
  "va-et-vient": { label: "Va-et-vient", mat: 9, min: 28, cableM: 5 },
  "point-lumiere": { label: "Point lumineux", mat: 6, min: 35, cableM: 4 },
  spot: { label: "Spot LED", mat: 12, min: 28, cableM: 3 },
  applique: { label: "Applique", mat: 10, min: 32, cableM: 3 },
  detecteur: { label: "Détecteur présence", mat: 28, min: 35, cableM: 4 },
  rj45: { label: "Prise RJ45", mat: 15, min: 35, cableM: 5 },
  tv: { label: "Prise TV", mat: 12, min: 30, cableM: 4 },
  "prise-four": { label: "Circuit four", mat: 18, min: 45, cableM: 8 },
  "prise-plaque": { label: "Circuit plaque", mat: 28, min: 55, cableM: 10 },
  "prise-ll": { label: "Circuit lave-linge", mat: 16, min: 40, cableM: 7 },
  "prise-lv": { label: "Circuit lave-vaisselle", mat: 16, min: 40, cableM: 7 },
  vmc: { label: "Alim. VMC", mat: 14, min: 40, cableM: 6 },
  "chauffe-eau": { label: "Alim. chauffe-eau", mat: 22, min: 50, cableM: 8 },
  "prise-ext": { label: "Prise extérieure", mat: 24, min: 45, cableM: 6 },
  "eclairage-ext": { label: "Éclairage extérieur", mat: 20, min: 40, cableM: 6 },
};

const ITEM_ORDER = Object.keys(CATALOG);
const COMMON = new Set([
  "prise-simple", "prise-double", "inter-simple", "va-et-vient",
  "point-lumiere", "spot", "rj45", "prise-four", "prise-plaque",
]);

const PACKS = {
  cuisine: {
    label: "Pack cuisine",
    items: {
      "prise-simple": 6, "prise-double": 2, "inter-simple": 2, "point-lumiere": 2,
      "prise-four": 1, "prise-plaque": 1, "prise-lv": 1, rj45: 1,
    },
  },
  salon: {
    label: "Pack salon",
    items: {
      "prise-simple": 8, "prise-double": 2, "va-et-vient": 2, "point-lumiere": 2,
      spot: 4, rj45: 2, tv: 1,
    },
  },
  chambre: {
    label: "Pack chambre",
    items: {
      "prise-simple": 5, "prise-double": 1, "va-et-vient": 2, "point-lumiere": 1,
      applique: 2, rj45: 1,
    },
  },
  sdb: {
    label: "Pack SDB",
    items: { "prise-etanche": 2, "inter-simple": 1, "point-lumiere": 2, applique: 1, vmc: 1 },
  },
  bureau: {
    label: "Pack bureau",
    items: {
      "prise-simple": 6, "prise-double": 2, "prise-usb": 1, "inter-simple": 1,
      "point-lumiere": 2, rj45: 3,
    },
  },
  garage: {
    label: "Pack garage",
    items: {
      "prise-simple": 4, "prise-etanche": 1, "inter-simple": 2, "point-lumiere": 2, detecteur: 1,
    },
  },
  exterieur: {
    label: "Pack extérieur",
    items: { "prise-ext": 2, "eclairage-ext": 3, detecteur: 1 },
  },
};

const JOBS = [
  {
    id: "renov",
    label: "Rénovation pièce",
    desc: "Remise à neuf d’une ou plusieurs pièces",
    defaults: { saignees: true, tableau: false },
    seed: ["cuisine"],
    tva: 0.06,
  },
  {
    id: "neuf",
    label: "Pièce neuve",
    desc: "Installation complète pièce par pièce",
    defaults: { saignees: true, tableau: false },
    seed: ["salon"],
    tva: 0.21,
  },
  {
    id: "appart",
    label: "Appart / étage",
    desc: "Plusieurs pièces d’un coup",
    defaults: { saignees: true, tableau: true },
    seed: ["cuisine", "salon", "chambre", "sdb"],
    tva: 0.06,
  },
  {
    id: "ajout",
    label: "Dépannage / ajout",
    desc: "Ajouts ciblés sans tout refaire",
    defaults: { saignees: false, tableau: false },
    seed: [],
    tva: 0.06,
  },
];

const BLOCET = 4.5;
const CABLE_EUR = 1.6;
const SAIGNEE_EUR = 16;
const APPARENT_EUR = 6;
const TABLEAU_BASE = 280;
const TABLEAU_CIRCUIT = 28;
const DEFAULT_LABOR = 55;
const DEFAULT_TRAVEL = 35;

const $ = (id) => document.getElementById(id);

function round2(n) {
  return Math.round(n * 100) / 100;
}

function money(n) {
  return `${round2(n).toLocaleString("fr-BE", { maximumFractionDigits: 0 })} €`;
}

function money2(n) {
  return `${round2(n).toLocaleString("fr-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function emptyRoom(name = "Pièce") {
  const items = {};
  for (const id of ITEM_ORDER) items[id] = 0;
  return {
    id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    name,
    items,
  };
}

function applyPack(room, packId) {
  const pack = PACKS[packId];
  if (!pack) return;
  for (const [id, qty] of Object.entries(pack.items)) {
    room.items[id] = Math.max(room.items[id] || 0, qty);
  }
}

function createState() {
  return {
    jobId: null,
    rooms: [],
    roomIndex: 0,
    saignees: true,
    tableau: false,
    client: { nom: "", telephone: "", adresse: "", note: "" },
    tva: 0.06,
    laborRate: DEFAULT_LABOR,
    travel: DEFAULT_TRAVEL,
  };
}

let state = createState();
let currentUser = null;
let settings = { tarif: DEFAULT_LABOR, deplacement: DEFAULT_TRAVEL };

function currentRoom() {
  return state.rooms[state.roomIndex] || null;
}

function roomTotals(room) {
  let mat = 0;
  let minutes = 0;
  let cableM = 0;
  let points = 0;
  const lines = [];

  for (const id of ITEM_ORDER) {
    const qty = room.items[id] || 0;
    if (!qty) continue;
    const meta = CATALOG[id];
    const lineMat = meta.mat * qty;
    const lineMin = meta.min * qty;
    mat += lineMat;
    minutes += lineMin;
    cableM += (meta.cableM || 0) * qty;
    points += qty;
    lines.push({
      id,
      label: meta.label,
      qty,
      mat: lineMat,
      labor: (lineMin / 60) * state.laborRate,
    });
  }

  const extras = {
    blocets: points * BLOCET,
    cable: cableM * CABLE_EUR,
    saignee: state.saignees ? cableM * 0.85 * SAIGNEE_EUR : cableM * 0.35 * APPARENT_EUR,
  };
  mat += extras.blocets + extras.cable;
  minutes += points * 8 + cableM * (state.saignees ? 4 : 2);

  return { mat, minutes, cableM, points, lines, extras };
}

function buildQuote() {
  const roomsOut = [];
  let materiel = 0;
  let minutes = 0;
  let saignee = 0;

  for (const room of state.rooms) {
    const t = roomTotals(room);
    if (!t.points) continue;
    materiel += t.mat;
    minutes += t.minutes;
    saignee += t.extras.saignee;
    roomsOut.push({ name: room.name, ...t });
  }

  let tableau = 0;
  if (state.tableau) {
    const circuits = Math.max(6, Math.ceil(roomsOut.reduce((s, r) => s + r.points, 0) / 3));
    tableau = TABLEAU_BASE + circuits * TABLEAU_CIRCUIT;
    materiel += tableau;
    minutes += 90 + circuits * 8;
  }

  const materielFinal = materiel + saignee;
  const labor = (minutes / 60) * state.laborRate;
  const travel = state.travel || 0;
  const ht = materielFinal + labor + travel;
  const tva = ht * state.tva;
  const ttc = ht + tva;

  return {
    rooms: roomsOut,
    totaux: {
      materiel: round2(materielFinal),
      mainOeuvre: round2(labor),
      deplacement: round2(travel),
      heures: round2(minutes / 60),
      ht: round2(ht),
      tva: round2(tva),
      ttc: round2(ttc),
      tableau: round2(tableau),
    },
  };
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("on"));
  const el = $(`screen-${id}`);
  if (el) el.classList.add("on");
  const dock = $("dock");
  const showDock = id === "build" || id === "client";
  dock.classList.toggle("hidden", !showDock);
  if (showDock) updateDock();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateDock() {
  $("dock-total").textContent = money(buildQuote().totaux.ttc);
}

function renderJobs() {
  const root = $("job-choices");
  root.innerHTML = "";
  for (const job of JOBS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice" + (state.jobId === job.id ? " on" : "");
    btn.innerHTML = `<strong>${job.label}</strong><span>${job.desc}</span>`;
    btn.addEventListener("click", () => selectJob(job.id));
    root.appendChild(btn);
  }
}

function selectJob(jobId) {
  const job = JOBS.find((j) => j.id === jobId);
  if (!job) return;
  state.jobId = jobId;
  state.saignees = job.defaults.saignees;
  state.tableau = job.defaults.tableau;
  state.tva = job.tva;
  state.rooms = [];
  if (job.seed.length) {
    for (const packId of job.seed) {
      const room = emptyRoom(PACKS[packId]?.label?.replace("Pack ", "") || "Pièce");
      applyPack(room, packId);
      state.rooms.push(room);
    }
  } else {
    state.rooms.push(emptyRoom("Intervention"));
  }
  state.roomIndex = 0;
  syncToggles();
  renderBuild();
  showScreen("build");
}

function syncToggles() {
  $("opt-saignees").classList.toggle("on", state.saignees);
  $("opt-saignees").setAttribute("aria-pressed", String(state.saignees));
  $("opt-tableau").classList.toggle("on", state.tableau);
  $("opt-tableau").setAttribute("aria-pressed", String(state.tableau));
}

function renderBuild() {
  const room = currentRoom();
  if (!room) return;

  const tabs = $("room-tabs");
  tabs.innerHTML = "";
  state.rooms.forEach((r, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "room-tab" + (i === state.roomIndex ? " on" : "");
    b.textContent = r.name;
    b.addEventListener("click", () => {
      state.roomIndex = i;
      renderBuild();
    });
    tabs.appendChild(b);
  });

  $("room-name").value = room.name;

  const chips = $("pack-chips");
  chips.innerHTML = "";
  for (const [id, pack] of Object.entries(PACKS)) {
    const c = document.createElement("button");
    c.type = "button";
    c.className = "chip";
    c.textContent = pack.label;
    c.addEventListener("click", () => {
      applyPack(room, id);
      if (!room.name || room.name === "Pièce" || room.name === "Intervention") {
        room.name = pack.label.replace("Pack ", "");
      }
      renderBuild();
    });
    chips.appendChild(c);
  }

  const list = $("item-list");
  list.innerHTML = "";
  for (const id of ITEM_ORDER) {
    const qty = room.items[id] || 0;
    if (!qty && !COMMON.has(id)) continue;
    const meta = CATALOG[id];
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div>
        <div class="name">${meta.label}</div>
        <div class="meta">${money2(meta.mat)} mat. · ~${meta.min} min</div>
      </div>
      <div class="stepper" data-id="${id}">
        <button type="button" data-act="-">−</button>
        <span class="qty">${qty}</span>
        <button type="button" data-act="+">+</button>
      </div>`;
    list.appendChild(row);
  }

  const more = ITEM_ORDER.filter((id) => !COMMON.has(id) && !(room.items[id] > 0));
  if (more.length) {
    const wrap = document.createElement("div");
    wrap.className = "chips";
    wrap.style.marginTop = ".55rem";
    for (const id of more) {
      const c = document.createElement("button");
      c.type = "button";
      c.className = "chip";
      c.textContent = `+ ${CATALOG[id].label}`;
      c.addEventListener("click", () => {
        room.items[id] = 1;
        renderBuild();
      });
      wrap.appendChild(c);
    }
    list.appendChild(wrap);
  }

  list.querySelectorAll(".stepper").forEach((el) => {
    const id = el.getAttribute("data-id");
    el.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const delta = btn.getAttribute("data-act") === "+" ? 1 : -1;
        room.items[id] = Math.max(0, (room.items[id] || 0) + delta);
        renderBuild();
      });
    });
  });

  updateDock();
}

function readClient() {
  state.client = {
    nom: $("c-name").value.trim(),
    telephone: $("c-phone").value.trim(),
    adresse: $("c-addr").value.trim(),
    note: $("c-note").value.trim(),
  };
  state.tva = Number($("c-tva").value) || 0.06;
}

function renderPitch() {
  const q = buildQuote();
  const job = JOBS.find((j) => j.id === state.jobId);
  $("pitch-title").textContent = job ? `Devis · ${job.label}` : "Devis électrique";
  const c = state.client;
  $("pitch-client").textContent = [c.nom || "Client sur place", c.telephone, c.adresse]
    .filter(Boolean)
    .join(" · ") || "Client sur place";

  const root = $("pitch-lines");
  root.innerHTML = "";
  for (const room of q.rooms) {
    const head = document.createElement("div");
    head.className = "pitch-line";
    head.innerHTML = `<span><strong>${room.name}</strong></span><span></span>`;
    root.appendChild(head);
    for (const line of room.lines) {
      const el = document.createElement("div");
      el.className = "pitch-line";
      el.innerHTML = `<span>${line.qty}× ${line.label}</span><span>${money(line.mat + line.labor)}</span>`;
      root.appendChild(el);
    }
  }
  if (state.tableau && q.totaux.tableau) {
    const el = document.createElement("div");
    el.className = "pitch-line";
    el.innerHTML = `<span>Tableau électrique estimé</span><span>${money(q.totaux.tableau + 1.5 * state.laborRate)}</span>`;
    root.appendChild(el);
  }
  if (q.totaux.deplacement > 0) {
    const el = document.createElement("div");
    el.className = "pitch-line";
    el.innerHTML = `<span>Déplacement</span><span>${money(q.totaux.deplacement)}</span>`;
    root.appendChild(el);
  }
  const ht = document.createElement("div");
  ht.className = "pitch-line";
  ht.innerHTML = `<span>Sous-total HT</span><span>${money2(q.totaux.ht)}</span>`;
  root.appendChild(ht);
  const tva = document.createElement("div");
  tva.className = "pitch-line";
  tva.innerHTML = `<span>TVA ${(state.tva * 100).toFixed(0)} %</span><span>${money2(q.totaux.tva)}</span>`;
  root.appendChild(tva);

  $("pitch-total").textContent = money(q.totaux.ttc);
}

async function loadSettings(uid) {
  try {
    const snap = await getDoc(doc(db, "settings", uid));
    if (snap.exists()) {
      const d = snap.data();
      settings.tarif = Number(d.tarif || d.tauxHoraire || DEFAULT_LABOR);
      settings.deplacement = Number(d.deplacement || d.fraisDeplacement || DEFAULT_TRAVEL);
    }
  } catch {
    /* defaults */
  }
  state.laborRate = settings.tarif;
  state.travel = settings.deplacement;
}

async function saveQuote() {
  const status = $("status");
  status.className = "status";
  status.textContent = "Enregistrement…";

  if (!currentUser) {
    status.className = "status err";
    status.textContent = "Connecte-toi pour enregistrer le devis.";
    return;
  }

  const q = buildQuote();
  if (!q.rooms.length) {
    status.className = "status err";
    status.textContent = "Ajoute au moins un équipement.";
    return;
  }

  const payload = {
    userId: currentUser.uid,
    createdAt: new Date().toISOString(),
    status: "pending",
    source: "volt-beta",
    client: {
      nom: state.client.nom || "Client (Volt Bêta)",
      telephone: state.client.telephone || "",
      email: "",
      adresse: state.client.adresse || "",
      note: state.client.note || "",
    },
    projectType: state.jobId || "volt-beta",
    rooms: q.rooms.map((r, i) => ({
      id: i + 1,
      name: r.name,
      articles: r.lines.map((l) => ({
        name: l.label,
        qty: l.qty,
        total: round2(l.mat + l.labor),
      })),
    })),
    totaux: {
      materielHT: q.totaux.materiel,
      moHT: q.totaux.mainOeuvre,
      servicesHT: q.totaux.deplacement,
      totalHT: q.totaux.ht,
      tva: q.totaux.tva,
      totalTTC: q.totaux.ttc,
    },
    voltBeta: {
      version: 1,
      jobId: state.jobId,
      saignees: state.saignees,
      tableau: state.tableau,
      tvaRate: state.tva,
      laborRate: state.laborRate,
      quote: q,
      rooms: state.rooms,
    },
  };

  try {
    const ref = await addDoc(collection(db, "devis"), payload);
    const short = ref.id.slice(0, 8).toUpperCase();
    status.className = "status ok";
    status.textContent = `Enregistré · réf. ${short}`;
    $("done-text").textContent =
      `Proposition enregistrée (réf. ${short}). Montre l’écran au client, imprime le PDF, ou retrouve-la dans Mes devis.`;
    showScreen("done");
  } catch (err) {
    console.error(err);
    status.className = "status err";
    status.textContent = "Échec enregistrement. Réessaie.";
  }
}

function bind() {
  $("btn-start").addEventListener("click", () => {
    state = createState();
    state.laborRate = settings.tarif;
    state.travel = settings.deplacement;
    renderJobs();
    showScreen("job");
  });

  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen(btn.getAttribute("data-back")));
  });

  $("room-name").addEventListener("input", () => {
    const room = currentRoom();
    if (!room) return;
    room.name = $("room-name").value || "Pièce";
    // refresh tab labels only
    const tabs = $("room-tabs").querySelectorAll(".room-tab");
    if (tabs[state.roomIndex]) tabs[state.roomIndex].textContent = room.name;
  });

  $("btn-add-room").addEventListener("click", () => {
    state.rooms.push(emptyRoom(`Pièce ${state.rooms.length + 1}`));
    state.roomIndex = state.rooms.length - 1;
    renderBuild();
  });

  $("opt-saignees").addEventListener("click", () => {
    state.saignees = !state.saignees;
    syncToggles();
    updateDock();
  });
  $("opt-tableau").addEventListener("click", () => {
    state.tableau = !state.tableau;
    syncToggles();
    updateDock();
  });

  $("dock-next").addEventListener("click", () => {
    const on = document.querySelector(".screen.on")?.id;
    if (on === "screen-build") {
      $("c-tva").value = String(state.tva);
      showScreen("client");
    } else if (on === "screen-client") {
      readClient();
      renderPitch();
      showScreen("pitch");
    }
  });

  $("btn-to-pitch").addEventListener("click", () => {
    readClient();
    renderPitch();
    showScreen("pitch");
  });
  $("btn-edit").addEventListener("click", () => showScreen("build"));
  $("btn-print").addEventListener("click", () => window.print());
  $("btn-save").addEventListener("click", () => saveQuote());
  $("btn-again").addEventListener("click", () => {
    state = createState();
    state.laborRate = settings.tarif;
    state.travel = settings.deplacement;
    showScreen("home");
  });
}

bind();

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user) return;
  try {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const access = checkElectricianAccess(userSnap.exists() ? userSnap.data() : null);
    if (!access?.allowed) {
      const msg = paywallMessage(access.reason);
      alert(`${msg.title}\n\n${msg.text}`);
      window.location.href = "app.html";
      return;
    }
    await loadSettings(user.uid);
  } catch (e) {
    console.warn(e);
  }
});
