import ReportedMessageModel, {
  ReportReason,
  ReportStatus,
} from "../models/reported-message.model";
import UserRestrictionModel, {
  RestrictionType,
} from "../models/user-restriction.model";
import AuditLogModel, { AuditAction } from "../models/audit-log.model";
import Message from "../models/message.model";
import { UserService } from "../services/user.service";

const userService = new UserService();

export class ReportingService {
  // ======================
  // REPORT MESSAGE
  // ======================
  async reportMessage(
    messageId: string,
    reportedByUserId: string,
    reportedUserId: string,
    reason: ReportReason,
    description: string,
  ) {
    try {
      // Check if already reported
      const existingReport = await ReportedMessageModel.findOne({
        messageId,
        reportedByUserId,
        status: ReportStatus.PENDING,
      });

      if (existingReport) {
        throw new Error("You have already reported this message");
      }

      // 🔐 Fetch the full message content (for admin review only)
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      // Create new report with captured content
      const report = new ReportedMessageModel({
        messageId,
        reportedByUserId,
        reportedUserId,
        reason,
        description,
        status: ReportStatus.PENDING,

        // 🔐 Capture message content here (stored securely in ReportedMessage)
        capturedContent: message.content || "",
        capturedMediaUrls: message.media?.map((m) => m.url) || [],
        capturedMessageType: message.type,
      });

      await report.save();
      return report;
    } catch (error: any) {
      throw new Error(`Failed to report message: ${error.message}`);
    }
  }

  // ======================
  // GET ALL REPORTS (Admin)
  // ======================
  async getAllReports(
    filters: {
      status?: ReportStatus;
      reason?: ReportReason;
      reportedUserId?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    try {
      const { status, reason, reportedUserId, page = 1, limit = 20 } = filters;

      const query: any = {};
      if (status) query.status = status;
      if (reason) query.reason = reason;
      if (reportedUserId) query.reportedUserId = reportedUserId;

      const skip = (page - 1) * limit;

      const reports = await ReportedMessageModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ReportedMessageModel.countDocuments(query);

      return {
        reports,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }
  }

  // ======================
  // GET REPORT BY ID
  // ======================
  async getReportById(reportId: string) {
    try {
      const report = await ReportedMessageModel.findById(reportId);
      if (!report) {
        throw new Error("Report not found");
      }
      return report;
    } catch (error: any) {
      throw new Error(`Failed to fetch report: ${error.message}`);
    }
  }

  // ======================
  // TAKE ACTION ON REPORT
  // ======================
  async takeActionOnReport(
    reportId: string,
    action: "warn" | "mute" | "ban" | "dismiss",
    adminId: string,
    adminNotes: string = "",
  ) {
    try {
      const report = await ReportedMessageModel.findById(reportId);
      if (!report) {
        throw new Error("Report not found");
      }

      if (action === "dismiss") {
        report.status = ReportStatus.DISMISSED;
        report.actionTaken = "none";
      } else {
        // Apply restriction
        const restrictionType =
          action === "mute" ? RestrictionType.MUTED : RestrictionType.BANNED;

        // Check for existing restriction
        let restriction = await UserRestrictionModel.findOne({
          userId: report.reportedUserId,
          restrictionType,
        });

        if (restriction) {
          // Update existing restriction
          restriction.reason = `Report ${reportId}: ${report.reason}`;
          restriction.appliedBy = adminId;
          restriction.appliedAt = new Date();
        } else {
          // Create new restriction
          restriction = new UserRestrictionModel({
            userId: report.reportedUserId,
            restrictionType,
            reason: `Report ${reportId}: ${report.reason}`,
            isPermanent: false,
            expiresAt:
              action === "mute"
                ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                : undefined,
            appliedBy: adminId,
            restrictions: {
              canSendMessages: action !== "mute" && action !== "ban",
            },
          });
        }

        await restriction.save();

        report.status = ReportStatus.RESOLVED;
        report.actionTaken = action;
        report.actionTakenBy = adminId;
        report.actionTakenAt = new Date();
      }

      report.adminNotes = adminNotes;
      await report.save();

      // Log action
      await AuditLogModel.create({
        adminId,
        action:
          action === "dismiss"
            ? AuditAction.REPORT_DISMISSED
            : AuditAction.REPORT_ACTION_TAKEN,
        targetUserId: report.reportedUserId,
        targetEntityId: reportId,
        targetEntityType: "report",
        details: {
          action,
          reason: report.reason,
          adminNotes,
        },
      });

      return report;
    } catch (error: any) {
      throw new Error(`Failed to take action on report: ${error.message}`);
    }
  }

  // ======================
  // GET USER REPORTS SUMMARY
  // ======================
  async getUserReportsSummary(userId: string) {
    try {
      const stats = await ReportedMessageModel.aggregate([
        {
          $match: { reportedUserId: userId },
        },
        {
          $group: {
            _id: "$reason",
            count: { $sum: 1 },
          },
        },
      ]);

      const totalReports = await ReportedMessageModel.countDocuments({
        reportedUserId: userId,
      });
      const pendingReports = await ReportedMessageModel.countDocuments({
        reportedUserId: userId,
        status: ReportStatus.PENDING,
      });
      const resolvedReports = await ReportedMessageModel.countDocuments({
        reportedUserId: userId,
        status: ReportStatus.RESOLVED,
      });

      return {
        totalReports,
        pendingReports,
        resolvedReports,
        byReason: stats,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch user report summary: ${error.message}`);
    }
  }

  // ======================
  // GET MESSAGE METADATA
  // ======================
  async getMessageMetadata(messageId: string) {
    try {
      // This is where you'd fetch from MessageMetadata model
      // For now, returning structure
      const metadata = {
        messageId,
        messageType: "text",
        hasMedia: false,
        deliveryStatus: "read",
        isEdited: false,
        isDeleted: false,
        createdAt: new Date(),
      };
      return metadata;
    } catch (error: any) {
      throw new Error(`Failed to fetch message metadata: ${error.message}`);
    }
  }
}
