import io, { Socket } from "socket.io-client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";

let socket: Socket | null = null;
let lastSocketErrorMessage = "";

export const initSocket = (token?: string) => {
  if (!token) {
    console.warn("[Socket] Missing token, socket initialization skipped");
    return null;
  }

  if (socket?.connected) {
    console.log("[Socket] Already connected, reusing socket");
    return socket;
  }

  console.log("[Socket] Initializing socket with API_BASE:", API_BASE);
  const socketOptions: any = {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1500,
    reconnectionAttempts: 2,
  };

  socket = io(API_BASE, socketOptions);

  socket.on("connect", () => {
    console.log("[Socket] Connected successfully");
  });

  socket.on("disconnect", () => {
    console.log("[Socket] Disconnected");
  });

  socket.on("connect_error", (error: any) => {
    const message = error?.message || String(error);
    if (message !== lastSocketErrorMessage) {
      console.warn("[Socket] Connection error:", message);
      lastSocketErrorMessage = message;
    }
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};

// Event emitters
export const sendMessage = (data: {
  receiverId: string;
  listingId: string;
  content?: string;
  media?: {
    url: string;
    mimeType: string;
    kind: "image" | "video";
    fileName?: string;
  }[];
  tempId: string;
}) => {
  if (socket?.connected) {
    socket.emit("sendMessage", data);
  }
};

export const markMessageAsDelivered = (messageId: string) => {
  if (socket?.connected) {
    socket.emit("messageDelivered", messageId);
  }
};

export const markMessageAsRead = (messageId: string) => {
  if (socket?.connected) {
    socket.emit("messageRead", messageId);
  }
};

export const editMessage = (messageId: string, content: string) => {
  if (socket?.connected) {
    socket.emit("editMessage", { messageId, content });
  }
};

export const deleteMessage = (
  messageId: string,
  deleteType: "for_me" | "for_everyone",
) => {
  if (socket?.connected) {
    socket.emit("deleteMessage", { messageId, deleteType });
  }
};

export const markConversationRead = (
  otherUserId: string,
  listingId: string,
) => {
  if (socket?.connected) {
    socket.emit("markConversationRead", { otherUserId, listingId });
  }
};

export const joinRoom = (listingId: string) => {
  if (socket?.connected) {
    socket.emit("joinRoom", listingId);
  }
};

export const startTyping = (receiverId: string, listingId: string) => {
  if (socket?.connected) {
    socket.emit("typing", { receiverId, listingId });
  }
};

export const stopTyping = (receiverId: string, listingId: string) => {
  if (socket?.connected) {
    socket.emit("stopTyping", { receiverId, listingId });
  }
};
