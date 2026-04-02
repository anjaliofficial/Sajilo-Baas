import AuditLogModel, { AuditAction } from "../models/audit-log.model";
import UserRestrictionModel, {
  RestrictionType,
} from "../models/user-restriction.model";
import { IUser, UserModel } from "../models/user.model";
import { AuthRequest } from "../middlewares/auth.middleware";

export class ModeratorService {
  // ======================
  // MUTE USER
  // ======================
  async muteUser(
    userId: string,
    hours: number = 24,
    reason: string,
    adminId: string,
  ) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

      let restriction = await UserRestrictionModel.findOne({
        userId,
        restrictionType: RestrictionType.MUTED,
      });

      if (restriction) {
        restriction.expiresAt = expiresAt;
        restriction.reason = reason;
        restriction.appliedBy = adminId;
        restriction.appliedAt = new Date();
      } else {
        restriction = new UserRestrictionModel({
          userId,
          restrictionType: RestrictionType.MUTED,
          reason,
          isPermanent: false,
          expiresAt,
          appliedBy: adminId,
          restrictions: {
            canSendMessages: false,
            canUploadMedia: true,
          },
        });
      }

      await restriction.save();

      // Log action
      await AuditLogModel.create({
        adminId,
        action: AuditAction.USER_MUTED,
        targetUserId: userId,
        details: { hours, reason },
      });

      return restriction;
    } catch (error: any) {
      throw new Error(`Failed to mute user: ${error.message}`);
    }
  }

  // ======================
  // UNMUTE USER
  // ======================
  async unmuteUser(userId: string, adminId: string) {
    try {
      const restriction = await UserRestrictionModel.findOneAndDelete({
        userId,
        restrictionType: RestrictionType.MUTED,
      });

      if (!restriction) {
        throw new Error("User is not muted");
      }

      // Log action
      await AuditLogModel.create({
        adminId,
        action: AuditAction.USER_UNMUTED,
        targetUserId: userId,
      });

      return { success: true, message: "User unmuted successfully" };
    } catch (error: any) {
      throw new Error(`Failed to unmute user: ${error.message}`);
    }
  }

  // ======================
  // BAN USER
  // ======================
  async banUser(userId: string, reason: string, adminId: string) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      let restriction = await UserRestrictionModel.findOne({
        userId,
        restrictionType: RestrictionType.BANNED,
      });

      if (!restriction) {
        restriction = new UserRestrictionModel({
          userId,
          restrictionType: RestrictionType.BANNED,
          reason,
          isPermanent: false,
          appliedBy: adminId,
          restrictions: {
            canSendMessages: false,
            canUploadMedia: false,
          },
        });
        await restriction.save();
      }

      // Update user status
      user.status = "banned";
      await user.save();

      // Log action
      await AuditLogModel.create({
        adminId,
        action: AuditAction.USER_BANNED,
        targetUserId: userId,
        details: { reason },
      });

      return restriction;
    } catch (error: any) {
      throw new Error(`Failed to ban user: ${error.message}`);
    }
  }

  // ======================
  // UNBAN USER
  // ======================
  async unbanUser(userId: string, adminId: string) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      await UserRestrictionModel.findOneAndDelete({
        userId,
        restrictionType: RestrictionType.BANNED,
      });

      user.status = "active";
      await user.save();

      // Log action
      await AuditLogModel.create({
        adminId,
        action: AuditAction.USER_UNBANNED,
        targetUserId: userId,
      });

      return { success: true, message: "User unbanned successfully" };
    } catch (error: any) {
      throw new Error(`Failed to unban user: ${error.message}`);
    }
  }

  // ======================
  // RESTRICT MEDIA UPLOADS
  // ======================
  async restrictMediaUploads(
    userId: string,
    restrictions: {
      maxFileSize?: number; // bytes
      allowedTypes?: ("image" | "video" | "audio")[];
      messageLimit?: number; // per hour
    },
    adminId: string,
    reason: string,
  ) {
    try {
      let restriction = await UserRestrictionModel.findOne({
        userId,
        restrictionType: RestrictionType.UPLOAD_RESTRICTED,
      });

      if (restriction) {
        restriction.restrictions = {
          ...restriction.restrictions,
          canSendMessages: true,
          canUploadMedia: true,
          maxFileSize: restrictions.maxFileSize,
          mediaTypesAllowed: restrictions.allowedTypes || [
            "image",
            "video",
            "audio",
          ],
          messageLimitPerHour: restrictions.messageLimit,
        };
      } else {
        restriction = new UserRestrictionModel({
          userId,
          restrictionType: RestrictionType.UPLOAD_RESTRICTED,
          reason,
          isPermanent: false,
          appliedBy: adminId,
          restrictions: {
            canSendMessages: true,
            canUploadMedia: true,
            maxFileSize: restrictions.maxFileSize,
            mediaTypesAllowed: restrictions.allowedTypes || [
              "image",
              "video",
              "audio",
            ],
            messageLimitPerHour: restrictions.messageLimit,
          },
        });
      }

      await restriction.save();

      // Log action
      await AuditLogModel.create({
        adminId,
        action: AuditAction.USER_UPLOAD_RESTRICTED,
        targetUserId: userId,
        details: { restrictions, reason },
      });

      return restriction;
    } catch (error: any) {
      throw new Error(`Failed to restrict media uploads: ${error.message}`);
    }
  }

  // ======================
  // LIFT RESTRICTION
  // ======================
  async liftRestriction(userId: string, adminId: string) {
    try {
      const restriction = await UserRestrictionModel.findOneAndDelete({
        userId,
        restrictionType: RestrictionType.UPLOAD_RESTRICTED,
      });

      if (!restriction) {
        throw new Error("No upload restriction found for this user");
      }

      // Log action
      await AuditLogModel.create({
        adminId,
        action: AuditAction.USER_RESTRICTION_LIFTED,
        targetUserId: userId,
      });

      return { success: true, message: "Restriction lifted successfully" };
    } catch (error: any) {
      throw new Error(`Failed to lift restriction: ${error.message}`);
    }
  }

  // ======================
  // GET USER RESTRICTIONS
  // ======================
  async getUserRestrictions(userId: string) {
    try {
      const restrictions = await UserRestrictionModel.find({
        userId,
      });

      const active = restrictions.filter((r) => {
        if (r.isPermanent) return true;
        if (r.expiresAt && r.expiresAt > new Date()) return true;
        return false;
      });

      return { all: restrictions, active };
    } catch (error: any) {
      throw new Error(`Failed to fetch user restrictions: ${error.message}`);
    }
  }

  // ======================
  // GET AUDIT LOGS
  // ======================
  async getAuditLogs(
    filters: {
      adminId?: string;
      action?: AuditAction;
      targetUserId?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    try {
      const { adminId, action, targetUserId, page = 1, limit = 50 } = filters;

      const query: any = {};
      if (adminId) query.adminId = adminId;
      if (action) query.action = action;
      if (targetUserId) query.targetUserId = targetUserId;

      const skip = (page - 1) * limit;

      const logs = await AuditLogModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await AuditLogModel.countDocuments(query);

      return {
        logs,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }
  }
}
