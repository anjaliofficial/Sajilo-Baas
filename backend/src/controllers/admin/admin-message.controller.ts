import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import MessageService from "../../services/message/message.service";

const messageService = new MessageService();

export class AdminMessageController {
  // ======================
  // GET ALL MESSAGES
  // ======================
  async getAllMessages(req: AuthRequest, res: Response) {
    try {
      const {
        limit = "20",
        cursor,
        userId,
        search,
        listingId,
        dateFrom,
        dateTo,
      } = req.query;

      const result = await messageService.getAllMessages({
        limit: Number(limit),
        cursor: cursor as string,
        userId: userId as string,
        search: search as string,
        listingId: listingId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      });

      res.json({
        success: true,
        messages: result.messages,
        nextCursor: result.nextCursor,
      });
    } catch (error: any) {
      console.error("[getAllMessages] Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ======================
  // SEARCH MESSAGES
  // ======================
  async searchMessages(req: AuthRequest, res: Response) {
    try {
      const { query, limit = "20", cursor, userId } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const result = await messageService.searchMessages(query as string, {
        limit: Number(limit),
        cursor: cursor as string,
        userId: userId as string,
      });

      res.json({
        success: true,
        messages: result.messages,
        nextCursor: result.nextCursor,
      });
    } catch (error: any) {
      console.error("[searchMessages] Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ======================
  // GET CONVERSATION BETWEEN TWO USERS
  // ======================
  async getConversationBetweenUsers(req: AuthRequest, res: Response) {
    try {
      const { userId1, userId2 } = req.params;
      const { limit = "50", cursor } = req.query;

      if (!userId1 || !userId2) {
        return res.status(400).json({
          success: false,
          message: "Both userId1 and userId2 are required",
        });
      }

      const result = await messageService.getConversationBetweenUsers(
        userId1,
        userId2,
        {
          limit: Number(limit),
          cursor: cursor as string,
        },
      );

      res.json({
        success: true,
        messages: result.messages,
        nextCursor: result.nextCursor,
      });
    } catch (error: any) {
      console.error("[getConversationBetweenUsers] Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ======================
  // GET USER'S ALL CONVERSATIONS
  // ======================
  async getUserConversations(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { limit = "20", cursor } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const result = await messageService.getUserAllConversations(userId, {
        limit: Number(limit),
        cursor: cursor as string,
      });

      res.json({
        success: true,
        conversations: result.conversations,
        nextCursor: result.nextCursor,
      });
    } catch (error: any) {
      console.error("[getUserConversations] Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
