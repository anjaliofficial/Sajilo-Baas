import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ModeratorService } from "../services/moderator.service";
import { AuditAction } from "../models/audit-log.model";

const moderatorService = new ModeratorService();

export class ModeratorController {
  // ======================
  // MUTE USER
  // ======================
  async muteUser(req: AuthRequest, res: Response) {
    try {
      const { userId, hours = 24, reason } = req.body;

      if (!userId || !reason) {
        return res.status(400).json({
          success: false,
          message: "userId and reason are required",
        });
      }

      const restriction = await moderatorService.muteUser(
        userId,
        hours,
        reason,
        req.user._id.toString(),
      );

      res.json({
        success: true,
        message: "User muted successfully",
        restriction,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ======================
  // UNMUTE USER
  // ======================
  async unmuteUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const result = await moderatorService.unmuteUser(
        userId,
        req.user._id.toString(),
      );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ======================
  // BAN USER
  // ======================
  async banUser(req: AuthRequest, res: Response) {
    try {
      const { userId, reason } = req.body;

      if (!userId || !reason) {
        return res.status(400).json({
          success: false,
          message: "userId and reason are required",
        });
      }

      const restriction = await moderatorService.banUser(
        userId,
        reason,
        req.user._id.toString(),
      );

      res.json({
        success: true,
        message: "User banned successfully",
        restriction,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ======================
  // UNBAN USER
  // ======================
  async unbanUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const result = await moderatorService.unbanUser(
        userId,
        req.user._id.toString(),
      );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ======================
  // RESTRICT MEDIA UPLOADS
  // ======================
  async restrictMediaUploads(req: AuthRequest, res: Response) {
    try {
      const { userId, restrictions, reason } = req.body;

      if (!userId || !reason) {
        return res.status(400).json({
          success: false,
          message: "userId and reason are required",
        });
      }

      const restriction = await moderatorService.restrictMediaUploads(
        userId,
        restrictions || {},
        req.user._id.toString(),
        reason,
      );

      res.json({
        success: true,
        message: "Media upload restrictions applied successfully",
        restriction,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ======================
  // LIFT RESTRICTION
  // ======================
  async liftRestriction(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const result = await moderatorService.liftRestriction(
        userId,
        req.user._id.toString(),
      );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ======================
  // GET USER RESTRICTIONS
  // ======================
  async getUserRestrictions(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const result = await moderatorService.getUserRestrictions(userId);

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
  // GET AUDIT LOGS
  // ======================
  async getAuditLogs(req: AuthRequest, res: Response) {
    try {
      const {
        adminId,
        action,
        targetUserId,
        page = "1",
        limit = "50",
      } = req.query;

      const result = await moderatorService.getAuditLogs({
        adminId: adminId as string,
        action: action as AuditAction,
        targetUserId: targetUserId as string,
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
}
