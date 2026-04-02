import { Request, Response } from "express";
import { AdminUserService } from "../../services/admin/admin.service";
import { loginUserDTO } from "../../dtos/auth/login.dto";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { HttpError } from "../../error/http-error";

const adminService = new AdminUserService();

export class AdminUserController {
  // ======================
  // ADMIN LOGIN
  // ======================
  async login(req: Request, res: Response) {
    try {
      const data = loginUserDTO.parse(req.body);
      const result = await adminService.loginAdmin(data);

      res.status(200).json({
        success: true,
        message: "Admin login successful",
        token: result.token,
        admin: result.admin,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || "Admin login failed",
      });
    }
  }

  // ======================
  // USER MANAGEMENT - GET ALL USERS
  // ======================
  async getAllUsers(req: Request, res: Response) {
    try {
      const { role, status, page = "1", limit = "20", search } = req.query;
      const users = await adminService.getAllUsers({
        role: role as string,
        status: status as string,
        search: search as string,
        page: Number(page),
        limit: Number(limit),
      });
      res.json({ success: true, ...users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ======================
  // USER MANAGEMENT - GET USER BY ID
  // ======================
  async getUserById(req: Request, res: Response) {
    try {
      const user = await adminService.getUserById(req.params.id);
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  // ======================
  // USER MANAGEMENT - CREATE USER
  // ======================
  async createUser(req: Request, res: Response) {
    try {
      const user = await adminService.createUser(req.body);
      res.status(201).json({ success: true, user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================
  // USER MANAGEMENT - SUSPEND USER
  // ======================
  async suspendUser(req: Request, res: Response) {
    try {
      const user = await adminService.updateUserStatus(
        req.params.id,
        "suspended",
      );
      res.json({
        success: true,
        message: "User suspended successfully",
        user,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================
  // USER MANAGEMENT - BAN USER
  // ======================
  async banUser(req: Request, res: Response) {
    try {
      const user = await adminService.updateUserStatus(req.params.id, "banned");
      res.json({
        success: true,
        message: "User banned successfully",
        user,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================
  // USER MANAGEMENT - ACTIVATE USER
  // ======================
  async activateUser(req: Request, res: Response) {
    try {
      const user = await adminService.updateUserStatus(req.params.id, "active");
      res.json({
        success: true,
        message: "User activated successfully",
        user,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================
  // USER MANAGEMENT - DELETE USER
  // ======================
  async deleteUser(req: Request, res: Response) {
    try {
      await adminService.deleteUser(req.params.id);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================
  // USER MANAGEMENT - UPDATE USER
  // ======================
  async updateUser(req: Request, res: Response) {
    try {
      const user = await adminService.updateUser(req.params.id, req.body);
      res.json({
        success: true,
        message: "User updated successfully",
        user,
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================
  // LISTING MANAGEMENT - GET ALL LISTINGS
  // ======================
  async getAllListings(req: Request, res: Response) {
    try {
      const {
        status,
        propertyType,
        page = "1",
        limit = "20",
        search,
        hostId,
      } = req.query;
      const listings = await adminService.getAllListings({
        status: status as string,
        propertyType: propertyType as string,
        search: search as string,
        hostId: hostId as string,
        page: Number(page),
        limit: Number(limit),
      });
      res.json({ success: true, ...listings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ======================
  // LISTING MANAGEMENT - GET LISTING BY ID
  // ======================
  async getListingById(req: Request, res: Response) {
    try {
      const listing = await adminService.getListingById(req.params.id);
      res.json({ success: true, listing });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  // ======================
  // LISTING MANAGEMENT - APPROVE LISTING
  // ======================
  async approveListing(req: Request, res: Response) {
    try {
      const listing = await adminService.updateListingStatus(
        req.params.id,
        "approved",
      );
      res.json({
        success: true,
        message: "Listing approved successfully",
        listing,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================
  // LISTING MANAGEMENT - REJECT LISTING
  // ======================
  async rejectListing(req: Request, res: Response) {
    try {
      const { reason } = req.body;
      const listing = await adminService.updateListingStatus(
        req.params.id,
        "rejected",
        reason,
      );
      res.json({
        success: true,
        message: "Listing rejected successfully",
        listing,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================
  // LISTING MANAGEMENT - DELETE LISTING
  // ======================
  async deleteListing(req: Request, res: Response) {
    try {
      await adminService.deleteListing(req.params.id);
      res.json({ success: true, message: "Listing deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================
  // BOOKING MANAGEMENT - GET ALL BOOKINGS
  // ======================
  async getAllBookings(req: Request, res: Response) {
    try {
      const {
        status,
        paymentStatus,
        page = "1",
        limit = "20",
        hostId,
        customerId,
      } = req.query;
      const bookings = await adminService.getAllBookings({
        status: status as string,
        paymentStatus: paymentStatus as string,
        hostId: hostId as string,
        customerId: customerId as string,
        page: Number(page),
        limit: Number(limit),
      });
      res.json({ success: true, ...bookings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ======================
  // BOOKING MANAGEMENT - GET BOOKING BY ID
  // ======================
  async getBookingById(req: Request, res: Response) {
    try {
      const booking = await adminService.getBookingById(req.params.id);
      res.json({ success: true, booking });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  // ======================
  // BOOKING MANAGEMENT - CONFIRM BOOKING
  // ======================
  async confirmBooking(req: Request, res: Response) {
    try {
      const booking = await adminService.updateBookingStatus(
        req.params.id,
        "confirmed",
      );
      res.json({
        success: true,
        message: "Booking confirmed successfully",
        booking,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================
  // BOOKING MANAGEMENT - CANCEL BOOKING
  // ======================
  async cancelBooking(req: Request, res: Response) {
    try {
      const booking = await adminService.updateBookingStatus(
        req.params.id,
        "cancelled",
      );
      res.json({
        success: true,
        message: "Booking cancelled successfully",
        booking,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================
  // TRANSACTION MANAGEMENT - REMOVED (Not needed for now)
  // ======================
  // async getAllTransactions(req: Request, res: Response) {
  //   try {
  //     const { status, method, page = "1", limit = "20" } = req.query;
  //     const transactions = await adminService.getAllTransactions({
  //       status: status as string,
  //       method: method as string,
  //       page: Number(page),
  //       limit: Number(limit),
  //     });
  //     res.json({ success: true, ...transactions });
  //   } catch (error: any) {
  //     res.status(500).json({ success: false, message: error.message });
  //   }
  // }

  // ======================
  // DASHBOARD STATS
  // ======================
  async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
