import { Router } from "express";
import {
  sendMessage,
  getConversation,
  getThreads,
  markConversationRead,
  editMessage,
  deleteMessage,
} from "../../controllers/message/message.controller";
import {
  authorizedMiddleware,
  roleMiddleware,
} from "../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/",
  authorizedMiddleware,
  roleMiddleware(["host", "customer"]),
  sendMessage,
);

router.get(
  "/threads",
  authorizedMiddleware,
  roleMiddleware(["host", "customer"]),
  getThreads,
);

router.patch(
  "/read",
  authorizedMiddleware,
  roleMiddleware(["host", "customer"]),
  markConversationRead,
);

router.get(
  "/:otherUserId/:listingId",
  authorizedMiddleware,
  roleMiddleware(["host", "customer"]),
  getConversation,
);

router.put(
  "/:messageId",
  authorizedMiddleware,
  roleMiddleware(["host", "customer"]),
  editMessage,
);

router.delete(
  "/:messageId",
  authorizedMiddleware,
  roleMiddleware(["host", "customer"]),
  deleteMessage,
);

export default router;
