import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let db: Firestore | null = null;

function getDb() {
  if (db) return db;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY (JSON) is required for Firestore");
  }
  const serviceAccount = JSON.parse(key) as ServiceAccount;
  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  db = getFirestore();
  return db;
}

export { getDb };

export function generateQrToken() {
  return getDb().collection("_").doc().id;
}

export function toDate(val: { toDate?: () => Date } | string | null): string | null {
  if (!val) return null;
  if (typeof val === "object" && "toDate" in val && typeof val.toDate === "function")
    return val.toDate().toISOString();
  return typeof val === "string" ? val : null;
}
