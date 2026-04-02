import { Router } from "express";
import {
  createReview,
  getMyReviewedBookings,
  getReviewsGiven,
  getReviewsReceived,
  updateReview,
  addReply,
  updateReply,
  deleteReply,
} from "../../controllers/review/review.controller";
import {
  authorizedMiddleware,
  roleMiddleware,
} from "../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/",
  authorizedMiddleware,
  roleMiddleware(["host", "customer"]),
  createReview,
);

router.get(
  "/mine",
  authorizedMiddleware,
  roleMiddleware(["host", "customer"]),
  getMyReviewedBookings,
);

router.get(
  "/given",
  authorizedMiddleware,
  roleMiddleware(["host", "customer"]),
  getReviewsGiven,
);

router.get(
  "/received/:userId",
  authorizedMiddleware,
  getReviewsReceived,
);

router.put(
  "/:reviewId",
  authorizedMiddleware,
  roleMiddleware(["host", "customer"]),
  updateReview,
);

router.post(
  "/:reviewId/replies",
  authorizedMiddleware,
  roleMiddleware(["host", "customer"]),
  addReply,
);

router.put(
  "/:reviewId/replies/:replyId",
  authorizedMiddleware,
  roleMiddleware(["host", "customer"]),
  updateReply,
);

router.delete(
  "/:reviewId/replies/:replyId",
  authorizedMiddleware,
  roleMiddleware(["host", "customer"]),
  deleteReply,
);

export default router;
