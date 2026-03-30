const functions = require("firebase-functions");
const { HttpsError } = functions.https;
const admin = require("firebase-admin");

admin.initializeApp();

const VIES_URL = "https://ec.europa.eu/taxation_customs/vies/services/checkVatService";

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
 * Inscription essai 14 jours : VIES + unicité TVA AVANT création du compte Firebase.
 * Si la TVA est invalide ou déjà utilisée → aucun compte n’est créé.
 */
exports.registerTrialWithVat = functions
  .region("europe-west1")
  .https.onCall(async (data) => {
    const email = String((data && data.email) || "")
      .trim()
      .toLowerCase();
    const password = String((data && data.password) || "");
    const vatRaw = data && data.vat;

    if (!email || !password) {
      throw new HttpsError("invalid-argument", "EMAIL_PASSWORD_REQUIRED");
    }
    if (password.length < 6) {
      throw new HttpsError("invalid-argument", "PASSWORD_TOO_SHORT");
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
    const vatSnap = await vatDocRef.get();
    if (vatSnap.exists) {
      throw new HttpsError("already-exists", "VAT_ALREADY_USED");
    }

    let uid;
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        emailVerified: false,
      });
      uid = userRecord.uid;
    } catch (e) {
      if (e.code === "auth/email-already-exists") {
        throw new HttpsError("already-exists", "EMAIL_ALREADY_IN_USE");
      }
      console.error("createUser failed:", e);
      throw new HttpsError("internal", "AUTH_CREATE_FAILED");
    }

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

    try {
      await db.runTransaction(async (t) => {
        const v = await t.get(vatDocRef);
        if (v.exists) {
          throw new HttpsError("already-exists", "VAT_ALREADY_USED");
        }
        t.set(vatDocRef, {
          userId: uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        t.set(db.doc(`users/${uid}`), trialPayload);
      });
    } catch (e) {
      await admin.auth().deleteUser(uid).catch(() => {});
      if (e instanceof HttpsError) {
        throw e;
      }
      console.error(e);
      throw new HttpsError("internal", "TRANSACTION_FAILED");
    }

    return { ok: true, trialEndDate: trialEndIso };
  });

/**
 * Après inscription « sans essai » (createUser côté client), crée le profil Firestore.
 * Accès complet pour l’instant ; Stripe pourra exiger subscriptionStatus plus tard.
 */
exports.setupRegisteredAccount = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context || !context.auth) {
      throw new HttpsError("unauthenticated", "AUTH_REQUIRED");
    }

    const uid = context.auth.uid;
    const ref = admin.firestore().doc(`users/${uid}`);

    await ref.set(
      {
        accountType: "registered",
        hasTrial: false,
        subscriptionStatus: "pending_payment",
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { ok: true };
  });
