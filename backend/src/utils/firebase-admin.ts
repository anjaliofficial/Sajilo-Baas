import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { FIREBASE_SERVICE_ACCOUNT_PATH } from "../config/index";

export function ensureFirebaseAdminInitialized() {
  if (!admin.apps.length) {
    if (!FIREBASE_SERVICE_ACCOUNT_PATH || FIREBASE_SERVICE_ACCOUNT_PATH === "") {
      console.log(
        "⚠️ Firebase Admin not initialized (service account not set). Skipping."
      );
      return; // skip initialization
    }

    const resolvedPath = path.resolve(process.cwd(), FIREBASE_SERVICE_ACCOUNT_PATH);
    if (!fs.existsSync(resolvedPath)) {
      console.log("⚠️ Firebase service account file not found. Skipping initialization.");
      return;
    }

    const serviceAccount = JSON.parse(
      fs.readFileSync(resolvedPath, "utf-8"),
    ) as admin.ServiceAccount;

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin initialized successfully.");
  }
}