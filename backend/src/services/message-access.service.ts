import MessageMetadataModel from "../models/message-metadata.model";
import ReportedMessageModel from "../models/reported-message.model";
import AuditLogModel, { AuditAction } from "../models/audit-log.model";

/**
 * MessageAccessService
 *
 * Enforces privacy-first architecture:
 * ✅ Admins can query message METADATA (type, timestamp, delivery status)
 * ✅ Admins can view REPORTED message CONTENT (with audit logging)
 * ❌ Admins CANNOT browse arbitrary message content
 * ❌ Admins CANNOT search by message text
 */
export class MessageAccessService {
  // ======================
  // LAYER 1: METADATA ACCESS (Default for Admins)
  // ======================
  /**
   * Get message metadata only (no content visible)
   * Admins see: message type, sender, receiver, timestamp, delivery status
   * Admins do NOT see: message text, media URLs
   */
  async getMessageMetadata(messageId: string) {
    try {
      const metadata = await MessageMetadataModel.findOne({ messageId });
      if (!metadata) {
        throw new Error("Message metadata not found");
      }

      // Return safe metadata view
      return {
        messageId: metadata.messageId,
        sender: metadata.senderId,
        receiver: metadata.receiverId,
        type: metadata.messageType,
        timestamp: metadata.createdAt,
        deliveryStatus: metadata.deliveryStatus,
        // ❌ Content NOT included
        // ❌ Media URLs NOT included
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch message metadata: ${error.message}`);
    }
  }

  /**
   * Query messages by metadata only
   * Admins can filter by: user ID, date range, message type, conversation
   * Admins CANNOT search by message content
   */
  async queryMessageMetadata(
    filters: {
      senderId?: string;
      receiverId?: string;
      messageType?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {},
  ) {
    try {
      const {
        senderId,
        receiverId,
        messageType,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = filters;

      const query: any = { isDeleted: false };

      if (senderId) query.senderId = senderId;
      if (receiverId) query.receiverId = receiverId;
      if (messageType) query.messageType = messageType;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      const skip = (page - 1) * limit;

      const results = await MessageMetadataModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await MessageMetadataModel.countDocuments(query);

      // Return safe metadata view (no content)
      return {
        messages: results.map((m) => ({
          messageId: m.messageId,
          sender: m.senderId,
          receiver: m.receiverId,
          type: m.messageType,
          timestamp: m.createdAt,
          deliveryStatus: m.deliveryStatus,
          mediaCount: m.mediaCount || 0,
          // ❌ Content NOT included
        })),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new Error(`Failed to query message metadata: ${error.message}`);
    }
  }

  // ======================
  // LAYER 2: REPORTED CONTENT ACCESS (Event-Driven)
  // ======================
  /**
   * View reported message content
   * 🔑 This is the ONLY way admins can see message content
   * 🔑 User consent via report unlocks visibility
   * 📝 Every view is audited
   */
  async viewReportedMessageContent(reportId: string, adminId: string) {
    try {
      const report = await ReportedMessageModel.findById(reportId);

      if (!report) {
        throw new Error("Report not found");
      }

      // ✅ Audit this access
      await AuditLogModel.create({
        adminId,
        action: AuditAction.REPORT_REVIEWED,
        targetUserId: report.reportedUserId,
        targetEntityId: reportId,
        targetEntityType: "ReportedMessage",
        details: {
          messageId: report.messageId,
          reason: report.reason,
          contentAccessed: true,
        },
      });

      // Track that admin viewed this report
      report.viewedByAdmin = true;
      report.adminViewedAt = new Date();
      report.adminViewedCount = (report.adminViewedCount || 0) + 1;
      await report.save();

      // Return full report with captured content
      return {
        reportId: report._id,
        reportedBy: report.reportedByUserId,
        reportedUser: report.reportedUserId,
        reason: report.reason,
        description: report.description,
        status: report.status,

        // 🔑 Content NOW visible (because report was filed)
        capturedContent: report.capturedContent,
        capturedMediaUrls: report.capturedMediaUrls,
        capturedMessageType: report.capturedMessageType,

        adminNotes: report.adminNotes,
        actionTaken: report.actionTaken,
        viewedCount: report.adminViewedCount,
      };
    } catch (error: any) {
      throw new Error(`Failed to view reported content: ${error.message}`);
    }
  }

  /**
   * List all reports (with metadata view)
   * Content NOT shown in list - admins must click to view
   */
  async getReportsWithMetadata(
    filters: {
      status?: string;
      reason?: string;
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

      // Return reports WITHOUT content (admins click report to view)
      return {
        reports: reports.map((r) => ({
          reportId: r._id,
          messageId: r.messageId,
          reportedBy: r.reportedByUserId,
          reportedUser: r.reportedUserId,
          reason: r.reason,
          status: r.status,
          messageType: r.capturedMessageType,
          // ❌ Content NOT shown in list
          createdAt: r.createdAt,
          viewedByAdmin: r.viewedByAdmin,
          adminNotes: r.adminNotes,
        })),
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
  // LAYER 3: ACTIVITY MONITORING
  // ======================
  /**
   * Get user's message activity (metadata only)
   * Shows: how many messages, types, delivery patterns
   * Does NOT show: message content, context
   */
  async getUserMessageActivity(userId: string) {
    try {
      const sent = await MessageMetadataModel.countDocuments({
        senderId: userId,
        isDeleted: false,
      });

      const received = await MessageMetadataModel.countDocuments({
        receiverId: userId,
        isDeleted: false,
      });

      const typeBreakdown = await MessageMetadataModel.aggregate([
        {
          $match: {
            $or: [{ senderId: userId }, { receiverId: userId }],
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$messageType",
            count: { $sum: 1 },
          },
        },
      ]);

      return {
        userId,
        messageSent: sent,
        messagesReceived: received,
        typeBreakdown: typeBreakdown.map((item) => ({
          type: item._id,
          count: item.count,
        })),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch user activity: ${error.message}`);
    }
  }
}
