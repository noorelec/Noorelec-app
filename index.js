const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

setGlobalOptions({ region: "europe-west1" });

admin.initializeApp();

const VIES_URL = "https://ec.europa.eu/taxation_customs/vies/services/checkVatService";

/**
 * Normalise et découpe un n° TVA UE (VIES).
 * Si pas de préfixe pays, préfixe BE par défaut.
 */
function parseEUVat(raw) {
  if (!raw || typeof raw !== "string") {
    throw new Error("FORMAT");
  }
  let s = raw.replace(/[\s.–\-]/g, "").toUpperCase();
  if (!/^[A-Z]{2}/.test(s)) {
    s = "BE" + s;
  }
  const country = s.slice(0, 2);
  const number = s.slice(2);
  if (!/^[A-Z]{2}$/.test(country) || !/^[A-Z0-9]{2,14}$/.test(number)) {
    throw new Error("FORMAT");
  }
  return { country, number, full: s };
}

/**
 * Interroge le service officiel VIES (SOAP).
 * Peut retourner UNAVAILABLE si le service national est temporairement hors ligne.
 */
async function checkVies(countryCode, vatNumber) {
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ` +
    `xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">` +
    `<soapenv:Header/>` +
    `<soapenv:Body>` +
    `<urn:checkVat>` +
    `<urn:countryCode>${countryCode}</urn:countryCode>` +
    `<urn:vatNumber>${vatNumber}</urn:vatNumber>` +
    `</urn:checkVat>` +
    `</soapenv:Body>` +
    `</soapenv:Envelope>`;

  const res = await fetch(VIES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml;charset=UTF-8",
      SOAPAction: '""',
    },
    body,
  });

  const text = await res.text();

  if (/MS_UNAVAILABLE|SERVICE_UNAVAILABLE|GLOBAL_MAX_CONCURRENT_REQ/i.test(text)) {
    return { ok: false, error: "UNAVAILABLE" };
  }

  if (/<[^:]*:?valid>\s*true\s*<\/[^:]*:?valid>/i.test(text)) {
    return { ok: true };
  }
  if (/<[^:]*:?valid>\s*false\s*<\/[^:]*:?valid>/i.test(text)) {
    return { ok: false, error: "INVALID" };
  }

  return { ok: false, error: "UNKNOWN" };
}

/**
 * Crée le document users/{uid} en mode « essai non activé » après inscription.
 * Les comptes existants (déjà payés ou déjà en essai actif) ne sont pas modifiés.
 */
exports.setupTrialAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "AUTH_REQUIRED");
  }

  const uid = request.auth.uid;
  const ref = admin.firestore().doc(`users/${uid}`);
  const snap = await ref.get();

  if (snap.exists) {
    const d = snap.data();
    if (d.accountType === "paid" && d.subscriptionStatus === "active") {
      return { ok: true, skipped: "already_paid" };
    }
    if (d.hasTrial === true && d.trialEndDate) {
      const end = new Date(d.trialEndDate);
      if (end > new Date()) {
        return { ok: true, skipped: "trial_active" };
      }
    }
  }

  await ref.set(
    {
      accountType: "trial",
      hasTrial: false,
      trialAccountPreparedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
});

/**
 * Vérifie l’e-mail, valide la TVA via VIES, garantit l’unicité du n° TVA,
 * puis active 14 jours d’essai sur users/{uid}.
 */
exports.claimTrialWithVat = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "AUTH_REQUIRED");
  }

  const uid = request.auth.uid;
  const vatRaw = request.data && request.data.vat;

  let userRecord;
  try {
    userRecord = await admin.auth().getUser(uid);
  } catch (e) {
    throw new HttpsError("internal", "USER_LOOKUP_FAILED");
  }

  if (!userRecord.emailVerified) {
    throw new HttpsError("failed-precondition", "EMAIL_NOT_VERIFIED");
  }

  let parsed;
  try {
    parsed = parseEUVat(String(vatRaw || "").trim());
  } catch {
    throw new HttpsError("invalid-argument", "VAT_FORMAT");
  }

  const vies = await checkVies(parsed.country, parsed.number);
  if (!vies.ok) {
    if (vies.error === "UNAVAILABLE") {
      throw new HttpsError("unavailable", "VIES_DOWN");
    }
    if (vies.error === "INVALID") {
      throw new HttpsError("failed-precondition", "VAT_INVALID");
    }
    throw new HttpsError("internal", "VIES_UNKNOWN");
  }

  const db = admin.firestore();
  const vatDocRef = db.doc(`vatRegistrations/${parsed.full}`);
  const userRef = db.doc(`users/${uid}`);

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);
  const trialEndIso = trialEnd.toISOString();

  const trialPayload = {
    accountType: "trial",
    hasTrial: true,
    trialEndDate: trialEndIso,
    trialStartedAt: admin.firestore.FieldValue.serverTimestamp(),
    vatNumberNormalized: parsed.full,
  };

  const vatPre = await vatDocRef.get();
  if (vatPre.exists) {
    const owner = vatPre.data().userId;
    if (owner && owner !== uid) {
      throw new HttpsError("already-exists", "VAT_ALREADY_USED");
    }
    const uSnap = await userRef.get();
    if (uSnap.exists && uSnap.data().trialEndDate && uSnap.data().hasTrial === true) {
      return {
        ok: true,
        trialEndDate: uSnap.data().trialEndDate,
        alreadyRegistered: true,
      };
    }
    await userRef.set(trialPayload, { merge: true });
    return { ok: true, trialEndDate: trialEndIso, repaired: true };
  }

  try {
    await db.runTransaction(async (t) => {
      const vSnap = await t.get(vatDocRef);
      if (vSnap.exists) {
        const owner = vSnap.data().userId;
        if (owner && owner !== uid) {
          throw new HttpsError("already-exists", "VAT_ALREADY_USED");
        }
        const uSnap = await t.get(userRef);
        const u = uSnap.data();
        if (u && u.hasTrial === true && u.trialEndDate) {
          return;
        }
        t.set(userRef, trialPayload, { merge: true });
        return;
      }
      t.set(vatDocRef, {
        userId: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      t.set(userRef, trialPayload, { merge: true });
    });
  } catch (e) {
    if (e instanceof HttpsError) {
      throw e;
    }
    console.error(e);
    throw new HttpsError("internal", "TRANSACTION_FAILED");
  }

  const uFinal = await userRef.get();
  const vFinal = await vatDocRef.get();
  if (!vFinal.exists || vFinal.data().userId !== uid) {
    throw new HttpsError("already-exists", "VAT_ALREADY_USED");
  }
  if (!uFinal.exists || uFinal.data().hasTrial !== true || !uFinal.data().trialEndDate) {
    throw new HttpsError("internal", "USER_TRIAL_NOT_SET");
  }

  return { ok: true, trialEndDate: uFinal.data().trialEndDate };
});
