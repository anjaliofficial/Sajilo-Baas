import Booking from "../../models/booking.model";
import Listing from "../../models/listing.model";
import { HttpError } from "../../error/http-error";
import { UserModel } from "../../models/user.model";
import mongoose from "mongoose";
import { sendSocketNotification } from "../notification/notification.service";

export class BookingService {
  // -----------------------
  // Host: Get booking details (for hosts viewing any booking)
  // -----------------------
  async getBookingDetails(bookingId: string) {
    const booking = await Booking.findById(bookingId)
      .populate("listingId", "title location images pricePerNight coordinates")
      .populate("customerId", "fullName email phoneNumber")
      .populate("hostId", "fullName email phoneNumber");

    if (!booking) {
      throw new HttpError("Booking not found", 404);
    }

    return booking;
  }

  // -----------------------
  // Customer: Get booking by ID
  // -----------------------
  async getBookingById(bookingId: string, customerId: string) {
    const booking = await Booking.findById(bookingId)
      .populate("listingId", "title location images pricePerNight coordinates")
      .populate("hostId", "fullName email phoneNumber");

    if (!booking) {
      throw new HttpError("Booking not found", 404);
    }

    // Verify the customer owns this booking
    if (booking.customerId.toString() !== customerId) {
      throw new HttpError("Unauthorized", 403);
    }

    return booking;
  }

  // Customer: Save/Unsave a booking (favorite/unfavorite)
  async toggleSaveBooking(bookingId: string, userId: mongoose.Types.ObjectId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new HttpError("Booking not found", 404);
    // Ensure all savedBy are ObjectId
    booking.savedBy = (booking.savedBy || []).map(
      (id) => new mongoose.Types.ObjectId(id),
    );
    const alreadySaved = booking.savedBy.some((id) => id.equals(userId));
    if (alreadySaved) {
      booking.savedBy = booking.savedBy.filter((id) => !id.equals(userId));
      await booking.save();
      return { message: "Booking removed from favorites", saved: false };
    } else {
      booking.savedBy = [...booking.savedBy, userId];
      await booking.save();
      return { message: "Booking added to favorites", saved: true };
    }
  }

  // Customer: Get all saved bookings
  async getSavedBookings(userId: mongoose.Types.ObjectId) {
    const bookings = await Booking.find({ savedBy: userId })
      .populate("listingId", "title location images pricePerNight")
      .populate("hostId", "fullName phoneNumber")
      .sort({ createdAt: -1 });
    return bookings;
  }
  // -----------------------
  // HELPER: Calculate nights
  // -----------------------
  private calculateNights(checkIn: Date, checkOut: Date): number {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / millisecondsPerDay,
    );
  }

  // -----------------------
  // Customer: Check listing availability
  // -----------------------
  async checkAvailability(
    listingId: string,
    checkInDate: Date,
    checkOutDate: Date,
  ): Promise<boolean> {
    const listing = await Listing.findById(listingId);
    if (!listing) throw new HttpError("Listing not found", 404);

    if (
      checkInDate < listing.availableFrom ||
      checkOutDate > listing.availableTo
    )
      return false;

    const overlappingBookings = await Booking.countDocuments({
      listingId,
      status: { $nin: ["cancelled"] },
      $or: [
        {
          checkInDate: { $lt: checkOutDate },
          checkOutDate: { $gt: checkInDate },
        },
      ],
    });

    return overlappingBookings === 0;
  }

  // -----------------------
  // Customer: Create booking
  // -----------------------
  async createBooking(data: {
    listingId: string;
    checkInDate: Date;
    checkOutDate: Date;
    customerId: string;
  }): Promise<any> {
    const { listingId, checkInDate, checkOutDate, customerId } = data;

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    if (checkInDate < startOfToday || checkOutDate < startOfToday) {
      throw new HttpError("Booking dates cannot be in the past", 400);
    }

    if (checkInDate >= checkOutDate) {
      console.error(
        "[BOOKING SERVICE] Check-in date must be before check-out date",
        { checkInDate, checkOutDate },
      );
      throw new HttpError("Check-in date must be before check-out date", 400);
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      console.error("[BOOKING SERVICE] Listing not found", { listingId });
      throw new HttpError("Listing not found", 404);
    }

    const customer = await UserModel.findById(customerId);
    if (!customer) {
      console.error("[BOOKING SERVICE] Customer not found", { customerId });
      throw new HttpError("Customer not found", 404);
    }
    if (customer.status !== "active") {
      console.error("[BOOKING SERVICE] Account not active", {
        customerId,
        status: customer.status,
      });
      throw new HttpError("Account not active", 403);
    }

    const isAvailable = await this.checkAvailability(
      listingId,
      checkInDate,
      checkOutDate,
    );
    if (!isAvailable) {
      console.warn("[BOOKING SERVICE] Selected dates are not available", {
        listingId,
        checkInDate,
        checkOutDate,
      });
      throw new HttpError(
        "The selected dates are already booked. Please choose different dates.",
        400,
      );
    }

    const totalNights = this.calculateNights(checkInDate, checkOutDate);
    if (totalNights < listing.minStay) {
      console.error("[BOOKING SERVICE] Minimum stay not met", {
        totalNights,
        minStay: listing.minStay,
      });
      throw new HttpError(`Minimum stay is ${listing.minStay} nights`, 400);
    }

    const totalPrice = listing.pricePerNight * totalNights;

    const booking = await Booking.create({
      listingId,
      customerId,
      hostId: listing.hostId,
      checkInDate,
      checkOutDate,
      totalNights,
      pricePerNight: listing.pricePerNight,
      totalPrice,
      status: "pending",
      paymentStatus: "unpaid",
    });

    return await booking.populate([
      { path: "listingId", select: "title location images" },
      { path: "customerId", select: "fullName email phoneNumber" },
      { path: "hostId", select: "fullName email phoneNumber" },
    ]);
  }

  // -----------------------
  // Customer: Get bookings by customer
  // -----------------------
  async getCustomerBookings(
    customerId: string,
    filters?: { status?: string; page?: number; limit?: number },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const query: any = { customerId };
    if (filters?.status) query.status = filters.status;

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("listingId", "title location images pricePerNight")
        .populate("hostId", "fullName phoneNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);

    return { bookings, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // -----------------------
  // Customer: Cancel booking
  // -----------------------
  async cancelBooking(bookingId: string, customerId: string) {
    console.log("[CANCEL SERVICE] Looking for booking:", bookingId);

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log("[CANCEL SERVICE] Booking not found");
      throw new HttpError("Booking not found", 404);
    }

    console.log(
      "[CANCEL SERVICE] Found booking, customer:",
      booking.customerId.toString(),
    );
    console.log("[CANCEL SERVICE] Request from customer:", customerId);

    if (booking.customerId.toString() !== customerId) {
      console.log("[CANCEL SERVICE] Unauthorized - customer mismatch");
      throw new HttpError("Unauthorized", 403);
    }

    console.log("[CANCEL SERVICE] Current status:", booking.status);

    if (booking.status !== "pending") {
      console.log("[CANCEL SERVICE] Cannot cancel - status is not pending");
      throw new HttpError("Only pending bookings can be cancelled", 409);
    }

    booking.status = "cancelled";
    await booking.save();

    console.log("[CANCEL SERVICE] Booking cancelled successfully");

    // Create notification for host
    const { NotificationModel } = require("../../models/notification.model");
    let notification;
    try {
      notification = await NotificationModel.create({
        user: booking.hostId,
        message: `A booking was cancelled by the customer.`,
        link: `/admin/bookings/${booking._id}`,
      });
    } catch (err) {
      console.error("Notification creation failed (cancel):", err);
    }
    // Send real-time notification
    if (notification) {
      sendSocketNotification(String(booking.hostId), {
        ...notification.toObject(),
        _id: notification._id.toString(),
      });
    }

    // Send FCM push notification to host
    try {
      const host = await UserModel.findById(booking.hostId);
      const fcmTokens = host?.fcmTokens || [];
      if (fcmTokens.length > 0) {
        const {
          sendPushNotification,
        } = require("../notification/notification.service");
        await sendPushNotification(
          fcmTokens,
          "Booking Cancelled",
          `A booking was cancelled by the customer.`,
          { bookingId: booking._id.toString() },
        );
      }
    } catch (err) {
      console.error("FCM push notification failed (cancel):", err);
    }

    return booking.populate([
      { path: "listingId", select: "title" },
      { path: "customerId", select: "fullName" },
    ]);
  }

  // -----------------------
  // Host: Get bookings for host's listings
  // -----------------------
  async getHostBookings(hostId: string, filters?: { status?: string }) {
    const query: any = { hostId };
    if (filters?.status) query.status = filters.status;

    const bookings = await Booking.find(query)
      .populate("listingId", "title location pricePerNight")
      .populate("customerId", "fullName email phoneNumber")
      .sort({ createdAt: -1 });

    return bookings;
  }

  // -----------------------
  // Host: Accept booking
  // -----------------------
  async acceptBooking(bookingId: string, hostId: string) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new HttpError("Booking not found", 404);
    if (booking.hostId.toString() !== hostId)
      throw new HttpError("Unauthorized", 403);
    if (booking.status !== "pending")
      throw new HttpError("Only pending bookings can be accepted", 409);

    booking.status = "confirmed";
    await booking.save();

    // Create notification for customer
    const { NotificationModel } = require("../../models/notification.model");
    const notification = await NotificationModel.create({
      user: booking.customerId,
      message: `Your booking has been accepted by the host.`,
      link: `/public/bookings/${booking._id}`,
    });
    // Send real-time notification
    sendSocketNotification(String(booking.customerId), {
      ...notification.toObject(),
      _id: notification._id.toString(),
    });

    return booking.populate([
      { path: "listingId", select: "title location" },
      { path: "customerId", select: "fullName email phoneNumber" },
    ]);
  }

  // -----------------------
  // Host: Reject booking
  // -----------------------
  async rejectBooking(bookingId: string, hostId: string) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new HttpError("Booking not found", 404);
    if (booking.hostId.toString() !== hostId)
      throw new HttpError("Unauthorized", 403);
    if (booking.status !== "pending")
      throw new HttpError("Only pending bookings can be rejected", 409);

    booking.status = "cancelled";
    await booking.save();

    // Create notification for customer
    const { NotificationModel } = require("../../models/notification.model");
    const notification = await NotificationModel.create({
      user: booking.customerId,
      message: `Your booking has been rejected by the host.`,
      link: `/public/bookings/${booking._id}`,
    });
    // Send real-time notification
    sendSocketNotification(String(booking.customerId), {
      ...notification.toObject(),
      _id: notification._id.toString(),
    });

    return booking.populate([
      { path: "listingId", select: "title location" },
      { path: "customerId", select: "fullName email phoneNumber" },
    ]);
  }

  // -----------------------
  // Host: Dashboard Stats
  // -----------------------
  async getHostDashboardStats(hostId: string) {
    const bookings = await Booking.find({ hostId });

    const totalBookings = bookings.length;

    const pendingBookings = bookings.filter(
      (b) => b.status === "pending",
    ).length;

    const confirmedBookings = bookings.filter(
      (b) => b.status === "confirmed",
    ).length;

    const cancelledBookings = bookings.filter(
      (b) => b.status === "cancelled",
    ).length;

    const totalRevenue = bookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + b.totalPrice, 0);

    // Current month revenue
    const now = new Date();
    const monthlyRevenue = bookings
      .filter(
        (b) =>
          b.status === "confirmed" &&
          b.createdAt.getMonth() === now.getMonth() &&
          b.createdAt.getFullYear() === now.getFullYear(),
      )
      .reduce((sum, b) => sum + b.totalPrice, 0);

    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      totalRevenue,
      monthlyRevenue,
    };
  }
}
