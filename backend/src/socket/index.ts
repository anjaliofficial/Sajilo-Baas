import { Server, Socket } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { UserService } from "../services/user.service";
import MessageService from "../services/message/message.service";
import { MessageStatus } from "../models/message.model";
import { sendPushNotification } from "../utils/notification.util";

const userService = new UserService();
const messageService = new MessageService();

// Track online users: userId => socketId
const onlineUsers = new Map<string, string>();

// Global Socket.io instance for use in controllers
let ioInstance: Server | null = null;

export const getIoInstance = () => ioInstance;
export const getOnlineUsers = () => onlineUsers;

export const initSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

      const user = await userService.getUserById(decoded.id);
      if (!user) return next(new Error("Unauthorized"));

      socket.data.user = user;
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user._id.toString();
    console.log("Socket connected:", userId);

    // Mark user as online
    onlineUsers.set(userId, socket.id);
    io.emit("userOnline", userId);

    // Join personal room for direct messaging
    socket.join(`user:${userId}`);

    // Join listing room
    socket.on("joinRoom", (listingId: string) => {
      socket.join(`listing:${listingId}`);
      console.log(`User ${userId} joined listing:${listingId}`);
    });

    // // Send message
    // socket.on(
    //   "sendMessage",
    //   async ({ receiverId, listingId, content, media, tempId }) => {
    //     try {
    //       console.log(`[Socket sendMessage] From ${userId} to ${receiverId}:`, {
    //         listingId,
    //         contentLength: content?.length || 0,
    //         hasMedia: !!media,
    //         tempId,
    //       });

    //       const message = await messageService.sendMessage(
    //         userId,
    //         receiverId,
    //         listingId,
    //         content,
    //         media,
    //       );

    //       console.log(`[Socket sendMessage] Message created:`, {
    //         messageId: message._id,
    //         status: message.status,
    //       });

    //       // Send to sender (confirmation)
    //       socket.emit("messageSent", {
    //         tempId,
    //         message,
    //       });

    //       // Send to receiver
    //       const receiverSocketId = onlineUsers.get(receiverId);
    //       console.log(
    //         `[Socket sendMessage] Looking for receiver ${receiverId}:`,
    //         {
    //           socketId: receiverSocketId,
    //           isOnline: !!receiverSocketId,
    //         },
    //       );

    //       if (receiverSocketId) {
    //         console.log(
    //           `[Socket sendMessage] Emitting receiveMessage to receiver ${receiverId}:`,
    //           {
    //             messageId: message._id,
    //             sender: message.sender,
    //             receiver: message.receiver,
    //           },
    //         );
    //         // Convert to plain object for socket emission
    //         const messageObj = message.toObject ? message.toObject() : message;
    //         io.to(receiverSocketId).emit("receiveMessage", messageObj);

    //         // Auto-update to delivered if receiver is online
    //         setTimeout(async () => {
    //           await messageService.updateMessageStatus(
    //             message._id.toString(),
    //             MessageStatus.DELIVERED,
    //           );
    //           socket.emit("messageStatusUpdate", {
    //             messageId: message._id.toString(),
    //             status: MessageStatus.DELIVERED,
    //           });
    //           io.to(receiverSocketId).emit("messageStatusUpdate", {
    //             messageId: message._id.toString(),
    //             status: MessageStatus.DELIVERED,
    //           });
    //         }, 100);
    //       } else {
    //         console.log(
    //           `[Socket sendMessage] Receiver ${receiverId} not online. Message saved to DB but not emitted via socket.`,
    //         );
    //       }
    //     } catch (error: any) {
    //       console.error(`[Socket sendMessage] Error: ${error.message}`, error);
    //       socket.emit("messageError", {
    //         tempId,
    //         error: error.message,
    //       });
    //     }
    //   },
    // );

    socket.on(
      "sendMessage",
      async ({ receiverId, listingId, content, media, tempId }) => {
        try {
          console.log(`[Socket sendMessage] From ${userId} to ${receiverId}:`, {
            listingId,
            contentLength: content?.length || 0,
            hasMedia: !!media,
            tempId,
          });

          // 1️⃣ Save the message in DB
          const message = await messageService.sendMessage(
            userId,
            receiverId,
            listingId,
            content,
            media,
          );

          console.log(`[Socket sendMessage] Message created:`, {
            messageId: message._id,
            status: message.status,
          });

          // 2️⃣ Emit confirmation to sender
          socket.emit("messageSent", {
            tempId,
            message,
          });

          // 3️⃣ Emit to receiver if online
          const receiverSocketId = onlineUsers.get(receiverId);
          if (receiverSocketId) {
            const messageObj = message.toObject ? message.toObject() : message;
            io.to(receiverSocketId).emit("receiveMessage", messageObj);
            // Emit a notification event as well
            io.to(receiverSocketId).emit("notification", {
              type: "message",
              message: `New message from ${socket.data.user.name}`,
              data: {
                messageId: message._id.toString(),
                senderId: userId,
                listingId,
              },
              link: `/dashboard/customer/messages/${userId}/${listingId || "all"}`,
              createdAt: new Date().toISOString(),
            });

            // Auto-update to delivered
            setTimeout(async () => {
              await messageService.updateMessageStatus(
                message._id.toString(),
                MessageStatus.DELIVERED,
              );
              socket.emit("messageStatusUpdate", {
                messageId: message._id.toString(),
                status: MessageStatus.DELIVERED,
              });
              io.to(receiverSocketId).emit("messageStatusUpdate", {
                messageId: message._id.toString(),
                status: MessageStatus.DELIVERED,
              });
            }, 100);
          } else {
            console.log(
              `[Socket sendMessage] Receiver ${receiverId} offline. Sending FCM notification.`,
            );

            // 4️⃣ Receiver offline → send FCM push
            const receiver = await userService.getUserById(receiverId);
            if (receiver?.fcmTokens?.length) {
              await sendPushNotification(
                receiver.fcmTokens,
                `New message from ${socket.data.user.name}`,
                content?.slice(0, 100) || "Sent a message",
                {
                  messageId: message._id.toString(),
                  senderId: userId,
                  listingId,
                },
              );
              console.log(
                `[Socket sendMessage] FCM notification sent to receiver ${receiverId}`,
              );
            }
          }
        } catch (error: any) {
          console.error(`[Socket sendMessage] Error: ${error.message}`, error);
          socket.emit("messageError", {
            tempId,
            error: error.message,
          });
        }
      },
    );

    // Message delivered acknowledgment
    socket.on("messageDelivered", async (messageId: string) => {
      try {
        const message = await messageService.updateMessageStatus(
          messageId,
          MessageStatus.DELIVERED,
        );
        if (message) {
          const senderSocketId = onlineUsers.get(
            message.sender._id?.toString() || "",
          );
          if (senderSocketId) {
            io.to(senderSocketId).emit("messageStatusUpdate", {
              messageId,
              status: MessageStatus.DELIVERED,
            });
          }
        }
      } catch (error) {
        console.error("Error updating message status:", error);
      }
    });

    // Message read acknowledgment
    socket.on("messageRead", async (messageId: string) => {
      try {
        const message = await messageService.updateMessageStatus(
          messageId,
          MessageStatus.READ,
        );
        if (message) {
          const senderSocketId = onlineUsers.get(
            message.sender._id?.toString() || "",
          );
          if (senderSocketId) {
            io.to(senderSocketId).emit("messageStatusUpdate", {
              messageId,
              status: MessageStatus.READ,
            });
          }
        }
      } catch (error) {
        console.error("Error updating message status:", error);
      }
    });

    // Edit message
    socket.on("editMessage", async ({ messageId, content }) => {
      try {
        const message = (await messageService.editMessage(
          messageId,
          userId,
          content,
        )) as any;

        // Notify both users
        socket.emit("messageEdited", message);
        if (message) {
          const receiverSocketId = onlineUsers.get(
            message.receiver._id?.toString() || "",
          );
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageEdited", message);
          }
        }
      } catch (error: any) {
        socket.emit("messageError", {
          messageId,
          error: error.message,
        });
      }
    });

    // Delete message
    socket.on("deleteMessage", async ({ messageId, deleteType }) => {
      console.log(
        `Delete message event received: ${messageId}, type: ${deleteType}, userId: ${userId}`,
      );
      try {
        const result = await messageService.deleteMessage(
          messageId,
          userId,
          deleteType,
        );
        console.log(`Delete message result:`, result);

        if (deleteType === "for_everyone" && result.message) {
          // Notify both users
          console.log(`Emitting messageDeleted for_everyone to sender`);
          socket.emit("messageDeleted", {
            messageId,
            deleteType,
            message: result.message,
          });
          const otherUserId =
            result.message.sender._id?.toString() === userId
              ? result.message.receiver._id?.toString()
              : result.message.sender._id?.toString();
          const otherSocketId = onlineUsers.get(otherUserId || "");
          if (otherSocketId) {
            console.log(`Notifying other user ${otherUserId} about deletion`);
            io.to(otherSocketId).emit("messageDeleted", {
              messageId,
              deleteType,
              message: result.message,
            });
          }
        } else if (deleteType === "for_me") {
          // Only notify this user
          console.log(`Emitting messageDeleted for_me`);
          socket.emit("messageDeleted", {
            messageId,
            deleteType: "for_me",
          });
        }
      } catch (error: any) {
        console.error(`Error deleting message ${messageId}:`, error.message);
        socket.emit("messageError", {
          messageId,
          error: error.message,
        });
      }
    });

    // Bulk read messages in conversation
    socket.on(
      "markConversationRead",
      async ({ otherUserId, listingId }: any) => {
        try {
          await messageService.markConversationRead(
            userId,
            otherUserId,
            listingId,
          );

          // Notify the other user that messages were read
          const otherSocketId = onlineUsers.get(otherUserId);
          if (otherSocketId) {
            io.to(otherSocketId).emit("conversationRead", {
              userId,
              listingId,
            });
          }
        } catch (error) {
          console.error("Error marking conversation as read:", error);
        }
      },
    );

    // User typing indicator
    socket.on("typing", ({ receiverId, listingId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", {
          userId,
          listingId,
        });
      }
    });

    socket.on("stopTyping", ({ receiverId, listingId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userStoppedTyping", {
          userId,
          listingId,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", userId);
      onlineUsers.delete(userId);
      io.emit("userOffline", userId);
    });
  });

  return io;
};
