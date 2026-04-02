import mongoose from "mongoose";
import Message, {
  IMessage,
  MessageStatus,
  DeleteType,
  MessageType,
} from "../../models/message.model";
import { UserModel } from "../../models/user.model";

// Edit time limit: 15 minutes
const EDIT_TIME_LIMIT_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

export default class MessageService {
  async sendMessage(
    senderId: string,
    receiverId: string,
    listingId: string,
    content: string,
    media?: {
      url: string;
      mimeType: string;
      kind: "image" | "video";
      fileName?: string;
    }[],
  ): Promise<IMessage> {
    const trimmedContent = content?.trim() || "";
    const hasMedia = Array.isArray(media) && media.length > 0;
    const type = hasMedia ? MessageType.MEDIA : MessageType.TEXT;

    // Normalize listingId: convert "all" or invalid values to null
    const normalizedListingId =
      !listingId ||
      listingId === "all" ||
      listingId === "undefined" ||
      listingId === "null"
        ? null
        : listingId;

    const message = (await Message.create({
      sender: senderId,
      receiver: receiverId,
      ...(normalizedListingId && { listing: normalizedListingId }),
      content: trimmedContent,
      type,
      media: hasMedia ? media : undefined,
      status: MessageStatus.SENT,
    })) as any;

    console.log(`[sendMessage] Message created:`, {
      messageId: message._id,
      sender: senderId,
      receiver: receiverId,
      listing: normalizedListingId,
      content: trimmedContent,
    });

    // Populate sender and receiver info
    await message.populate([
      { path: "sender", select: "fullName profilePicture email" },
      { path: "receiver", select: "fullName profilePicture email" },
    ]);

    // --- Notification logic ---
    try {
      const { NotificationModel } = require("../../models/notification.model");
      const {
        sendSocketNotification,
      } = require("../notification/notification.service");
      const { UserModel } = require("../../models/user.model");
      const senderUser = await UserModel.findById(senderId).select("fullName");
      const senderName = senderUser?.fullName || "Someone";
      // You can adjust the link as needed for your frontend
      const chatLink = `/dashboard/messages/${senderId}`;
      const notification = await NotificationModel.create({
        user: receiverId,
        message: `Message sent by ${senderName}`,
        link: chatLink,
      });
      sendSocketNotification(String(receiverId), {
        ...notification.toObject(),
        _id: notification._id.toString(),
      });
    } catch (err) {
      console.error("[sendMessage] Error sending notification:", err);
    }

    // --- FCM push notification logic ---
    try {
      const receiverUser = await UserModel.findById(receiverId);
      const fcmTokens = receiverUser?.fcmTokens || [];
      // Define senderName for FCM notification
      let senderName: string;
      if (typeof message.sender === "object" && message.sender?.fullName) {
        senderName = message.sender.fullName;
      } else {
        const senderUser =
          await UserModel.findById(senderId).select("fullName");
        senderName = senderUser?.fullName || "Someone";
      }
      if (fcmTokens.length > 0) {
        const {
          sendPushNotification,
        } = require("../notification/notification.service");
        await sendPushNotification(
          fcmTokens,
          "New Message",
          `Message sent by ${senderName}`,
          { messageId: message._id.toString(), senderId },
        );
      }
    } catch (err) {
      console.error("FCM push notification failed (message):", err);
    }

    return message;
  }

  async getConversation(
    userId: string,
    otherUserId: string,
    listingId: string,
    options?: { limit?: number; cursor?: string },
  ) {
    const limit = Math.max(1, Math.min(options?.limit || 20, 100));
    let cursorDate: Date | null = null;
    let cursorId: mongoose.Types.ObjectId | null = null;

    if (options?.cursor) {
      const [dateStr, idStr] = options.cursor.split("|");
      if (dateStr && idStr) {
        cursorDate = new Date(dateStr);
        cursorId = new mongoose.Types.ObjectId(idStr);
      }
    }

    const baseQuery: any = {
      $and: [
        {
          $or: [
            { sender: userId, receiver: otherUserId },
            { sender: otherUserId, receiver: userId },
          ],
        },
        {
          // Only show messages not deleted for this specific user
          deletedFor: { $ne: new mongoose.Types.ObjectId(userId) },
        },
      ],
    };

    const normalizedListingId =
      !listingId ||
      listingId === "all" ||
      listingId === "undefined" ||
      listingId === "null"
        ? null
        : listingId;

    if (normalizedListingId) {
      baseQuery.$and.push({ listing: normalizedListingId });
    } else {
      // For "all" conversations, include messages where listing is null
      baseQuery.$and.push({
        $or: [{ listing: null }, { listing: { $exists: false } }],
      });
    }

    if (cursorDate && cursorId) {
      baseQuery.$and.push({
        $or: [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: cursorId } },
        ],
      });
    }

    const results = await Message.find(baseQuery)
      .populate({ path: "sender", select: "fullName profilePicture email" })
      .populate({ path: "receiver", select: "fullName profilePicture email" })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const page = hasMore ? results.slice(0, limit) : results;
    const oldest = page[page.length - 1];
    const nextCursor =
      hasMore && oldest
        ? `${new Date(oldest.createdAt).toISOString()}|${oldest._id}`
        : null;

    return { messages: page.reverse(), nextCursor };
  }

  async getThreads(
    userId: string,
    options?: { limit?: number; cursor?: string; scope?: string },
  ) {
    const limit = Math.max(1, Math.min(options?.limit || 6, 50));
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const scope = options?.scope || "listing";

    console.log(
      `[getThreads Service] Called for userId: ${userId}, userObjectId: ${userObjectId}, scope: ${scope}`,
    );

    // DEBUG: Check if this user has ANY messages at all
    const totalMessages = await Message.countDocuments({
      $or: [{ sender: userObjectId }, { receiver: userObjectId }],
    });
    console.log(
      `[getThreads Service] User ${userId} has ${totalMessages} total messages (as sender or receiver)`,
    );

    if (totalMessages > 0) {
      // Show sample of messages
      const sampleMsgs = await Message.find({
        $or: [{ sender: userObjectId }, { receiver: userObjectId }],
      })
        .limit(2)
        .lean();
      console.log(
        `[getThreads Service] Sample messages:`,
        sampleMsgs.map((m) => ({
          _id: m._id,
          sender: m.sender,
          receiver: m.receiver,
          listing: m.listing,
          content:
            typeof m.content === "string"
              ? m.content.substring(0, 30)
              : m.content,
        })),
      );
    }

    let cursorDate: Date | null = null;
    let cursorId: mongoose.Types.ObjectId | null = null;
    if (options?.cursor) {
      const [dateStr, idStr] = options.cursor.split("|");
      if (dateStr && idStr) {
        cursorDate = new Date(dateStr);
        cursorId = new mongoose.Types.ObjectId(idStr);
      }
    }

    const pipeline: any[] = [
      {
        $match: {
          $or: [{ sender: userObjectId }, { receiver: userObjectId }],
        },
      },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ["$sender", userObjectId] }, "$receiver", "$sender"],
          },
        },
      },
      {
        $group: {
          _id:
            scope === "all"
              ? { otherUser: "$otherUser" }
              : {
                  listing: { $ifNull: ["$listing", null] },
                  otherUser: "$otherUser",
                },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", userObjectId] },
                    { $eq: ["$read", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    if (cursorDate && cursorId) {
      pipeline.push({
        $match: {
          $or: [
            { "lastMessage.createdAt": { $lt: cursorDate } },
            {
              "lastMessage.createdAt": cursorDate,
              "lastMessage._id": { $lt: cursorId },
            },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { "lastMessage.createdAt": -1, "lastMessage._id": -1 } },
      { $limit: limit + 1 },
      {
        $lookup: {
          from: "users",
          localField: "_id.otherUser",
          foreignField: "_id",
          as: "otherUser",
        },
      },
      { $unwind: "$otherUser" },
      {
        $lookup: {
          from: "listings",
          localField: scope === "all" ? "lastMessage.listing" : "_id.listing",
          foreignField: "_id",
          as: "listing",
        },
      },
      { $unwind: { path: "$listing", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          otherUserId: "$_id.otherUser",
          listingId:
            scope === "all"
              ? { $ifNull: ["$listing._id", "all"] }
              : { $ifNull: ["$_id.listing", "all"] },
          otherUserName: "$otherUser.fullName",
          otherUserImage: "$otherUser.profilePicture",
          listingTitle: { $ifNull: ["$listing.title", "All Listings"] },
          lastMessage: 1,
          unreadCount: 1,
        },
      },
    );

    console.log(
      `[getThreads Service] User: ${userId}, userObjectId: ${userObjectId.toString()}, Executing aggregation pipeline with ${pipeline.length} stages`,
    );

    // Log the first match stage to see what we're matching
    console.log(
      `[getThreads Service] Match stage will find messages where sender OR receiver equals: ${userObjectId.toString()}`,
    );

    const results = await Message.aggregate(pipeline);

    console.log(
      `[getThreads Service] Pipeline returned ${results.length} results for user ${userId}`,
    );

    if (results.length > 0) {
      console.log(
        `[getThreads Service] First result:`,
        JSON.stringify(results[0], null, 2),
      );
    } else {
      console.log(
        `[getThreads Service] NO RESULTS! Checking raw messages before aggregation...`,
      );
      const rawMessages = await Message.find({
        $or: [{ sender: userObjectId }, { receiver: userObjectId }],
      }).limit(5);
      console.log(
        `[getThreads Service] Raw messages found:`,
        JSON.stringify(rawMessages, null, 2),
      );
    }
    const hasMore = results.length > limit;
    const threads = hasMore ? results.slice(0, limit) : results;
    const last = threads[threads.length - 1];
    const nextCursor =
      hasMore && last?.lastMessage
        ? `${new Date(last.lastMessage.createdAt).toISOString()}|${last.lastMessage._id}`
        : null;

    return { threads, nextCursor };
  }

  async markConversationRead(
    userId: string,
    otherUserId: string,
    listingId: string,
  ) {
    const query: any = {
      sender: otherUserId,
      receiver: userId,
      read: false,
    };

    const normalizedListingId =
      !listingId ||
      listingId === "all" ||
      listingId === "undefined" ||
      listingId === "null"
        ? null
        : listingId;

    if (normalizedListingId) {
      query.listing = normalizedListingId;
    } else {
      // For "all" conversations, mark all messages as read where listing is null
      query.$or = [{ listing: null }, { listing: { $exists: false } }];
    }

    return Message.updateMany(query, { $set: { read: true } });
  }

  async editMessage(
    messageId: string,
    userId: string,
    newContent: string,
  ): Promise<IMessage | null> {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.sender.toString() !== userId) {
      throw new Error("Unauthorized: You can only edit your own messages");
    }

    if ((message as any).type === MessageType.MEDIA) {
      throw new Error("Media messages cannot be edited");
    }

    if (message.isDeleted) {
      throw new Error("Cannot edit a deleted message");
    }

    // Check if message is within edit time limit
    const messageAge = Date.now() - message.createdAt.getTime();
    if (messageAge > EDIT_TIME_LIMIT_MS) {
      throw new Error(
        "Edit time limit exceeded. You can only edit messages within 15 minutes.",
      );
    }

    message.content = newContent;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate([
      { path: "sender", select: "fullName profilePicture email" },
      { path: "receiver", select: "fullName profilePicture email" },
    ]);

    return message;
  }

  async deleteMessage(
    messageId: string,
    userId: string,
    deleteType: "for_me" | "for_everyone",
  ): Promise<{ message: IMessage | null; deleteType: string }> {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (deleteType === "for_everyone") {
      // Only sender can delete for everyone, and only within time limit
      if (message.sender.toString() !== userId) {
        throw new Error(
          "Unauthorized: You can only delete your own messages for everyone",
        );
      }

      const messageAge = Date.now() - message.createdAt.getTime();
      if (messageAge > EDIT_TIME_LIMIT_MS) {
        throw new Error(
          "Delete time limit exceeded. You can only delete for everyone within 15 minutes.",
        );
      }

      message.isDeleted = true;
      message.deleteType = DeleteType.FOR_EVERYONE;
      message.content = "This message was deleted";
      await message.save();
    } else {
      // Delete for me - add userId to deletedFor array
      if (!message.deletedFor.includes(userObjectId)) {
        message.deletedFor.push(userObjectId);
        await message.save();
      }
    }

    await message.populate([
      { path: "sender", select: "fullName profilePicture email" },
      { path: "receiver", select: "fullName profilePicture email" },
    ]);

    return { message, deleteType };
  }

  async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
  ): Promise<IMessage | null> {
    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          status,
          ...(status === MessageStatus.READ && { read: true }),
        },
      },
      { new: true },
    );

    if (message) {
      await message.populate([
        { path: "sender", select: "fullName profilePicture email" },
        { path: "receiver", select: "fullName profilePicture email" },
      ]);
    }

    return message;
  }

  // ==================== ADMIN METHODS ====================

  async getAllMessages(options?: {
    limit?: number;
    cursor?: string;
    userId?: string;
    search?: string;
    listingId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const limit = Math.max(1, Math.min(options?.limit || 20, 100));
    let cursorDate: Date | null = null;
    let cursorId: mongoose.Types.ObjectId | null = null;

    if (options?.cursor) {
      const [dateStr, idStr] = options.cursor.split("|");
      if (dateStr && idStr) {
        cursorDate = new Date(dateStr);
        cursorId = new mongoose.Types.ObjectId(idStr);
      }
    }

    const query: any = {};

    // Filter by user (sender or receiver)
    if (options?.userId) {
      const userObjectId = new mongoose.Types.ObjectId(options.userId);
      query.$or = [{ sender: userObjectId }, { receiver: userObjectId }];
    }

    // 🔒 PRIVACY: Disable content search for admins (metadata-only access)
    // if (options?.search) {
    //   query.content = { $regex: options.search, $options: "i" };
    // }

    // Filter by listing
    if (options?.listingId) {
      query.listing = new mongoose.Types.ObjectId(options.listingId);
    }

    // Date range filter
    if (options?.dateFrom || options?.dateTo) {
      query.createdAt = {};
      if (options.dateFrom) {
        query.createdAt.$gte = options.dateFrom;
      }
      if (options.dateTo) {
        query.createdAt.$lte = options.dateTo;
      }
    }

    // Cursor pagination
    if (cursorDate && cursorId) {
      if (!query.$or) query.$or = [];
      if (Array.isArray(query.$or)) {
        query.$or.push({
          createdAt: { $lt: cursorDate },
        });
        query.$or.push({
          createdAt: cursorDate,
          _id: { $lt: cursorId },
        });
      }
    }

    // 🔒 PRIVACY: Exclude content and media from admin view (metadata-only)
    const results = await Message.find(query)
      .select("-content -media")
      .populate({ path: "sender", select: "fullName profilePicture email" })
      .populate({ path: "receiver", select: "fullName profilePicture email" })
      .populate({ path: "listing", select: "title" })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = results.length > limit;
    const page = hasMore ? results.slice(0, limit) : results;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? `${new Date(last.createdAt).toISOString()}|${last._id}`
        : null;

    return { messages: page, nextCursor };
  }

  async searchMessages(
    keyword: string,
    options?: {
      limit?: number;
      cursor?: string;
      userId?: string;
    },
  ) {
    const limit = Math.max(1, Math.min(options?.limit || 20, 100));
    let cursorDate: Date | null = null;
    let cursorId: mongoose.Types.ObjectId | null = null;

    if (options?.cursor) {
      const [dateStr, idStr] = options.cursor.split("|");
      if (dateStr && idStr) {
        cursorDate = new Date(dateStr);
        cursorId = new mongoose.Types.ObjectId(idStr);
      }
    }

    // 🔒 PRIVACY: Disable content search for admins (not allowed to search by content)
    const query: any = {};

    if (options?.userId) {
      const userObjectId = new mongoose.Types.ObjectId(options.userId);
      query.$or = [{ sender: userObjectId }, { receiver: userObjectId }];
    }

    if (cursorDate && cursorId) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: cursorId } },
        ],
      });
    }

    // 🔒 PRIVACY: Exclude content and media from admin search results
    const results = await Message.find(query)
      .select("-content -media")
      .populate({ path: "sender", select: "fullName profilePicture email" })
      .populate({ path: "receiver", select: "fullName profilePicture email" })
      .populate({ path: "listing", select: "title" })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = results.length > limit;
    const page = hasMore ? results.slice(0, limit) : results;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? `${new Date(last.createdAt).toISOString()}|${last._id}`
        : null;

    return { messages: page, nextCursor };
  }

  async getConversationBetweenUsers(
    userId1: string,
    userId2: string,
    options?: {
      limit?: number;
      cursor?: string;
    },
  ) {
    const limit = Math.max(1, Math.min(options?.limit || 50, 100));
    let cursorDate: Date | null = null;
    let cursorId: mongoose.Types.ObjectId | null = null;

    if (options?.cursor) {
      const [dateStr, idStr] = options.cursor.split("|");
      if (dateStr && idStr) {
        cursorDate = new Date(dateStr);
        cursorId = new mongoose.Types.ObjectId(idStr);
      }
    }

    const user1Id = new mongoose.Types.ObjectId(userId1);
    const user2Id = new mongoose.Types.ObjectId(userId2);

    const query: any = {
      $or: [
        { sender: user1Id, receiver: user2Id },
        { sender: user2Id, receiver: user1Id },
      ],
    };

    if (cursorDate && cursorId) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: cursorId } },
        ],
      });
    }

    const results = await Message.find(query)
      .select("-content -media")
      .populate({ path: "sender", select: "fullName profilePicture email" })
      .populate({ path: "receiver", select: "fullName profilePicture email" })
      .populate({ path: "listing", select: "title" })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = results.length > limit;
    const page = hasMore ? results.slice(0, limit) : results;
    const oldest = page[page.length - 1];
    const nextCursor =
      hasMore && oldest
        ? `${new Date(oldest.createdAt).toISOString()}|${oldest._id}`
        : null;

    return { messages: page.reverse(), nextCursor };
  }

  async getUserAllConversations(
    userId: string,
    options?: { limit?: number; cursor?: string },
  ) {
    const limit = Math.max(1, Math.min(options?.limit || 20, 100));
    let cursorDate: Date | null = null;
    let cursorId: mongoose.Types.ObjectId | null = null;

    if (options?.cursor) {
      const [dateStr, idStr] = options.cursor.split("|");
      if (dateStr && idStr) {
        cursorDate = new Date(dateStr);
        cursorId = new mongoose.Types.ObjectId(idStr);
      }
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const pipeline: any[] = [
      {
        $match: {
          $or: [{ sender: userObjectId }, { receiver: userObjectId }],
        },
      },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ["$sender", userObjectId] }, "$receiver", "$sender"],
          },
        },
      },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $first: "$$ROOT" },
          messageCount: { $sum: 1 },
        },
      },
    ];

    if (cursorDate && cursorId) {
      pipeline.push({
        $match: {
          $or: [
            { "lastMessage.createdAt": { $lt: cursorDate } },
            {
              "lastMessage.createdAt": cursorDate,
              "lastMessage._id": { $lt: cursorId },
            },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { "lastMessage.createdAt": -1, "lastMessage._id": -1 } },
      { $limit: limit + 1 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "otherUserDetails",
        },
      },
      { $unwind: "$otherUserDetails" },
      {
        $project: {
          otherUserId: "$_id",
          otherUserName: "$otherUserDetails.fullName",
          otherUserEmail: "$otherUserDetails.email",
          otherUserImage: "$otherUserDetails.profilePicture",
          lastMessage: 1,
          messageCount: 1,
        },
      },
    );

    const results = await Message.aggregate(pipeline);

    const hasMore = results.length > limit;
    const conversations = hasMore ? results.slice(0, limit) : results;
    const last = conversations[conversations.length - 1];
    const nextCursor =
      hasMore && last?.lastMessage
        ? `${new Date(last.lastMessage.createdAt).toISOString()}|${last.lastMessage._id}`
        : null;

    return { conversations, nextCursor };
  }
}
