import mongoose from "mongoose";
import Booking from "../../models/booking.model";
import Review from "../../models/review.model";
import { HttpError } from "../../error/http-error";
import { NotificationModel } from "../../models/notification.model";
import { sendSocketNotification } from "../notification/notification.service";

export class ReviewService {
  async createReview(params: {
    reviewerId: string;
    bookingId: string;
    rating: number;
    comment?: string;
  }) {
    const { reviewerId, bookingId, rating, comment } = params;

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new HttpError("Rating must be between 1 and 5", 400);
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new HttpError("Booking not found", 404);
    if (booking.status === "cancelled") {
      throw new HttpError("Cancelled bookings cannot be reviewed", 409);
    }

    const isCustomer = booking.customerId.toString() === reviewerId;
    const isHost = booking.hostId.toString() === reviewerId;

    if (!isCustomer && !isHost) {
      throw new HttpError("Unauthorized", 403);
    }

    const existing = await Review.findOne({
      bookingId: booking._id,
      reviewer: reviewerId,
    });
    if (existing) throw new HttpError("Review already submitted", 409);

    const revieweeId = isCustomer ? booking.hostId : booking.customerId;

    const review = await Review.create({
      bookingId: booking._id,
      listingId: booking.listingId,
      reviewer: reviewerId,
      reviewee: revieweeId,
      rating,
      comment: comment?.trim() || "",
    });

    // Create notification for reviewee
    const notification = await NotificationModel.create({
      user: revieweeId,
      message: `You received a new review on your booking/listing.`,
      link: `/public/reviews/${review._id}`,
    });
    // Send real-time notification
    sendSocketNotification(String(revieweeId), {
      ...notification.toObject(),
      _id: notification._id.toString(),
    });

    return review;
  }

  async getReviewedBookingIds(reviewerId: string, bookingIds: string[]) {
    const uniqueIds = Array.from(
      new Set(bookingIds.map((id) => id.trim()).filter(Boolean)),
    );

    if (uniqueIds.length === 0) return [];

    const objectIds = uniqueIds.map((id) => new mongoose.Types.ObjectId(id));

    const reviews = await Review.find({
      reviewer: reviewerId,
      bookingId: { $in: objectIds },
    }).select("bookingId");

    return reviews.map((review) => review.bookingId.toString());
  }

  async getReviewsGiven(reviewerId: string) {
    if (!reviewerId) {
      throw new HttpError("Reviewer ID is required", 400);
    }

    try {
      const objectId = new mongoose.Types.ObjectId(reviewerId);
      const reviews = await Review.find({ reviewer: objectId })
        .populate("reviewee", "fullName profilePicture email")
        .populate("listingId", "title location")
        .populate("replies.author", "fullName profilePicture email")
        .sort({ createdAt: -1 });

      return reviews;
    } catch (error: any) {
      throw new HttpError("Invalid user ID format", 400);
    }
  }

  async getReviewsReceived(revieweeId: string) {
    if (!revieweeId) {
      throw new HttpError("Review ID is required", 400);
    }

    try {
      const objectId = new mongoose.Types.ObjectId(revieweeId);
      const reviews = await Review.find({ reviewee: objectId })
        .populate("reviewer", "fullName profilePicture email")
        .populate("listingId", "title location")
        .populate("replies.author", "fullName profilePicture email")
        .sort({ createdAt: -1 });

      return reviews;
    } catch (error: any) {
      throw new HttpError("Invalid user ID format", 400);
    }
  }

  async updateReview(params: {
    reviewId: string;
    reviewerId: string;
    rating?: number;
    comment?: string;
  }) {
    const { reviewId, reviewerId, rating, comment } = params;

    if (rating !== undefined) {
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        throw new HttpError("Rating must be between 1 and 5", 400);
      }
    }

    const objectId = new mongoose.Types.ObjectId(reviewId);
    const review = await Review.findById(objectId);
    if (!review) throw new HttpError("Review not found", 404);

    if (review.reviewer.toString() !== reviewerId) {
      throw new HttpError("Unauthorized to edit this review", 403);
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment?.trim() || "";

    await review.save();

    // Populate nested fields
    const populatedReview = await Review.findById(objectId)
      .populate("reviewer", "fullName profilePicture email")
      .populate("reviewee", "fullName profilePicture email")
      .populate("listingId", "title location");

    return populatedReview;
  }

  async addReply(params: { reviewId: string; authorId: string; text: string }) {
    const { reviewId, authorId, text } = params;

    if (!text || text.trim().length === 0) {
      throw new HttpError("Reply text cannot be empty", 400);
    }

    const objectId = new mongoose.Types.ObjectId(reviewId);
    const review = await Review.findById(objectId);
    if (!review) throw new HttpError("Review not found", 404);

    if (
      review.reviewer.toString() !== authorId &&
      review.reviewee.toString() !== authorId
    ) {
      throw new HttpError("Unauthorized to reply to this review", 403);
    }

    review.replies = review.replies || [];
    review.replies.push({
      author: new mongoose.Types.ObjectId(authorId),
      text: text.trim(),
    });

    await review.save();

    // Notify the other user (reviewer or reviewee)
    let notifyUserId;
    if (review.reviewer.toString() === authorId) {
      notifyUserId = review.reviewee;
    } else {
      notifyUserId = review.reviewer;
    }
    const { NotificationModel } = require("../../models/notification.model");
    const {
      sendSocketNotification,
    } = require("../notification/notification.service");
    const notification = await NotificationModel.create({
      user: notifyUserId,
      message: `You received a reply to your review.`,
      link: `/public/reviews/${review._id}`,
    });
    sendSocketNotification(String(notifyUserId), {
      ...notification.toObject(),
      _id: notification._id.toString(),
    });

    // Populate nested fields
    const populatedReview = await Review.findById(objectId)
      .populate("reviewer", "fullName profilePicture email")
      .populate("reviewee", "fullName profilePicture email")
      .populate("listingId", "title location");

    return populatedReview;
  }

  async updateReply(params: {
    reviewId: string;
    replyId: string;
    authorId: string;
    text: string;
  }) {
    const { reviewId, replyId, authorId, text } = params;

    if (!text || text.trim().length === 0) {
      throw new HttpError("Reply text cannot be empty", 400);
    }

    const reviewObjectId = new mongoose.Types.ObjectId(reviewId);
    const replyObjectId = new mongoose.Types.ObjectId(replyId);

    const review = await Review.findById(reviewObjectId);
    if (!review) throw new HttpError("Review not found", 404);

    const reply = review.replies?.find((r) => r._id?.toString() === replyId);
    if (!reply) throw new HttpError("Reply not found", 404);

    if (reply.author.toString() !== authorId) {
      throw new HttpError("Unauthorized to edit this reply", 403);
    }

    reply.text = text.trim();
    await review.save();

    // Populate nested fields
    const populatedReview = await Review.findById(reviewObjectId)
      .populate("reviewer", "fullName profilePicture email")
      .populate("reviewee", "fullName profilePicture email")
      .populate("listingId", "title location");

    return populatedReview;
  }

  async deleteReply(params: {
    reviewId: string;
    replyId: string;
    authorId: string;
  }) {
    const { reviewId, replyId, authorId } = params;

    const reviewObjectId = new mongoose.Types.ObjectId(reviewId);

    const review = await Review.findById(reviewObjectId);
    if (!review) throw new HttpError("Review not found", 404);

    const replyIndex = review.replies?.findIndex(
      (r) => r._id?.toString() === replyId,
    );
    if (replyIndex === undefined || replyIndex === -1) {
      throw new HttpError("Reply not found", 404);
    }

    const reply = review.replies![replyIndex];
    if (reply.author.toString() !== authorId) {
      throw new HttpError("Unauthorized to delete this reply", 403);
    }

    review.replies!.splice(replyIndex, 1);
    await review.save();

    // Populate nested fields
    const populatedReview = await Review.findById(reviewObjectId)
      .populate("reviewer", "fullName profilePicture email")
      .populate("reviewee", "fullName profilePicture email")
      .populate("listingId", "title location");

    return populatedReview;
  }
}
