import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let db: Firestore | null = null;

function getDb() {
  if (db) return db;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is required for Firestore");
  }
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ) as ServiceAccount;

  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  db = getFirestore();
  return db;
}

export { getDb };

export function generateId() {
  return getDb().collection("_").doc().id;
}
