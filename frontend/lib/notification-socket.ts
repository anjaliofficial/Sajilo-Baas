import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "@/lib/auth/storage";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5050";
let hasLoggedMissingTokenWarning = false;
let lastConnectErrorMessage = "";

export function useNotificationSocket(onNotification: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      socketRef.current = null;
      if (!hasLoggedMissingTokenWarning) {
        console.warn(
          "[NotificationSocket] Missing token, socket connection skipped",
        );
        hasLoggedMissingTokenWarning = true;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 2,
      reconnectionDelay: 1500,
      auth: { token },
    });

    socket.on("connect_error", (error: any) => {
      const message = error?.message || String(error);
      if (message !== lastConnectErrorMessage) {
        console.warn("[NotificationSocket] connect_error:", message);
        lastConnectErrorMessage = message;
      }
    });

    socketRef.current = socket;

    socket.on("notification", onNotification);

    return () => {
      socket.disconnect();
    };
  }, [onNotification]);

  return socketRef;
}
