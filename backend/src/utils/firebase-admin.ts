import fs from "fs";
import * as admin from "firebase-admin";

export function ensureFirebaseAdminInitialized(): boolean {
  if (admin.apps.length) return true;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  let serviceAccount: admin.ServiceAccount | null = null;

  if (serviceAccountJson) {
    serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
  } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const fileContent = fs.readFileSync(serviceAccountPath, "utf-8");
    serviceAccount = JSON.parse(fileContent) as admin.ServiceAccount;
  }

  if (!serviceAccount) return false;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return true;
}