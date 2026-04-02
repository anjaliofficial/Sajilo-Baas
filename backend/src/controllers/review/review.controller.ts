import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { HttpError } from "../../error/http-error";
import { ReviewService } from "../../services/review/review.service";
import { UserModel } from "../../models/user.model";
// import { ReviewModel } from "../../models/review.model";
import { sendPushNotification } from "../../services/notification/notification.service"; // <-- FCM service

const reviewService = new ReviewService();

export const createReview = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const { bookingId, rating, comment } = req.body || {};
  if (!bookingId || rating === undefined) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    const review = await reviewService.createReview({
      reviewerId: (req as AuthRequest).user._id.toString(),
      bookingId,
      rating: Number(rating),
      comment,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or could not be created",
      });
    }

    // Populate reviewer, reviewee, listing, and replies.author
    const populatedReview = await review.populate([
      { path: "reviewer", select: "fullName profilePicture email" },
      { path: "reviewee", select: "fullName profilePicture email" },
      { path: "listingId", select: "title location" },
      { path: "replies.author", select: "fullName profilePicture email" },
    ]);

    // Send push notification to the reviewee (listing/host owner)
    const owner = await UserModel.findById(review.reviewee._id);
    if (owner && owner.fcmTokens.length > 0) {
      await sendPushNotification(
        owner.fcmTokens,
        "New Review",
        `${req.user.fullName} left a review`,
        {
          type: "review",
          reviewId: review._id.toString(),
          link: `/public/reviews/${review._id.toString()}`,
        },
      );
    }

    res.status(201).json({ success: true, data: populatedReview });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addReply = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const { reviewId } = req.params;
  const { text } = req.body;

  if (!text) {
    return res
      .status(400)
      .json({ success: false, message: "Reply text is required" });
  }

  try {
    const review = await reviewService.addReply({
      reviewId,
      authorId: (req as AuthRequest).user._id.toString(),
      text,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or could not add reply",
      });
    }

    // Populate reviewer, reviewee, listing, and replies.author
    const populatedReview = await review.populate([
      { path: "reviewer", select: "fullName profilePicture email" },
      { path: "reviewee", select: "fullName profilePicture email" },
      { path: "listingId", select: "title location" },
      { path: "replies.author", select: "fullName profilePicture email" },
    ]);

    // Notify reviewee about the new reply
    const owner = await UserModel.findById(review.reviewee._id);
    if (owner && owner.fcmTokens.length > 0) {
      await sendPushNotification(
        owner.fcmTokens,
        "New Reply",
        `${req.user.fullName} replied to your review`,
        {
          type: "review_reply",
          reviewId: review._id.toString(),
          link: `/public/reviews/${review._id.toString()}`,
        },
      );
    }

    res.status(201).json({ success: true, data: populatedReview });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyReviewedBookings = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  let bookingIds: string[] = [];
  const rawBookingIds = req.query.bookingIds;

  if (Array.isArray(rawBookingIds)) {
    bookingIds = rawBookingIds.map(String);
  } else if (typeof rawBookingIds === "string") {
    bookingIds = rawBookingIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  try {
    const reviewedBookingIds = await reviewService.getReviewedBookingIds(
      (req as AuthRequest).user._id.toString(),
      bookingIds,
    );
    res.json({ success: true, reviewedBookingIds });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReviewsGiven = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const reviews = await reviewService.getReviewsGiven(
      (req as AuthRequest).user._id.toString(),
    );
    res.json({ success: true, reviews });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReviewsReceived = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const { userId } = req.params;
  if (!userId || userId === "undefined" || userId === "null") {
    return res
      .status(400)
      .json({ success: false, message: "Valid User ID is required" });
  }

  try {
    const reviews = await reviewService.getReviewsReceived(userId);
    res.json({ success: true, reviews });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReview = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  try {
    const review = await reviewService.updateReview({
      reviewId,
      reviewerId: (req as AuthRequest).user._id.toString(),
      rating,
      comment,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or could not be updated",
      });
    }

    res.json({ success: true, data: review });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReply = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const { reviewId, replyId } = req.params;
  const { text } = req.body;

  if (!text)
    return res
      .status(400)
      .json({ success: false, message: "Reply text is required" });

  try {
    const review = await reviewService.updateReply({
      reviewId,
      replyId,
      authorId: (req as AuthRequest).user._id.toString(),
      text,
    });

    if (!review)
      return res.status(404).json({
        success: false,
        message: "Review not found or could not update reply",
      });

    res.json({ success: true, data: review });
  } catch (error: any) {
    if (error instanceof HttpError)
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReply = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const { reviewId, replyId } = req.params;

  try {
    const review = await reviewService.deleteReply({
      reviewId,
      replyId,
      authorId: (req as AuthRequest).user._id.toString(),
    });

    if (!review)
      return res.status(404).json({
        success: false,
        message: "Review not found or could not delete reply",
      });

    res.json({ success: true, data: review });
  } catch (error: any) {
    if (error instanceof HttpError)
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};
