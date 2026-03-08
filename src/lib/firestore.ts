import { initializeApp, getApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const APP_NAME = "bhos-firestore";
let db: Firestore | null = null;

function getDb(): Firestore {
  if (db) return db;
  const key = process.env.ADMIN_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error("ADMIN_SERVICE_ACCOUNT_KEY (JSON) is required for Firestore");
  }
  const serviceAccount = JSON.parse(key) as ServiceAccount;
  let app;
  try {
    app = getApp(APP_NAME);
  } catch {
    app = initializeApp({ credential: cert(serviceAccount) }, APP_NAME);
  }
  db = getFirestore(app);
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
