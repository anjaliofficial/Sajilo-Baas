import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import {
  authorizedMiddleware,
  roleMiddleware,
} from "../middlewares/auth.middleware";

const router = Router();
const userController = new UserController();

// Public routes
router.post("/register", userController.register.bind(userController));
router.post("/login", userController.login.bind(userController));
router.post(
  "/send-reset-password",
  userController.sendResetPasswordEmail.bind(userController),
);
router.post(
  "/reset-password",
  userController.resetPassword.bind(userController),
);

// Current user route (requires auth)
router.get("/me", authorizedMiddleware, (req, res) => {
  res.json({
    success: true,
    user: (req as any).user, // payload from JWT
  });
});

// Public profile (no auth required)
router.get("/public/:id", userController.getPublicProfile.bind(userController));

// Get all users with pagination (admin-only)
router.get(
  "/",
  authorizedMiddleware,
  roleMiddleware(["admin"]),
  userController.getAllUsers.bind(userController),
);

// Update user profile (protected)
router.put(
  "/update",
  authorizedMiddleware,
  userController.updateProfile.bind(userController),
);

// Admin-only route
// router.get("/admin", authorizedMiddleware, roleMiddleware(["admin"]), (req, res) => {
//   res.json({ message: "Admin dashboard", user: (req as any).user });
// });

// // Admin + Host route
// router.get("/host-area", authorizedMiddleware, roleMiddleware(["admin", "host"]), (req, res) => {
//   res.json({ message: "Host area", user: (req as any).user });
// });

// POST /fcm-token route to handle FCM token updates for users
router.post("/fcm-token", userController.updateFcmToken.bind(userController));

export default router;
