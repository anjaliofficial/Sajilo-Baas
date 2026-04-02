import admin from "firebase-admin";
import { ensureFirebaseAdminInitialized } from "../../utils/firebase-admin";
import { getIoInstance, getOnlineUsers } from "../../socket/index";

ensureFirebaseAdminInitialized();

/**
 * Send push notification via Firebase Cloud Messaging
 */
export async function sendPushNotification(
  fcmTokens: string[],
  title: string,
  body: string,
  data: Record<string, any> = {},
) {
  if (!fcmTokens || fcmTokens.length === 0) return;
  if (!admin.apps.length) return;

  const message: admin.messaging.MulticastMessage = {
    tokens: fcmTokens,
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [
        k,
        typeof v === "string" ? v : JSON.stringify(v),
      ]),
    ),
    android: { priority: "high" },
    apns: {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default" } },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(
      `[FCM] Sent: ${response.successCount}/${fcmTokens.length} succeeded`,
    );

    if (response.failureCount > 0) {
      response.responses.forEach(
        (r: admin.messaging.SendResponse, idx: number) => {
          if (!r.success) {
            console.warn(
              `[FCM] Failed token: ${fcmTokens[idx]}, error: ${r.error}`,
            );
          }
        },
      );
    }
  } catch (error) {
    console.error("[FCM] Error sending push notification:", error);
  }
}

/**
 * Send real-time notification via Socket.io
 */
export function sendSocketNotification(userId: string, payload: any) {
  const io = getIoInstance();
  if (!io) return;

  const onlineUsers = getOnlineUsers(); // Map<string, socketId>
  const socketId = onlineUsers.get(userId);

  if (socketId) {
    io.to(socketId).emit("notification", payload);
    console.log(`[Socket] Sent to ${userId}:`, payload);
  } else {
    console.log(`[Socket] User ${userId} not online`);
  }
}
