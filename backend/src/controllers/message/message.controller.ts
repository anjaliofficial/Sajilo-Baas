// import { Request, Response } from "express";
// import MessageService from "../../services/message/message.service";
// import { getIoInstance, getOnlineUsers } from "../../socket";
// import Message from "../../models/message.model";

// const messageService = new MessageService();

// export const sendMessage = async (req: Request, res: Response) => {
//   if (!req.user)
//     return res.status(401).json({ success: false, message: "Unauthorized" });

//   try {
//     const { receiverId, listingId, content, media } = req.body;
//     const senderId = req.user._id.toString();
//     console.log(
//       `[sendMessage Controller] New message from ${senderId} to ${receiverId}:`,
//       {
//         listingId,
//         contentLength: content?.length || 0,
//         hasMedia: !!media,
//       },
//     );

//     const trimmedContent = typeof content === "string" ? content.trim() : "";
//     const hasMedia = Array.isArray(media) && media.length > 0;

//     if (!trimmedContent && !hasMedia) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Content or media is required" });
//     }

//     const message = await messageService.sendMessage(
//       senderId,
//       receiverId,
//       listingId,
//       trimmedContent,
//       media,
//     );

//     console.log(`[sendMessage Controller] Message saved to DB:`, {
//       messageId: message._id,
//       sender: message.sender,
//       receiver: message.receiver,
//       listing: message.listing,
//       content: message.content?.substring(0, 50),
//     });

//     // Emit Socket.io event to receiver if they're online
//     const io = getIoInstance();
//     const onlineUsers = getOnlineUsers();
//     const receiverSocketId = onlineUsers.get(receiverId);

//     if (io && receiverSocketId) {
//       console.log(`Emitting receiveMessage to ${receiverId} via Socket.io`);
//       io.to(receiverSocketId).emit("receiveMessage", message);
//     } else {
//       console.log(
//         `[sendMessage] Receiver ${receiverId} not online. Received socketId:`,
//         receiverSocketId,
//       );
//     }

//     res.status(201).json({ success: true, data: message });
//   } catch (error: any) {
//     console.error("Error sending message:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const getConversation = async (req: Request, res: Response) => {
//   if (!req.user)
//     return res.status(401).json({ success: false, message: "Unauthorized" });

//   const { otherUserId: rawOtherUserId } = req.params;
//   const rawListingId = req.params.listingId;
//   const otherUserId =
//     rawOtherUserId === "undefined" || rawOtherUserId === "null"
//       ? ""
//       : rawOtherUserId;
//   const listingId =
//     rawListingId === "undefined" || rawListingId === "null"
//       ? "all"
//       : rawListingId;

//   if (!otherUserId) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Missing otherUserId" });
//   }
//   const limit = Number(req.query.limit || 20);
//   const cursor = req.query.cursor as string | undefined;

//   try {
//     const result = await messageService.getConversation(
//       req.user._id.toString(),
//       otherUserId,
//       listingId,
//       { limit, cursor },
//     );

//     res.json({
//       success: true,
//       data: result.messages,
//       nextCursor: result.nextCursor,
//     });
//   } catch (error: any) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const getThreads = async (req: Request, res: Response) => {
//   if (!req.user)
//     return res.status(401).json({ success: false, message: "Unauthorized" });

//   const limit = Number(req.query.limit || 6);
//   const cursor = req.query.cursor as string | undefined;
//   const scope = (req.query.scope as string | undefined) || "listing";

//   console.log(
//     `[getThreads Controller] User ${req.user._id} (${req.user._id.toString()}) fetching threads with scope: ${scope}`,
//   );

//   try {
//     // Debug: Check if user has any messages at all
//     const totalMessages = await Message.countDocuments({
//       $or: [{ sender: req.user._id }, { receiver: req.user._id }],
//     });
//     console.log(
//       `[getThreads Controller] Total messages for user ${req.user._id}:`,
//       totalMessages,
//     );

//     // Debug: List some message samples
//     const sampleMessages = await Message.find({
//       $or: [{ sender: req.user._id }, { receiver: req.user._id }],
//     })
//       .limit(3)
//       .lean();
//     console.log(
//       `[getThreads Controller] Sample messages:`,
//       JSON.stringify(sampleMessages, null, 2),
//     );

//     const result = await messageService.getThreads(req.user._id.toString(), {
//       limit,
//       cursor,
//       scope,
//     });
//     console.log(
//       `[getThreads Controller] Returning ${result.threads.length} threads:`,
//       JSON.stringify(result.threads, null, 2),
//     );
//     res.json({ success: true, ...result });
//   } catch (error: any) {
//     console.error("[getThreads Controller] Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const markConversationRead = async (req: Request, res: Response) => {
//   if (!req.user)
//     return res.status(401).json({ success: false, message: "Unauthorized" });

//   const { otherUserId: rawOtherUserId, listingId: rawListingId } = req.body;
//   const otherUserId =
//     rawOtherUserId === "undefined" || rawOtherUserId === "null"
//       ? ""
//       : rawOtherUserId;
//   const listingId =
//     rawListingId === "undefined" || rawListingId === "null"
//       ? "all"
//       : rawListingId;
//   if (!otherUserId || !listingId) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Missing required fields" });
//   }

//   try {
//     const result = await messageService.markConversationRead(
//       req.user._id.toString(),
//       otherUserId,
//       listingId,
//     );
//     res.json({ success: true, modifiedCount: result.modifiedCount });
//   } catch (error: any) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const editMessage = async (req: Request, res: Response) => {
//   if (!req.user)
//     return res.status(401).json({ success: false, message: "Unauthorized" });

//   const { messageId } = req.params;
//   const { content } = req.body;

//   if (!content || !content.trim()) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Content is required" });
//   }

//   try {
//     const message = await messageService.editMessage(
//       messageId,
//       req.user._id.toString(),
//       content.trim(),
//     );
//     res.json({ success: true, data: message });
//   } catch (error: any) {
//     const status = error.message.includes("Unauthorized")
//       ? 403
//       : error.message.includes("not found")
//         ? 404
//         : 500;
//     res.status(status).json({ success: false, message: error.message });
//   }
// };

// export const deleteMessage = async (req: Request, res: Response) => {
//   if (!req.user)
//     return res.status(401).json({ success: false, message: "Unauthorized" });

//   const { messageId } = req.params;
//   const { deleteType } = req.body; // "for_me" or "for_everyone"

//   console.log("[DELETE] Received delete request:", {
//     messageId,
//     deleteType,
//     params: req.params,
//     body: req.body,
//     pathname: req.path,
//     baseUrl: req.baseUrl,
//   });

//   if (!deleteType || !["for_me", "for_everyone"].includes(deleteType)) {
//     return res.status(400).json({
//       success: false,
//       message: 'Delete type must be "for_me" or "for_everyone"',
//     });
//   }

//   try {
//     console.log("[DELETE] Calling messageService.deleteMessage with:", {
//       messageId,
//       userId: req.user._id.toString(),
//       deleteType,
//     });

//     const result = await messageService.deleteMessage(
//       messageId,
//       req.user._id.toString(),
//       deleteType,
//     );

//     console.log("[DELETE] Delete successful:", result);
//     res.json({ success: true, data: result });
//   } catch (error: any) {
//     console.error("[DELETE] Error:", error.message);
//     const status = error.message.includes("Unauthorized")
//       ? 403
//       : error.message.includes("not found")
//         ? 404
//         : error.message.includes("time limit")
//           ? 400
//           : 500;
//     res.status(status).json({ success: false, message: error.message });
//   }
// };

import { Request, Response } from "express";
import MessageService from "../../services/message/message.service";
import { getIoInstance, getOnlineUsers } from "../../socket";
import Message from "../../models/message.model";
import { UserModel } from "../../models/user.model";
import { sendPushNotification } from "../../services/notification/notification.service"; // Import push notification service

const messageService = new MessageService();

// ======================= SEND MESSAGE =======================
export const sendMessage = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const { receiverId, listingId, content, media } = req.body;
    const senderId = req.user._id.toString();

    const trimmedContent = typeof content === "string" ? content.trim() : "";
    const hasMedia = Array.isArray(media) && media.length > 0;

    if (!trimmedContent && !hasMedia) {
      return res
        .status(400)
        .json({ success: false, message: "Content or media is required" });
    }

    // Save message in database
    const message = await messageService.sendMessage(
      senderId,
      receiverId,
      listingId,
      trimmedContent,
      media,
    );

    // ================= SOCKET.IO EMIT =================
    const io = getIoInstance();
    const onlineUsers = getOnlineUsers();
    const receiverSocketId = onlineUsers.get(receiverId);

    if (io && receiverSocketId) {
      // Emit event to receiver if online
      io.to(receiverSocketId).emit("receiveMessage", message);
    }

    // ================= PUSH NOTIFICATION =================
    // Fetch receiver user
    const receiver = await UserModel.findById(receiverId);
    if (receiver && receiver.fcmTokens && receiver.fcmTokens.length > 0) {
      // Send push notification
      await sendPushNotification(
        receiver.fcmTokens,
        "New Message",
        `New message from ${req.user.fullName}`,
        { type: "chat", senderId: senderId, listingId: listingId },
      );
    }

    res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    console.error("[sendMessage] Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================= GET CONVERSATION =======================
export const getConversation = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const { otherUserId: rawOtherUserId } = req.params;
  const rawListingId = req.params.listingId;
  const otherUserId =
    rawOtherUserId === "undefined" || rawOtherUserId === "null"
      ? ""
      : rawOtherUserId;
  const listingId =
    rawListingId === "undefined" || rawListingId === "null"
      ? "all"
      : rawListingId;

  if (!otherUserId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing otherUserId" });
  }
  const limit = Number(req.query.limit || 20);
  const cursor = req.query.cursor as string | undefined;

  try {
    const result = await messageService.getConversation(
      req.user._id.toString(),
      otherUserId,
      listingId,
      { limit, cursor },
    );

    res.json({
      success: true,
      data: result.messages,
      nextCursor: result.nextCursor,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================= GET THREADS =======================
export const getThreads = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const limit = Number(req.query.limit || 6);
  const cursor = req.query.cursor as string | undefined;
  const scope = (req.query.scope as string | undefined) || "listing";

  try {
    const result = await messageService.getThreads(req.user._id.toString(), {
      limit,
      cursor,
      scope,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[getThreads] Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================= MARK CONVERSATION AS READ =======================
export const markConversationRead = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const { otherUserId: rawOtherUserId, listingId: rawListingId } = req.body;
  const otherUserId =
    rawOtherUserId === "undefined" || rawOtherUserId === "null"
      ? ""
      : rawOtherUserId;
  const listingId =
    rawListingId === "undefined" || rawListingId === "null"
      ? "all"
      : rawListingId;
  if (!otherUserId || !listingId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    const result = await messageService.markConversationRead(
      req.user._id.toString(),
      otherUserId,
      listingId,
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================= EDIT MESSAGE =======================
export const editMessage = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const { messageId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Content is required" });
  }

  try {
    const message = await messageService.editMessage(
      messageId,
      req.user._id.toString(),
      content.trim(),
    );
    res.json({ success: true, data: message });
  } catch (error: any) {
    const status = error.message.includes("Unauthorized")
      ? 403
      : error.message.includes("not found")
        ? 404
        : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// ======================= DELETE MESSAGE =======================
export const deleteMessage = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const { messageId } = req.params;
  const { deleteType } = req.body; // "for_me" or "for_everyone"

  if (!deleteType || !["for_me", "for_everyone"].includes(deleteType)) {
    return res.status(400).json({
      success: false,
      message: 'Delete type must be "for_me" or "for_everyone"',
    });
  }

  try {
    const result = await messageService.deleteMessage(
      messageId,
      req.user._id.toString(),
      deleteType,
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    const status = error.message.includes("Unauthorized")
      ? 403
      : error.message.includes("not found")
        ? 404
        : error.message.includes("time limit")
          ? 400
          : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
