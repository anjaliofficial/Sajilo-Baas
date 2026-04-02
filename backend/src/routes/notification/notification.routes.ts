import { Router, Request, Response } from "express";
import { UserModel } from "../../models/user.model";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { authorizedMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

// Use middleware to populate req.user
router.post(
  "/save-fcm-token",
  authorizedMiddleware, // makes sure req.user exists
  async (req: Request, res: Response) => {
    // We know req.user exists after middleware
    const user = (req as AuthRequest).user;

    const { fcmToken } = req.body;
    if (!fcmToken)
      return res
        .status(400)
        .json({ success: false, message: "fcmToken required" });

    const dbUser = await UserModel.findById(user._id);
    if (!dbUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (!dbUser.fcmTokens.includes(fcmToken)) {
      dbUser.fcmTokens.push(fcmToken);
      await dbUser.save();
    }

    res.json({ success: true });
  },
);

export default router;
