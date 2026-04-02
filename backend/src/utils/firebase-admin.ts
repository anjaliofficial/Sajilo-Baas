import admin from "firebase-admin";
import { FIREBASE_SERVICE_ACCOUNT_PATH } from "../config/index";

export function ensureFirebaseAdminInitialized() {
  if (!admin.apps.length) {
    if (!FIREBASE_SERVICE_ACCOUNT_PATH || FIREBASE_SERVICE_ACCOUNT_PATH === "") {
      console.log(
        "⚠️ Firebase Admin not initialized (service account not set). Skipping."
      );
      return; // skip initialization
    }

    admin.initializeApp({
      credential: admin.credential.cert(
        require(FIREBASE_SERVICE_ACCOUNT_PATH)
      ),
    });

    console.log("✅ Firebase Admin initialized successfully.");
  }
}