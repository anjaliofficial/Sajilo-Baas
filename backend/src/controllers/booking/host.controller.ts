// import { Request, Response } from "express";
// import { BookingService } from "../../services/booking/booking.service";
// import { AuthRequest } from "../../middlewares/auth.middleware";
// import { HttpError } from "../../error/http-error";

// const bookingService = new BookingService();

// export class HostBookingController {
//   // ...existing code...

//   // Create a booking (host can create for guests)
//   async createBooking(req: Request, res: Response) {
//     try {
//       const { listingId, checkInDate, checkOutDate, customerId } = req.body;
//       if (!listingId || !checkInDate || !checkOutDate || !customerId) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Missing required fields" });
//       }

//       const booking = await bookingService.createBooking({
//         listingId,
//         checkInDate: new Date(checkInDate),
//         checkOutDate: new Date(checkOutDate),
//         customerId,
//       });

//       res.status(201).json({
//         success: true,
//         message: "Booking created successfully",
//         booking,
//       });
//     } catch (error: any) {
//       if (error instanceof HttpError) {
//         return res
//           .status(error.statusCode)
//           .json({ success: false, message: error.message });
//       }
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   // ...existing code...

//   // Get all bookings for host's listings
//   async getHostBookings(req: Request, res: Response) {
//     try {
//       const hostId = (req as AuthRequest).user._id.toString();
//       const status = req.query.status as any;
//       const bookings = await bookingService.getHostBookings(hostId, { status });
//       res.json({ success: true, bookings });
//     } catch (error: any) {
//       res
//         .status(error.statusCode || 500)
//         .json({ success: false, message: error.message });
//     }
//   }

//   // Accept a booking
//   async acceptBooking(req: Request, res: Response) {
//     try {
//       const hostId = (req as AuthRequest).user._id.toString();
//       const bookingId = req.params.id;
//       const booking = await bookingService.acceptBooking(bookingId, hostId);
//       res.json({ success: true, message: "Booking accepted", booking });
//     } catch (error: any) {
//       res
//         .status(error.statusCode || 500)
//         .json({ success: false, message: error.message });
//     }
//   }

//   // Reject a booking
//   async rejectBooking(req: Request, res: Response) {
//     try {
//       const hostId = (req as AuthRequest).user._id.toString();
//       const bookingId = req.params.id;
//       const booking = await bookingService.rejectBooking(bookingId, hostId);
//       res.json({ success: true, message: "Booking rejected", booking });
//     } catch (error: any) {
//       res
//         .status(error.statusCode || 500)
//         .json({ success: false, message: error.message });
//     }
//   }

//   // Get dashboard stats
//   // ...existing code...

//   // Get dashboard statistics
//   async getDashboardStats(req: Request, res: Response) {
//     try {
//       const hostId = (req as AuthRequest).user._id.toString();
//       const stats = await bookingService.getHostDashboardStats(hostId);
//       res.json({ success: true, stats });
//     } catch (error: any) {
//       res
//         .status(error.statusCode || 500)
//         .json({ success: false, message: error.message });
//     }
//   }

//   // ...existing code...
// }

import { Request, Response } from "express";
import { BookingService } from "../../services/booking/booking.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { HttpError } from "../../error/http-error";
import { UserModel } from "../../models/user.model"; // User model for notifications
import { sendPushNotification } from "../../utils/notification.util"; // Push notification util
import { getIoInstance, getOnlineUsers } from "../../socket"; // Socket.io utils

const bookingService = new BookingService();

export class HostBookingController {
  // ================= CREATE BOOKING =================
  async createBooking(req: Request, res: Response) {
    try {
      const { listingId, checkInDate, checkOutDate, customerId } = req.body;
      if (!listingId || !checkInDate || !checkOutDate || !customerId) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }

      const booking = await bookingService.createBooking({
        listingId,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        customerId,
      });

      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        booking,
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ================= GET HOST BOOKINGS =================
  async getHostBookings(req: Request, res: Response) {
    try {
      const hostId = (req as AuthRequest).user._id.toString();
      const status = req.query.status as string | undefined;
      const bookings = await bookingService.getHostBookings(hostId, { status });
      res.json({ success: true, bookings });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  // ================= ACCEPT BOOKING =================
  async acceptBooking(req: Request, res: Response) {
    try {
      const hostId = (req as AuthRequest).user._id.toString();
      const bookingId = req.params.id;
      const booking = await bookingService.acceptBooking(bookingId, hostId);

      // Notify customer
      await this.notifyCustomer(
        booking.customerId.toString(),
        "Booking Accepted",
        `Your booking for ${booking.listingId} has been accepted by the host.`,
        { type: "booking_accepted", bookingId: booking._id.toString() },
      );

      res.json({ success: true, message: "Booking accepted", booking });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  // ================= REJECT BOOKING =================
  async rejectBooking(req: Request, res: Response) {
    try {
      const hostId = (req as AuthRequest).user._id.toString();
      const bookingId = req.params.id;
      const booking = await bookingService.rejectBooking(bookingId, hostId);

      // Notify customer
      await this.notifyCustomer(
        booking.customerId.toString(),
        "Booking Rejected",
        `Your booking for ${booking.listingId} has been rejected by the host.`,
        { type: "booking_rejected", bookingId: booking._id.toString() },
      );

      res.json({ success: true, message: "Booking rejected", booking });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  // ================= CANCEL BOOKING =================
  async cancelBooking(req: Request, res: Response) {
    try {
      const hostId = (req as AuthRequest).user._id.toString();
      const bookingId = req.params.id;
      const booking = await bookingService.cancelBooking(bookingId, hostId);

      // Notify customer
      await this.notifyCustomer(
        booking.customerId.toString(),
        "Booking Canceled",
        `Your booking for ${booking.listingId} has been canceled by the host.`,
        { type: "booking_canceled", bookingId: booking._id.toString() },
      );

      res.json({ success: true, message: "Booking canceled", booking });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  // ================= DASHBOARD STATS =================
  async getDashboardStats(req: Request, res: Response) {
    try {
      const hostId = (req as AuthRequest).user._id.toString();
      const stats = await bookingService.getHostDashboardStats(hostId);
      res.json({ success: true, stats });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  // ================= GET BOOKING DETAILS =================
  async getBookingDetails(req: Request, res: Response) {
    try {
      const bookingId = req.params.id;
      const booking = await bookingService.getBookingDetails(bookingId);
      // Only check for null/undefined, not void
      if (booking === null || booking === undefined) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }
      res.json({ success: true, booking });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  // ================= HELPER: NOTIFY CUSTOMER =================
  private async notifyCustomer(
    customerId: string,
    title: string,
    message: string,
    payload: Record<string, any>,
  ) {
    const customer = await UserModel.findById(customerId);
    if (!customer) return;

    // 1️⃣ Push notification
    if (customer.fcmTokens?.length > 0) {
      await sendPushNotification(customer.fcmTokens, title, message, {
        ...payload,
        link: `/dashboard/customer/bookings/${payload.bookingId || ""}`,
      });
    }

    // 2️⃣ Socket.io real-time notification
    const io = getIoInstance();
    const onlineUsers = getOnlineUsers();
    const customerSocketId = onlineUsers.get(customerId);
    if (io && customerSocketId) {
      io.to(customerSocketId).emit("bookingNotification", {
        title,
        message,
        ...payload,
      });
    }
  }
}
