import { Router, RequestHandler } from "express";
import { ReportingController } from "../../controllers/reporting.controller";
import { ModeratorController } from "../../controllers/moderator.controller";
import { MessageAccessController } from "../../controllers/message-access.controller";
import {
  authorizedMiddleware,
  roleMiddleware,
} from "../../middlewares/auth.middleware";
import {
  adminRateLimit,
  strictAdminRateLimit,
} from "../../middlewares/rate-limit.middleware";

const router = Router();
const reportingController = new ReportingController();
const moderatorController = new ModeratorController();
const messageAccessController = new MessageAccessController();

// ========================
// USER REPORTING ROUTES (Any authenticated user can report)
// ========================
router.post(
  "/report-message",
  authorizedMiddleware,
  reportingController.reportMessage.bind(reportingController) as RequestHandler,
);

// ========================
// ADMIN REPORTING & MODERATION ROUTES
// ========================
router.use(authorizedMiddleware, roleMiddleware(["admin"]));

// Report management
router.get(
  "/reports",
  reportingController.getAllReports.bind(reportingController) as RequestHandler,
);

router.get(
  "/reports/:id",
  reportingController.getReportById.bind(reportingController) as RequestHandler,
);

// 🔐 VIEW REPORTED CONTENT (Privacy-Protected - Logged, Rate Limited)
router.get(
  "/reports/:reportId/content",
  strictAdminRateLimit,
  reportingController.viewReportedContent.bind(
    reportingController,
  ) as RequestHandler,
);

router.post(
  "/reports/:reportId/action",
  strictAdminRateLimit,
  reportingController.takeActionOnReport.bind(
    reportingController,
  ) as RequestHandler,
);

router.get(
  "/reports/user/:userId/summary",
  reportingController.getUserReportsSummary.bind(
    reportingController,
  ) as RequestHandler,
);

// Moderation routes (with rate limiting on sensitive operations)
router.post(
  "/mute-user",
  strictAdminRateLimit,
  moderatorController.muteUser.bind(moderatorController) as RequestHandler,
);

router.post(
  "/unmute-user",
  adminRateLimit(),
  moderatorController.unmuteUser.bind(moderatorController) as RequestHandler,
);

router.post(
  "/ban-user",
  strictAdminRateLimit,
  moderatorController.banUser.bind(moderatorController) as RequestHandler,
);

router.post(
  "/unban-user",
  adminRateLimit(),
  moderatorController.unbanUser.bind(moderatorController) as RequestHandler,
);

router.post(
  "/restrict-uploads",
  strictAdminRateLimit,
  moderatorController.restrictMediaUploads.bind(
    moderatorController,
  ) as RequestHandler,
);

router.post(
  "/lift-restriction",
  moderatorController.liftRestriction.bind(
    moderatorController,
  ) as RequestHandler,
);

router.get(
  "/user/:userId/restrictions",
  moderatorController.getUserRestrictions.bind(
    moderatorController,
  ) as RequestHandler,
);

router.get(
  "/audit-logs",
  moderatorController.getAuditLogs.bind(moderatorController) as RequestHandler,
);

// ========================
// MESSAGE METADATA ROUTES (Privacy-Protected)
// ========================
// 🔐 Admins can query metadata only, NOT content
router.get(
  "/message-metadata",
  messageAccessController.queryMessageMetadata.bind(
    messageAccessController,
  ) as RequestHandler,
);

router.get(
  "/user/:userId/message-activity",
  messageAccessController.getUserMessageActivity.bind(
    messageAccessController,
  ) as RequestHandler,
);

export default router;
