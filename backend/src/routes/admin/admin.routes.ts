import { Router, RequestHandler } from "express";
import { AdminUserController } from "../../controllers/admin/admin.controller";
import { AdminMessageController } from "../../controllers/admin/admin-message.controller";
import {
  authorizedMiddleware,
  roleMiddleware,
} from "../../middlewares/auth.middleware";

const router = Router();
const adminController = new AdminUserController();
const adminMessageController = new AdminMessageController();

// Public admin login
router.post(
  "/login",
  adminController.login.bind(adminController) as RequestHandler,
);

// Protected routes - all require admin role
router.use(authorizedMiddleware, roleMiddleware(["admin"]));

// ========================
// USER MANAGEMENT ROUTES
// ========================
router.get(
  "/users",
  adminController.getAllUsers.bind(adminController) as RequestHandler,
);
router.post(
  "/users",
  adminController.createUser.bind(adminController) as RequestHandler,
);
router.get(
  "/users/:id",
  adminController.getUserById.bind(adminController) as RequestHandler,
);
router.post(
  "/users/:id/suspend",
  adminController.suspendUser.bind(adminController) as RequestHandler,
);
router.post(
  "/users/:id/ban",
  adminController.banUser.bind(adminController) as RequestHandler,
);
router.post(
  "/users/:id/activate",
  adminController.activateUser.bind(adminController) as RequestHandler,
);
router.delete(
  "/users/:id",
  adminController.deleteUser.bind(adminController) as RequestHandler,
);
router.put(
  "/users/:id",
  adminController.updateUser.bind(adminController) as RequestHandler,
);

// ========================
// LISTING MANAGEMENT ROUTES
// ========================
router.get(
  "/listings",
  adminController.getAllListings.bind(adminController) as RequestHandler,
);
router.get(
  "/listings/:id",
  adminController.getListingById.bind(adminController) as RequestHandler,
);
router.post(
  "/listings/:id/approve",
  adminController.approveListing.bind(adminController) as RequestHandler,
);
router.post(
  "/listings/:id/reject",
  adminController.rejectListing.bind(adminController) as RequestHandler,
);
router.delete(
  "/listings/:id",
  adminController.deleteListing.bind(adminController) as RequestHandler,
);

// ========================
// BOOKING MANAGEMENT ROUTES
// ========================
router.get(
  "/bookings",
  adminController.getAllBookings.bind(adminController) as RequestHandler,
);
router.get(
  "/bookings/:id",
  adminController.getBookingById.bind(adminController) as RequestHandler,
);
router.post(
  "/bookings/:id/confirm",
  adminController.confirmBooking.bind(adminController) as RequestHandler,
);
router.post(
  "/bookings/:id/cancel",
  adminController.cancelBooking.bind(adminController) as RequestHandler,
);

// ========================
// TRANSACTION MANAGEMENT ROUTES - REMOVED (Not needed for now)
// ========================
// router.get(
//   "/transactions",
//   adminController.getAllTransactions.bind(adminController) as RequestHandler,
// );

// ========================
// MESSAGE MANAGEMENT ROUTES
// ========================
router.get(
  "/messages",
  adminMessageController.getAllMessages.bind(
    adminMessageController,
  ) as RequestHandler,
);
router.get(
  "/messages/search",
  adminMessageController.searchMessages.bind(
    adminMessageController,
  ) as RequestHandler,
);
router.get(
  "/messages/user/:userId",
  adminMessageController.getUserConversations.bind(
    adminMessageController,
  ) as RequestHandler,
);
router.get(
  "/messages/between/:userId1/:userId2",
  adminMessageController.getConversationBetweenUsers.bind(
    adminMessageController,
  ) as RequestHandler,
);

// ========================
// DASHBOARD STATS ROUTE
// ========================
router.get(
  "/dashboard/stats",
  adminController.getDashboardStats.bind(adminController) as RequestHandler,
);

export default router;
