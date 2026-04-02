import jwt from "jsonwebtoken";
import { UserModel } from "../../models/user.model";
import Listing from "../../models/listing.model";
import Booking from "../../models/booking.model";
import Message from "../../models/message.model";
// import Transaction from "../../models/transaction.model"; // Transaction management removed - not needed for now
import { HttpError } from "../../error/http-error";
import { JWT_SECRET } from "../../config";
import { loginUserDTO } from "../../dtos/auth/login.dto";

export class AdminUserService {
  // ======================
  // ADMIN LOGIN
  // ======================
  async loginAdmin(data: loginUserDTO) {
    const admin = await UserModel.findOne({
      email: data.email,
      role: "admin",
    }).select("+password");

    if (!admin) {
      throw new HttpError("Invalid admin credentials", 401);
    }

    const isMatch = await admin.matchPassword(data.password);
    if (!isMatch) {
      throw new HttpError("Invalid admin credentials", 401);
    }

    const token = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return {
      token,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  // ======================
  // USER MANAGEMENT
  // ======================
  async getAllUsers(filters: {
    role?: string;
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const query: any = {};

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { fullName: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
        { phoneNumber: { $regex: filters.search, $options: "i" } },
      ];
    }

    const skip = (filters.page - 1) * filters.limit;

    const [users, total] = await Promise.all([
      UserModel.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit),
      UserModel.countDocuments(query),
    ]);

    return {
      users,
      total,
      page: filters.page,
      limit: filters.limit,
      pages: Math.ceil(total / filters.limit),
    };
  }

  async getUserById(id: string) {
    const user = await UserModel.findById(id).select("-password");
    if (!user) throw new HttpError("User not found", 404);
    return user;
  }

  async createUser(data: any) {
    const existingUser = await UserModel.findOne({ email: data.email });
    if (existingUser) throw new HttpError("Email already in use", 409);

    const user = await UserModel.create(data);
    return user;
  }

  async updateUserStatus(
    id: string,
    status: "active" | "suspended" | "banned",
  ) {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).select("-password");
    if (!user) throw new HttpError("User not found", 404);
    return user;
  }

  async deleteUser(id: string) {
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) throw new HttpError("User not found", 404);
    return true;
  }

  async updateUser(id: string, updateData: any) {
    const user = await UserModel.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password");
    if (!user) throw new HttpError("User not found", 404);
    return user;
  }

  // ======================
  // LISTING MANAGEMENT
  // ======================
  async getAllListings(filters: {
    status?: string;
    propertyType?: string;
    search?: string;
    hostId?: string;
    page: number;
    limit: number;
  }) {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.propertyType) {
      query.propertyType = filters.propertyType;
    }

    if (filters.hostId) {
      query.hostId = filters.hostId;
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { location: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
      ];
    }

    const skip = (filters.page - 1) * filters.limit;

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate("hostId", "fullName email phoneNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit),
      Listing.countDocuments(query),
    ]);

    return {
      listings,
      total,
      page: filters.page,
      limit: filters.limit,
      pages: Math.ceil(total / filters.limit),
    };
  }

  async getListingById(id: string) {
    const listing = await Listing.findById(id).populate(
      "hostId",
      "fullName email phoneNumber address",
    );
    if (!listing) throw new HttpError("Listing not found", 404);
    return listing;
  }

  async updateListingStatus(
    id: string,
    status: "pending" | "approved" | "rejected",
    reason?: string,
  ) {
    const updateData: any = { status };
    const listing = await Listing.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("hostId", "fullName email phoneNumber");
    if (!listing) throw new HttpError("Listing not found", 404);
    return listing;
  }

  async deleteListing(id: string) {
    const listing = await Listing.findByIdAndDelete(id);
    if (!listing) throw new HttpError("Listing not found", 404);
    return true;
  }

  // ======================
  // BOOKING MANAGEMENT
  // ======================
  async getAllBookings(filters: {
    status?: string;
    paymentStatus?: string;
    hostId?: string;
    customerId?: string;
    page: number;
    limit: number;
  }) {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    if (filters.hostId) {
      query.hostId = filters.hostId;
    }

    if (filters.customerId) {
      query.customerId = filters.customerId;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("listingId", "title location")
        .populate("customerId", "fullName email phoneNumber")
        .populate("hostId", "fullName email phoneNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit),
      Booking.countDocuments(query),
    ]);

    return {
      bookings,
      total,
      page: filters.page,
      limit: filters.limit,
      pages: Math.ceil(total / filters.limit),
    };
  }

  async getBookingById(id: string) {
    const booking = await Booking.findById(id)
      .populate("listingId", "title location pricePerNight")
      .populate("customerId", "fullName email phoneNumber address")
      .populate("hostId", "fullName email phoneNumber address");
    if (!booking) throw new HttpError("Booking not found", 404);
    return booking;
  }

  async updateBookingStatus(
    id: string,
    status: "pending" | "confirmed" | "cancelled" | "completed",
  ) {
    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    )
      .populate("listingId", "title location")
      .populate("customerId", "fullName email")
      .populate("hostId", "fullName email");
    if (!booking) throw new HttpError("Booking not found", 404);
    return booking;
  }

  // ======================
  // TRANSACTION MANAGEMENT - REMOVED (Not needed for now)
  // ======================
  // async getAllTransactions(filters: {
  //   status?: string;
  //   method?: string;
  //   page: number;
  //   limit: number;
  // }) {
  //   const query: any = {};
  //   if (filters.status) {
  //     query.status = filters.status;
  //   }
  //   if (filters.method) {
  //     query.method = filters.method;
  //   }
  //   const skip = (filters.page - 1) * filters.limit;
  //   const [transactions, total] = await Promise.all([
  //     Transaction.find(query)
  //       .populate("bookingId", "checkInDate checkOutDate")
  //       .populate("customerId", "fullName email")
  //       .populate("hostId", "fullName email")
  //       .sort({ createdAt: -1 })
  //       .skip(skip)
  //       .limit(filters.limit),
  //     Transaction.countDocuments(query),
  //   ]);
  //   const totalAmount = await Transaction.aggregate([
  //     { $match: query },
  //     { $group: { _id: null, total: { $sum: "$amount" } } },
  //   ]);
  //   return {
  //     transactions,
  //     total,
  //     totalAmount: totalAmount[0]?.total || 0,
  //     page: filters.page,
  //     limit: filters.limit,
  //     pages: Math.ceil(total / filters.limit),
  //   };
  // }

  // ======================
  // DASHBOARD STATS
  // ======================
  async getDashboardStats() {
    const [
      totalUsers,
      totalCustomers,
      totalHosts,
      totalListings,
      pendingListings,
      approvedListings,
      totalBookings,
      completedBookings,
      totalMessages,
      // totalRevenue, // Transaction management removed - not needed for now
      recentUsers,
      recentListings,
      recentBookings,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ role: "customer" }),
      UserModel.countDocuments({ role: "host" }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: "pending" }),
      Listing.countDocuments({ status: "approved" }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "completed" }),
      Message.countDocuments(),
      // Transaction management removed - not needed for now
      // Transaction.aggregate([
      //   { $match: { status: "completed" } },
      //   { $group: { _id: null, total: { $sum: "$amount" } } },
      // ]),
      UserModel.find()
        .select("fullName email role status createdAt")
        .sort({ createdAt: -1 })
        .limit(5),
      Listing.find()
        .select("title location status createdAt")
        .populate("hostId", "fullName")
        .sort({ createdAt: -1 })
        .limit(5),
      Booking.find()
        .select("status totalPrice createdAt")
        .populate("customerId", "fullName")
        .populate("listingId", "title")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        hosts: totalHosts,
        activeUsers: await UserModel.countDocuments({ status: "active" }),
        suspendedUsers: await UserModel.countDocuments({ status: "suspended" }),
        bannedUsers: await UserModel.countDocuments({ status: "banned" }),
      },
      listings: {
        total: totalListings,
        pending: pendingListings,
        approved: approvedListings,
        rejected: await Listing.countDocuments({ status: "rejected" }),
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        pending: await Booking.countDocuments({ status: "pending" }),
        confirmed: await Booking.countDocuments({ status: "confirmed" }),
        cancelled: await Booking.countDocuments({ status: "cancelled" }),
      },
      messages: {
        total: totalMessages,
      },
      // Transaction management removed - not needed for now
      // transactions: {
      //   totalRevenue: totalRevenue[0]?.total || 0,
      //   completed: await Transaction.countDocuments({ status: "completed" }),
      //   pending: await Transaction.countDocuments({ status: "pending" }),
      //   failed: await Transaction.countDocuments({ status: "failed" }),
      //   refunded: await Transaction.countDocuments({ status: "refunded" }),
      // },
      recentActivity: {
        users: recentUsers,
        listings: recentListings,
        bookings: recentBookings,
      },
    };
  }
}
