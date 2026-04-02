import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { MessageAccessService } from "../services/message-access.service";

const messageAccessService = new MessageAccessService();

export class MessageAccessController {
  // ======================
  // QUERY MESSAGE METADATA (Admin Only)
  // ======================
  /**
   * 🔐 Privacy-First Query
   * Admins can filter by: user ID, date range, message type
   * Admins CANNOT search by message content
   */
  async queryMessageMetadata(req: AuthRequest, res: Response) {
    try {
      const {
        senderId,
        receiverId,
        messageType,
        startDate,
        endDate,
        page = "1",
        limit = "20",
      } = req.query;

      const result = await messageAccessService.queryMessageMetadata({
        senderId: senderId as string,
        receiverId: receiverId as string,
        messageType: messageType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: Number(page),
        limit: Number(limit),
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ======================
  // GET USER MESSAGE ACTIVITY (Admin Only)
  // ======================
  /**
   * Monitor user message activity (metadata only)
   * Shows: message count, types breakdown
   * Does NOT show: message content or specifics
   */
  async getUserMessageActivity(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const activity =
        await messageAccessService.getUserMessageActivity(userId);

      res.json({
        success: true,
        activity,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
