import { Router, Request, Response } from "express";
import { NotificationModel } from "../../models/notification.model";
import {
  authorizedMiddleware,
  AuthRequest,
} from "../../middlewares/auth.middleware";

const router = Router();

// Create a notification
router.post("/", authorizedMiddleware, async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const { message, link } = req.body;
  if (!message && !link) {
    return res
      .status(400)
      .json({ success: false, message: "Message is required" });
  }
  const notification = await NotificationModel.create({
    user: user._id,
    message,
    link,
    read: false,
    createdAt: new Date(),
  });
  res.status(201).json(notification);
});

// Get all notifications for the logged-in user
router.get("/", authorizedMiddleware, async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const notifications = await NotificationModel.find({ user: user._id }).sort({
    createdAt: -1,
  });
  res.json(notifications);
});

// Delete a notification
router.delete(
  "/:id",
  authorizedMiddleware,
  async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user;
    const { id } = req.params;
    await NotificationModel.deleteOne({ _id: id, user: user._id });
    res.json({ success: true });
  },
);

// Mark as read/unread
router.patch(
  "/:id/read",
  authorizedMiddleware,
  async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user;
    const { id } = req.params;
    const { read } = req.body;
    await NotificationModel.updateOne(
      { _id: id, user: user._id },
      { $set: { read: !!read } },
    );
    res.json({ success: true });
  },
);
// Update notification (mark as read)
router.patch(
  "/:id",
  authorizedMiddleware,
  async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user;
    const { id } = req.params;
    const { message, read, link } = req.body;
    const update: any = {};
    if (message !== undefined) update.message = message;
    if (read !== undefined) update.read = read;
    if (link !== undefined) update.link = link;
    const notification = await NotificationModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(notification);
  },
);

export default router;
