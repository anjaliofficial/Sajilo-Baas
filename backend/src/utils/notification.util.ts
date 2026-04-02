import * as admin from "firebase-admin";
import { ensureFirebaseAdminInitialized } from "./firebase-admin";

ensureFirebaseAdminInitialized();

export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, any> = {},
): Promise<void> {
  if (!tokens || tokens.length === 0) return;
  if (!admin.apps.length) return;

  try {
    let successCount = 0;
    let failureCount = 0;
    for (const [idx, token] of tokens.entries()) {
      const message: admin.messaging.Message = {
        token,
        notification: { title, body },
        data: Object.keys(data).reduce(
          (acc, key) => {
            acc[key] =
              typeof data[key] === "string"
                ? data[key]
                : JSON.stringify(data[key]);
            return acc;
          },
          {} as Record<string, string>,
        ),
        android: { priority: "high" },
        apns: {
          headers: { "apns-priority": "10" },
          payload: { aps: { sound: "default" } },
        },
      };
      try {
        await admin.messaging().send(message);
        successCount++;
      } catch (err) {
        failureCount++;
        console.warn(`[Notification] Failed token: ${token}, error: ${err}`);
      }
    }
    console.log(
      `[Notification] Sent to ${successCount}/${tokens.length} devices`,
    );
  } catch (error) {
    console.error("[Notification] Error sending push notification:", error);
  }
}
