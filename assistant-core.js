/**
 * Volt — moteur conversationnel + croquis + chiffrage devis
 * Assistant ludique pour devis électriques (DevTech)
 */

export function normStr(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Prix de repli (€ HT) */
export const FALLBACK_PRICES = {
  "prise-simple": { name: "Prise 2P+T simple", price: 8.5, tempsBase: 25, cable: "3G2.5" },
  "prise-double": { name: "Prise 2P+T double", price: 14, tempsBase: 30, cable: "3G2.5" },
  "prise-four": { name: "Prise dédiée four", price: 12, tempsBase: 40, cable: "3G2.5" },
  "prise-plaque": { name: "Alim. plaque / taque", price: 18, tempsBase: 50, cable: "5G6" },
  "prise-lavevaisselle": { name: "Prise lave-vaisselle", price: 12, tempsBase: 35, cable: "3G2.5" },
  "prise-frigo": { name: "Prise frigo", price: 10, tempsBase: 25, cable: "3G2.5" },
  interrupteur: { name: "Interrupteur simple", price: 7, tempsBase: 20, cable: "3G1.5" },
  eclairage: { name: "Point lumineux", price: 6, tempsBase: 30, cable: "3G1.5" },
  rj45: { name: "Prise RJ45", price: 15, tempsBase: 35, cable: "RJ45" },
  "cable-3G1.5": { name: "Câble 3G1.5", price: 1.2, unit: "m" },
  "cable-3G2.5": { name: "Câble 3G2.5", price: 1.8, unit: "m" },
  "cable-5G6": { name: "Câble 5G6", price: 3.5, unit: "m" },
  "cable-3G4": { name: "Câble 3G4", price: 2.5, unit: "m" },
  saignee: { name: "Saignée + rebouchage", price: 18, unit: "m", tempsBase: 15 },
  tube: { name: "Tube IRL / goulotte", price: 2.2, unit: "m" },
};

export const PROJECT_TYPES = [
  { id: "renovation", label: "Rénovation", emoji: "🔨" },
  { id: "neuf", label: "Construction neuve", emoji: "🏗️" },
  { id: "extension", label: "Extension / véranda", emoji: "🏡" },
  { id: "piece", label: "Une seule pièce", emoji: "🚪" },
  { id: "depannage", label: "Dépannage / ajout", emoji: "⚡" },
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
    { re: /(\d+)\s*(?:points?\s*)?(?:lumineux|eclairages?|spots?)/g, type: "eclairage" },
    { re: /(\d+)\s*interrupteurs?/g, type: "interrupteur" },
    { re: /(\d+)\s*(?:prises?\s*)?rj\s*45|ethernet/g, type: "rj45" },
  ];
  for (const p of patterns) {
    const re = new RegExp(p.re.source, p.re.flags);
    let m;
    while ((m = re.exec(t)) !== null) {
      const qty = p.qty ?? (parseInt(m[1], 10) || 1);
      const existing = items.find((i) => i.type === p.type);
      if (existing) existing.qty += qty;
      else items.push({ type: p.type, qty, label: FALLBACK_PRICES[p.type]?.name || p.type });
    }
  }
  if (!items.length && /prise/.test(t)) {
    items.push({ type: "prise-simple", qty: 1, label: FALLBACK_PRICES["prise-simple"].name });
  }
  return items;
}

export function parseDimensions(text) {
  const t = normStr(text).replace(/,/g, ".");
  const num = "(\\d+(?:\\.\\d+)?)";
  const unit = "(?:\\s*(?:m|metres?|mètres?))?";
  let width = null;
  let depth = null;
  let height = 2.5;
  const sur = t.match(new RegExp(`${num}${unit}\\s*(?:sur|x|par)\\s*${num}${unit}`, "i"));
  if (sur) {
    width = parseFloat(sur[1]);
    depth = parseFloat(sur[2]);
  }
  const triple = t.match(new RegExp(`${num}\\s*[x×]\\s*${num}\\s*[x×]\\s*${num}`, "i"));
  if (triple) {
    width = parseFloat(triple[1]);
    depth = parseFloat(triple[2]);
    height = parseFloat(triple[3]);
  }
  const h =
    t.match(new RegExp(`hauteur\\s*(?:de\\s*)?${num}${unit}`, "i")) ||
    t.match(new RegExp(`${num}${unit}\\s*(?:de\\s*)?haut`, "i"));
  if (h) height = parseFloat(h[1]);
  if (width && depth) return { width, depth, height: height || 2.5 };
  return null;
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
    step: "project",
    projectType: null,
    roomType: null,
    roomName: "",
    dimensions: null,
    equipment: [],
    placements: [],
    arrival: null,
    tech: {
      mursNu: null,
      saignees: null,
      rewirage: null,
      tubes: null,
      apparent: null,
      cablePath: null,
    },
    client: { nom: "", telephone: "", email: "", adresse: "" },
    messages: [],
  };
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function wallPoint(dims, wall, t) {
  const W = dims.width;
  const D = dims.depth;
  const u = clamp01(t);
  switch (wall) {
    case "bottom":
      return { x: u * W, y: 0 };
    case "right":
      return { x: W, y: u * D };
    case "top":
      return { x: (1 - u) * W, y: D };
    case "left":
      return { x: 0, y: (1 - u) * D };
    default:
      return { x: W / 2, y: D / 2 };
  }
}

export function nearestWallPoint(dims, px, py) {
  const W = dims.width;
  const D = dims.depth;
  const candidates = [
    { wall: "bottom", t: clamp01(px / W), dist: Math.abs(py - 0) },
    { wall: "right", t: clamp01(py / D), dist: Math.abs(px - W) },
    { wall: "top", t: clamp01(1 - px / W), dist: Math.abs(py - D) },
    { wall: "left", t: clamp01(1 - py / D), dist: Math.abs(px - 0) },
  ];
  candidates.sort((a, b) => a.dist - b.dist);
  const best = candidates[0];
  return { ...best, ...wallPoint(dims, best.wall, best.t) };
}

function perimeterPos(dims, wall, t) {
  const W = dims.width;
  const D = dims.depth;
  const u = clamp01(t);
  switch (wall) {
    case "bottom":
      return u * W;
    case "right":
      return W + u * D;
    case "top":
      return W + D + u * W;
    case "left":
      return W + D + W + u * D;
    default:
      return 0;
  }
}

function perimeterLength(dims) {
  return 2 * (dims.width + dims.depth);
}

export function wallPathLength(dims, a, b) {
  const P = perimeterLength(dims);
  const d = Math.abs(perimeterPos(dims, b.wall, b.t) - perimeterPos(dims, a.wall, a.t));
  return Math.min(d, P - d);
}

export function cableLength(dims, arrival, point, pathMode, outletHeight = 0.3) {
  const H = dims.height || 2.5;
  const horizWall = wallPathLength(dims, arrival, point);
  const straight = Math.hypot(point.x - arrival.x, point.y - arrival.y);
  switch (pathMode) {
    case "plafond":
      return H - 0.3 + straight + (H - outletHeight);
    case "sol":
      return 0.3 + straight + outletHeight;
    case "murs":
    default:
      return horizWall + Math.abs(outletHeight - 0.3) + 0.4;
  }
}

export function defaultHeightForType(type) {
  if (type === "interrupteur") return 1.1;
  if (type === "eclairage") return 2.4;
  if (type === "prise-plaque" || type === "prise-four") return 0.5;
  return 0.3;
}

export function cableTypeForEquipment(type) {
  return FALLBACK_PRICES[type]?.cable || "3G2.5";
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function buildQuote(session, settings = {}) {
  const tarif = settings.tarif ?? 50;
  const deplacement = settings.deplacement ?? 25;
  const tva = settings.tva ?? 0.06;
  const rebouchageM = settings.rebouchage ?? 18;
  const path = session.tech.cablePath || "murs";

  const articles = [];
  const cableMeters = {};
  const placedByType = {};

  for (const p of session.placements) {
    placedByType[p.type] = (placedByType[p.type] || 0) + 1;
    if (session.arrival && session.dimensions) {
      const len = cableLength(
        session.dimensions,
        session.arrival,
        p,
        path,
        defaultHeightForType(p.type)
      );
      const ct = cableTypeForEquipment(p.type);
      cableMeters[ct] = (cableMeters[ct] || 0) + len;
    }
  }

  for (const eq of session.equipment) {
    const placed = placedByType[eq.type] || 0;
    const missing = Math.max(0, eq.qty - placed);
    if (missing > 0) {
      placedByType[eq.type] = placed + missing;
      if (session.dimensions) {
        const avg = (session.dimensions.width + session.dimensions.depth) / 2 + 1;
        const ct = cableTypeForEquipment(eq.type);
        cableMeters[ct] = (cableMeters[ct] || 0) + avg * missing;
      }
    }
  }

  let moMinutes = 0;
  let materiel = 0;
  let rebouchage = 0;

  for (const [type, qty] of Object.entries(placedByType)) {
    const meta = FALLBACK_PRICES[type];
    if (!meta) continue;
    const lineMateriel = meta.price * qty;
    moMinutes += (meta.tempsBase || 20) * qty;
    materiel += lineMateriel;
    articles.push({
      ref: type.toUpperCase(),
      name: meta.name,
      qty,
      category: "appareillage",
      prixAchat: meta.price,
      materiel: lineMateriel,
      tempsBase: meta.tempsBase || 20,
      mo: 0,
      rebouchage: 0,
      total: 0,
      cables: [],
    });
  }

  let totalCableM = 0;
  for (const [ct, meters] of Object.entries(cableMeters)) {
    const m = Math.ceil(meters * 10) / 10;
    totalCableM += m;
    const meta = FALLBACK_PRICES[`cable-${ct}`] || { name: `Câble ${ct}`, price: 1.5 };
    const lineMateriel = meta.price * m;
    materiel += lineMateriel;
    moMinutes += m * 8;
    articles.push({
      ref: ct,
      name: meta.name,
      qty: m,
      unit: "m",
      category: "cables",
      prixAchat: meta.price,
      materiel: lineMateriel,
      tempsBase: 8,
      mo: 0,
      rebouchage: 0,
      total: 0,
      cables: [],
    });
  }

  if (session.tech.saignees === true && totalCableM > 0) {
    const m = Math.ceil(totalCableM * 0.7 * 10) / 10;
    const line = m * rebouchageM;
    materiel += line * 0.3;
    rebouchage += line * 0.7;
    moMinutes += m * 15;
    articles.push({
      ref: "SAIGNEE",
      name: "Saignées + rebouchage",
      qty: m,
      unit: "m",
      category: "main-oeuvre",
      prixAchat: rebouchageM,
      materiel: line * 0.3,
      tempsBase: 15,
      mo: 0,
      rebouchage: line * 0.7,
      total: 0,
      cables: [],
    });
  }

  if (session.tech.tubes === true && totalCableM > 0) {
    const m = Math.ceil(totalCableM * 10) / 10;
    const price = FALLBACK_PRICES.tube.price;
    materiel += price * m;
    moMinutes += m * 5;
    articles.push({
      ref: "TUBE",
      name: "Tubes / goulottes",
      qty: m,
      unit: "m",
      category: "cables",
      prixAchat: price,
      materiel: price * m,
      tempsBase: 5,
      mo: 0,
      rebouchage: 0,
      total: 0,
      cables: [],
    });
  }

  if (session.tech.rewirage === true) {
    moMinutes += 120;
    articles.push({
      ref: "REWIRE",
      name: "Remplacement / reprise câblage existant",
      qty: 1,
      category: "main-oeuvre",
      prixAchat: 0,
      materiel: 0,
      tempsBase: 120,
      mo: 0,
      rebouchage: 0,
      total: 0,
      cables: [],
    });
  }

  const moHours = moMinutes / 60;
  const moCost = moHours * tarif;
  const totalTemps = articles.reduce((s, a) => s + (a.tempsBase || 0) * (a.qty || 1), 0) || 1;
  articles.forEach((a) => {
    const share = ((a.tempsBase || 0) * (a.qty || 1)) / totalTemps;
    a.mo = moCost * share;
    a.total = (a.materiel || 0) + a.mo + (a.rebouchage || 0);
  });

  const totalHT = materiel + moCost + rebouchage + deplacement;
  const totalTVA = totalHT * tva;
  const totalTTC = totalHT + totalTVA;

  return {
    articles,
    cableMeters,
    totalCableM: Math.ceil(totalCableM * 10) / 10,
    totaux: {
      materiel: round2(materiel),
      mainOeuvre: round2(moCost),
      rebouchage: round2(rebouchage),
      deplacement: round2(deplacement),
      totalHT: round2(totalHT),
      tva: round2(totalTVA),
      totalTTC: round2(totalTTC),
      moHours: round2(moHours),
      tarif,
      tvaRate: tva,
    },
    path,
  };
}

function labelProject(id) {
  return PROJECT_TYPES.find((p) => p.id === id)?.label || id;
}

function wallLabel(w) {
  return { left: "gauche", right: "droit", top: "haut", bottom: "bas" }[w] || w;
}

function equipmentSuggestions(roomType) {
  if (roomType === "cuisine") {
    return [
      { id: "eq:prise-double", label: "+ Prise double" },
      { id: "eq:prise-four", label: "+ Prise four" },
      { id: "eq:prise-plaque", label: "+ Taque / plaque" },
      { id: "eq:prise-lavevaisselle", label: "+ Lave-vaisselle" },
      { id: "eq:prise-frigo", label: "+ Frigo" },
      { id: "eq:eclairage", label: "+ Éclairage" },
    ];
  }
  if (roomType === "sdb") {
    return [
      { id: "eq:prise-simple", label: "+ Prise" },
      { id: "eq:eclairage", label: "+ Éclairage" },
      { id: "eq:interrupteur", label: "+ Interrupteur" },
    ];
  }
  return [
    { id: "eq:prise-double", label: "+ Prise double" },
    { id: "eq:prise-simple", label: "+ Prise simple" },
    { id: "eq:interrupteur", label: "+ Interrupteur" },
    { id: "eq:eclairage", label: "+ Éclairage" },
  ];
}

function formatQuoteSpeech(session, quote) {
  const path = { murs: "murs", plafond: "plafond", sol: "sol" }[quote.path] || quote.path;
  const lines = session.placements.map((p) => {
    const len =
      session.arrival && session.dimensions
        ? cableLength(
            session.dimensions,
            session.arrival,
            p,
            quote.path,
            defaultHeightForType(p.type)
          )
        : 0;
    return `• ${p.label} (${wallLabel(p.wall)}) → ~${len.toFixed(1)} m`;
  });
  return (
    `Voici mon estimation pour ${session.roomName} :\n\n` +
    `${session.placements.length} point(s) placé(s), chemin via ${path}.\n` +
    `Longueur totale de câble : environ ${quote.totalCableM} m.\n\n` +
    (lines.length ? `${lines.join("\n")}\n\n` : "") +
    `Matériel : ${quote.totaux.materiel.toFixed(2)} € HT\n` +
    `Main d'œuvre (~${quote.totaux.moHours} h) : ${quote.totaux.mainOeuvre.toFixed(2)} € HT\n` +
    `Total TTC (TVA ${(quote.totaux.tvaRate * 100).toFixed(0)} %) : ${quote.totaux.totalTTC.toFixed(2)} €\n\n` +
    `Tu veux que j'enregistre ce devis ?`
  );
}

/**
 * Réponse du robot. Mutates session.
 */
export function robotReply(session, userText, choiceId) {
  const t = normStr(userText || "");

  switch (session.step) {
    case "welcome":
    case "project": {
      const byId = PROJECT_TYPES.find((p) => p.id === choiceId);
      if (byId) session.projectType = byId.id;
      else if (t) {
        if (/renov/.test(t)) session.projectType = "renovation";
        else if (/neuf|construction/.test(t)) session.projectType = "neuf";
        else if (/extension|veranda/.test(t)) session.projectType = "extension";
        else if (/depann|ajout|prise/.test(t)) session.projectType = "depannage";
        else session.projectType = "piece";
      }
      if (!session.projectType) {
        return {
          text: "Dis-moi d'abord le type de projet — clique une option ou écris librement.",
          choices: PROJECT_TYPES,
          speak: true,
        };
      }
      session.step = "room";
      return {
        text: `Super, projet « ${labelProject(session.projectType)} ». Quelle pièce on traite ?`,
        choices: ROOM_PRESETS,
        speak: true,
      };
    }

    case "room": {
      const byId = ROOM_PRESETS.find((p) => p.id === choiceId);
      const detected = byId?.id || detectRoomType(t);
      if (!detected && !t) {
        return { text: "Quelle pièce ? Cuisine, salon, chambre…", choices: ROOM_PRESETS, speak: true };
      }
      session.roomType = detected || "autre";
      session.roomName =
        byId?.label ||
        (detected ? ROOM_PRESETS.find((r) => r.id === detected)?.label : t) ||
        "Pièce";
      session.step = "equipment";
      return {
        text: `Parfait, on s'occupe de ${session.roomName.toLowerCase()}. Décris ce qu'il faut — ex. « 4 prises doubles, une prise four et une pour la taque » — ou choisis des suggestions.`,
        suggestions: equipmentSuggestions(session.roomType),
        speak: true,
      };
    }

    case "equipment": {
      if (choiceId?.startsWith("eq:")) {
        const type = choiceId.slice(3);
        const existing = session.equipment.find((e) => e.type === type);
        if (existing) existing.qty += 1;
        else session.equipment.push({ type, qty: 1, label: FALLBACK_PRICES[type]?.name || type });
        return {
          text: `Ajouté : ${FALLBACK_PRICES[type]?.name || type}. Autre chose, ou continue ?`,
          suggestions: equipmentSuggestions(session.roomType),
          actions: [{ id: "next", label: "Continuer →" }],
          speak: true,
        };
      }
      if (choiceId === "next" || /suivant|continuer|c.?est bon|ok|passe/.test(t)) {
        if (!session.equipment.length) {
          return {
            text: "Ajoute au moins un équipement — ex. « 4 prises doubles ».",
            suggestions: equipmentSuggestions(session.roomType),
            speak: true,
          };
        }
        session.step = "dimensions";
        return {
          text: `Nickel. Dimensions de ${session.roomName.toLowerCase()} ? Ex. « 3 mètres sur 4 avec 2m70 de hauteur ».`,
          speak: true,
        };
      }
      const parsed = parseEquipmentText(t);
      if (parsed.length) {
        for (const p of parsed) {
          const existing = session.equipment.find((e) => e.type === p.type);
          if (existing) existing.qty += p.qty;
          else session.equipment.push(p);
        }
        const list = session.equipment.map((e) => `${e.qty}× ${e.label}`).join(", ");
        return {
          text: `J'ai noté : ${list}. Autre chose, ou on continue ?`,
          suggestions: equipmentSuggestions(session.roomType),
          actions: [{ id: "next", label: "Continuer →" }],
          speak: true,
        };
      }
      return {
        text: "Je n'ai pas bien saisi. Essaie « 4 prises doubles et une prise four ».",
        suggestions: equipmentSuggestions(session.roomType),
        speak: true,
      };
    }

    case "dimensions": {
      const dims = parseDimensions(t);
      if (!dims) {
        return {
          text: "Donne longueur × largeur (et hauteur). Ex. « 3 sur 4 hauteur 2.7 ».",
          speak: true,
        };
      }
      session.dimensions = dims;
      session.step = "sketch-arrival";
      return {
        text: `Pièce ${dims.width} m × ${dims.depth} m, hauteur ${dims.height} m. Voici le croquis ! Clique le mur d'arrivée électrique, ou choisis un côté.`,
        showSketch: true,
        sketchMode: "arrival",
        choices: [
          { id: "wall:left", label: "← Gauche" },
          { id: "wall:right", label: "Droite →" },
          { id: "wall:bottom", label: "Bas" },
          { id: "wall:top", label: "Haut" },
        ],
        speak: true,
      };
    }

    case "sketch-arrival": {
      if (choiceId?.startsWith("wall:")) {
        const wall = choiceId.slice(5);
        const pt = wallPoint(session.dimensions, wall, 0.5);
        session.arrival = { wall, t: 0.5, ...pt };
      }
      if (!session.arrival) {
        return {
          text: "Clique sur un mur du croquis pour placer l'arrivée électrique.",
          showSketch: true,
          sketchMode: "arrival",
          speak: true,
        };
      }
      session.step = "sketch-outlets";
      return {
        text: `Arrivée sur le mur ${wallLabel(session.arrival.wall)}. Place maintenant les prises — clique sur les murs du croquis.`,
        showSketch: true,
        sketchMode: "outlets",
        actions: [{ id: "next", label: "Continuer →" }],
        speak: true,
      };
    }

    case "sketch-outlets": {
      if (choiceId === "next" || /suivant|continuer|c.?est bon|fini|ok/.test(t)) {
        if (!session.placements.length) {
          return {
            text: "Place au moins une prise, ou dis « 2 prises sur le mur en face ».",
            showSketch: true,
            sketchMode: "outlets",
            speak: true,
          };
        }
        session.step = "tech-murs";
        return {
          text: "Les murs sont-ils à nu (briques / parpaings visibles) ?",
          choices: [
            { id: "yes", label: "Oui, murs à nu" },
            { id: "no", label: "Non, finis / peints" },
          ],
          speak: true,
        };
      }
      const face = /(?:mur\s+)?(?:en\s+)?face|oppose/.test(t);
      const left = /gauche/.test(t);
      const right = /droite/.test(t);
      const n = parseInt((t.match(/(\d+)/) || [])[1], 10) || 1;
      let wall = "top";
      if (session.arrival) {
        const opp = { left: "right", right: "left", top: "bottom", bottom: "top" };
        if (face) wall = opp[session.arrival.wall] || "top";
        else if (left) wall = "left";
        else if (right) wall = "right";
      }
      if (/prise|point|inter/.test(t) || face || left || right) {
        const type = /double/.test(t)
          ? "prise-double"
          : /inter/.test(t)
            ? "interrupteur"
            : "prise-simple";
        for (let i = 0; i < n; i++) {
          const tt = (i + 1) / (n + 1);
          const pt = wallPoint(session.dimensions, wall, tt);
          session.placements.push({
            id: `p${Date.now()}_${i}`,
            type,
            wall,
            t: tt,
            ...pt,
            label: FALLBACK_PRICES[type]?.name || type,
          });
        }
        return {
          text: `J'ai placé ${n} élément(s) sur le mur ${wallLabel(wall)}. Continue ou dis « suivant ».`,
          showSketch: true,
          sketchMode: "outlets",
          actions: [{ id: "next", label: "Continuer →" }],
          speak: true,
        };
      }
      return {
        text: "Clique sur le croquis, ou écris « 2 prises sur le mur en face ».",
        showSketch: true,
        sketchMode: "outlets",
        actions: [{ id: "next", label: "Continuer →" }],
        speak: true,
      };
    }

    case "tech-murs": {
      if (choiceId === "yes" || /oui|nu|a nu/.test(t)) session.tech.mursNu = true;
      else if (choiceId === "no" || /non|finis|peint/.test(t)) session.tech.mursNu = false;
      else {
        return {
          text: "Murs à nu ?",
          choices: [
            { id: "yes", label: "Oui" },
            { id: "no", label: "Non" },
          ],
          speak: true,
        };
      }
      session.step = "tech-saignees";
      return {
        text: "Faut-il faire des saignées (encastrement dans les murs) ?",
        choices: [
          { id: "yes", label: "Oui, saignées" },
          { id: "no", label: "Non" },
        ],
        speak: true,
      };
    }

    case "tech-saignees": {
      if (choiceId === "yes" || /^oui/.test(t)) session.tech.saignees = true;
      else if (choiceId === "no" || /^non/.test(t)) session.tech.saignees = false;
      else {
        return {
          text: "Saignées ?",
          choices: [
            { id: "yes", label: "Oui" },
            { id: "no", label: "Non" },
          ],
          speak: true,
        };
      }
      session.step = "tech-rewire";
      return {
        text: "Faut-il changer / reprendre le câblage existant ?",
        choices: [
          { id: "yes", label: "Oui, reprendre" },
          { id: "no", label: "Non, neuf seulement" },
        ],
        speak: true,
      };
    }

    case "tech-rewire": {
      if (choiceId === "yes" || /^oui/.test(t)) session.tech.rewirage = true;
      else if (choiceId === "no" || /^non/.test(t)) session.tech.rewirage = false;
      else {
        return {
          text: "Reprendre le câblage existant ?",
          choices: [
            { id: "yes", label: "Oui" },
            { id: "no", label: "Non" },
          ],
          speak: true,
        };
      }
      session.step = "tech-tubes";
      return {
        text: "Pose sous tubes (IRL) / goulottes, encastré, ou apparent ?",
        choices: [
          { id: "tubes", label: "Sous tubes" },
          { id: "encastre", label: "Encastré" },
          { id: "apparent", label: "Apparent" },
        ],
        speak: true,
      };
    }

    case "tech-tubes": {
      if (choiceId === "tubes" || /tube/.test(t)) {
        session.tech.tubes = true;
        session.tech.apparent = false;
      } else if (choiceId === "apparent" || /apparent/.test(t)) {
        session.tech.tubes = false;
        session.tech.apparent = true;
      } else {
        session.tech.tubes = false;
        session.tech.apparent = false;
      }
      session.step = "tech-path";
      return {
        text: "Chemin de câble privilégié ?",
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
        text: formatQuoteSpeech(session, quote),
        quote,
        showSketch: true,
        sketchMode: "review",
        actions: [
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
        return {
          text: "Allez, nouveau devis ! Quel type de projet ?",
          choices: PROJECT_TYPES,
          speak: true,
        };
      }
      if (choiceId === "save" || /enregistr|sauv/.test(t)) {
        return { text: "Je prépare l'enregistrement…", save: true, speak: true };
      }
      return {
        text: "Tu peux enregistrer le devis ou recommencer.",
        actions: [
          { id: "save", label: "💾 Enregistrer le devis" },
          { id: "restart", label: "↻ Recommencer" },
        ],
        speak: true,
      };
    }

    default:
      session.step = "project";
      return {
        text: "Reprenons. Quel type de projet ?",
        choices: PROJECT_TYPES,
        speak: true,
      };
  }
}

export function speakFrench(text, onStart, onEnd) {
  if (!window.speechSynthesis) {
    onEnd?.();
    return null;
  }
  window.speechSynthesis.cancel();
  const clean = String(text)
    .replace(/[💾↻📄✏️🗑️←→]/gu, "")
    .replace(/\n+/g, ". ")
    .replace(/[~•]/g, "")
    .slice(0, 560);
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "fr-FR";
  u.rate = 1.05;
  u.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const fr =
    voices.find((v) => /fr(-|_|$)/i.test(v.lang) && /google|thomas|amelie|julie|marie/i.test(v.name)) ||
    voices.find((v) => /fr(-|_|$)/i.test(v.lang));
  if (fr) u.voice = fr;
  u.onstart = () => onStart?.();
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
  return u;
}
