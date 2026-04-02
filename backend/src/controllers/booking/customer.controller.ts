// import { Request, Response } from "express";
// import { BookingService } from "../../services/booking/booking.service";
// import { AuthRequest } from "../../middlewares/auth.middleware";
// import { HttpError } from "../../error/http-error";
// import { sendPushNotification } from "../../services/notification/notification.service";

// const bookingService = new BookingService();

// export class CustomerBookingController {
//   // Create a new booking
//   async createBooking(req: Request, res: Response) {
//     try {
//       const { listingId, checkInDate, checkOutDate } = req.body;
//       if (!listingId || !checkInDate || !checkOutDate) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Missing required fields" });
//       }
//       try {
//         const booking = await bookingService.createBooking({
//           listingId,
//           checkInDate: new Date(checkInDate),
//           checkOutDate: new Date(checkOutDate),
//           customerId: (req as AuthRequest).user._id.toString(),
//         });
//         res.status(201).json({
//           success: true,
//           message: "Booking created successfully",
//           booking,
//         });
//       } catch (error: any) {
//         res.status(500).json({ success: false, message: error.message });
//       }
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   // Get all bookings for this customer
//   async getMyBookings(req: Request, res: Response) {
//     try {
//       const { status, page = "1", limit = "10" } = req.query;
//       const bookings = await bookingService.getCustomerBookings(
//         (req as AuthRequest).user._id.toString(),
//         {
//           status: status as string,
//           page: Number(page),
//           limit: Number(limit),
//         },
//       );
//       res.json({ success: true, ...bookings });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   // Cancel booking
//   async cancelBooking(req: Request, res: Response) {
//     try {
//       const { id } = req.params;
//       const customerId = (req as AuthRequest).user._id.toString();
//       const booking = await bookingService.cancelBooking(id, customerId);
//       res.json({
//         success: true,
//         message: "Booking cancelled successfully",
//         booking,
//       });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   // Check availability of listing
//   async checkAvailability(req: Request, res: Response) {
//     try {
//       const { listingId, checkInDate, checkOutDate } = req.query;
//       if (!listingId || !checkInDate || !checkOutDate) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Missing required parameters" });
//       }
//       const isAvailable = await bookingService.checkAvailability(
//         listingId as string,
//         new Date(checkInDate as string),
//         new Date(checkOutDate as string),
//       );
//       res.json({ success: true, isAvailable });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   // Save or unsave a booking (favorite/unfavorite)
//   async toggleSaveBooking(req: Request, res: Response) {
//     try {
//       const bookingId = req.params.id;
//       const userId = (req as AuthRequest).user._id;
//       const result = await bookingService.toggleSaveBooking(bookingId, userId);
//       res.json({ success: true, ...result });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   // Get all saved bookings for this customer
//   async getSavedBookings(req: Request, res: Response) {
//     try {
//       const userId = (req as AuthRequest).user._id;
//       const bookings = await bookingService.getSavedBookings(userId);
//       res.json({ success: true, bookings });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   // After creating booking
// }

import { Request, Response } from "express";
import { BookingService } from "../../services/booking/booking.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { HttpError } from "../../error/http-error";
import {
  sendPushNotification,
  sendSocketNotification,
} from "../../services/notification/notification.service";

const bookingService = new BookingService();

export class CustomerBookingController {
  // Get booking by ID
  async getBookingById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const customerId = (req as AuthRequest).user._id.toString();

      const booking = await bookingService.getBookingById(id, customerId);

      res.json({ success: true, booking });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Create a new booking
  async createBooking(req: Request, res: Response) {
    try {
      const { listingId, checkInDate, checkOutDate } = req.body;
      if (!listingId || !checkInDate || !checkOutDate) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }

      const customerId = (req as AuthRequest).user._id.toString();

      const booking = await bookingService.createBooking({
        listingId,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        customerId,
      });

      // Send notification to host about new booking
      if (booking.hostId) {
        const notificationPayload = {
          title: "New Booking",
          body: `You have a new booking from ${(req as AuthRequest).user.fullName}`,
          data: {
            type: "booking_created",
            bookingId: booking._id.toString(),
            link: `/dashboard/host/bookings/${booking._id.toString()}`,
          },
        };

        // Push notification (expects hostId as string[])
        await sendPushNotification(
          [booking.hostId.toString()],
          notificationPayload.title,
          notificationPayload.body,
          notificationPayload.data,
        );

        // Real-time Socket.io notification
        sendSocketNotification(booking.hostId.toString(), notificationPayload);
      }

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

  // Get all bookings for this customer
  async getMyBookings(req: Request, res: Response) {
    try {
      const { status, page = "1", limit = "10" } = req.query;
      const customerId = (req as AuthRequest).user._id.toString();

      const bookings = await bookingService.getCustomerBookings(customerId, {
        status: status as string,
        page: Number(page),
        limit: Number(limit),
      });

      res.json({ success: true, ...bookings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Cancel booking
  async cancelBooking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const customerId = (req as AuthRequest).user._id.toString();

      const booking = await bookingService.cancelBooking(id, customerId);

      // Notify host about cancellation
      if (booking.hostId) {
        const notificationPayload = {
          title: "Booking Cancelled",
          body: `${(req as AuthRequest).user.fullName} cancelled their booking.`,
          data: {
            type: "booking_cancelled",
            bookingId: booking._id.toString(),
            link: `/dashboard/host/bookings/${booking._id.toString()}`,
          },
        };

        await sendPushNotification(
          [booking.hostId.toString()],
          notificationPayload.title,
          notificationPayload.body,
          notificationPayload.data,
        );
        sendSocketNotification(booking.hostId.toString(), notificationPayload);
      }

      res.json({
        success: true,
        message: "Booking cancelled successfully",
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

  // Check availability of listing
  async checkAvailability(req: Request, res: Response) {
    try {
      const { listingId, checkInDate, checkOutDate } = req.query;
      if (!listingId || !checkInDate || !checkOutDate) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required parameters" });
      }

      const isAvailable = await bookingService.checkAvailability(
        listingId as string,
        new Date(checkInDate as string),
        new Date(checkOutDate as string),
      );

      res.json({ success: true, isAvailable });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Save or unsave a booking (favorite/unfavorite)
  async toggleSaveBooking(req: Request, res: Response) {
    try {
      const bookingId = req.params.id;
      const userId = (req as AuthRequest).user._id;
      const result = await bookingService.toggleSaveBooking(bookingId, userId);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get all saved bookings for this customer
  async getSavedBookings(req: Request, res: Response) {
    try {
      const userId = (req as AuthRequest).user._id;
      const bookings = await bookingService.getSavedBookings(userId);
      res.json({ success: true, bookings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
