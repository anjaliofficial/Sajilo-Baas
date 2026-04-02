import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ReportingService } from "../services/reporting.service";
import { MessageAccessService } from "../services/message-access.service";
import { ReportReason } from "../models/reported-message.model";

const reportingService = new ReportingService();
const messageAccessService = new MessageAccessService();

export class ReportingController {
  // ======================
  // REPORT MESSAGE
  // ======================
  async reportMessage(req: AuthRequest, res: Response) {
    try {
      const { messageId, reportedUserId, reason, description } = req.body;

      if (!messageId || !reportedUserId || !reason) {
        return res.status(400).json({
          success: false,
          message: "messageId, reportedUserId, and reason are required",
        });
      }

      const report = await reportingService.reportMessage(
        messageId,
        req.user._id.toString(),
        reportedUserId,
        reason as ReportReason,
        description || "",
      );

      res.status(201).json({
        success: true,
        message: "Message reported successfully",
        report,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ======================
  // GET ALL REPORTS (Admin Only)
  // ======================
  async getAllReports(req: AuthRequest, res: Response) {
    try {
      const {
        status,
        reason,
        reportedUserId,
        page = "1",
        limit = "20",
      } = req.query;

      const result = await reportingService.getAllReports({
        status: status as any,
        reason: reason as any,
        reportedUserId: reportedUserId as string,
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
  // GET REPORT BY ID
  // ======================
  async getReportById(req: AuthRequest, res: Response) {
    try {
      const report = await reportingService.getReportById(req.params.id);

      res.json({
        success: true,
        report,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ======================
  // VIEW REPORTED MESSAGE CONTENT (Privacy-Protected)
  // ======================
  /**
   * 🔐 ONLY WAY admins can see message content
   * Access logged to audit trail
   * User consent via report unlocks visibility
   */
  async viewReportedContent(req: AuthRequest, res: Response) {
    try {
      const { reportId } = req.params;

      if (!reportId) {
        return res.status(400).json({
          success: false,
          message: "reportId is required",
        });
      }

      const report = await messageAccessService.viewReportedMessageContent(
        reportId,
        req.user._id.toString(),
      );

      res.json({
        success: true,
        message: "Reported content accessed (view logged)",
        report,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ======================
  // TAKE ACTION ON REPORT
  // ======================
  async takeActionOnReport(req: AuthRequest, res: Response) {
    try {
      const { action, adminNotes } = req.body;
      const { reportId } = req.params;

      if (!action || !["warn", "mute", "ban", "dismiss"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Valid action is required (warn, mute, ban, dismiss)",
        });
      }

      const report = await reportingService.takeActionOnReport(
        reportId,
        action,
        req.user._id.toString(),
        adminNotes || "",
      );

      res.json({
        success: true,
        message: "Action taken on report successfully",
        report,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ======================
  // GET USER REPORTS SUMMARY
  // ======================
  async getUserReportsSummary(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      const summary = await reportingService.getUserReportsSummary(userId);

      res.json({
        success: true,
        summary,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
