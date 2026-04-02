import { UserModel, IUser } from "../models/user.model";
import { HttpError } from "../error/http-error";
import { JWT_SECRET } from "../config";
import jwt from "jsonwebtoken";
import { CreateUserDTOType } from "../dtos/auth/register.dto";
import { loginUserDTO } from "../dtos/auth/login.dto";
import { sendEmail } from "../config/email";
import bcrypt from "bcrypt";

const clientURL = process.env.clientURL as string;

export class UserService {
  // REGISTER USER
  async createUser(data: CreateUserDTOType) {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) throw new HttpError("Email already in use", 403);

    // Default role to 'customer'
    const role: "customer" | "host" | "admin" = data.role || "customer";

    // Create user (password hashed automatically in pre-save hook)
    const newUser = await UserModel.create({
      fullName: data.fullName,
      email: normalizedEmail,
      password: data.password,
      phoneNumber: data.phoneNumber,
      address: data.address,
      role,
      profilePicture: data.profilePicture || "",
    });

    // Generate JWT
    const token = newUser.getSignedJwtToken();

    return {
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        password: newUser.password,
        address: newUser.address,
        role: newUser.role,
        profilePicture: newUser.profilePicture,
      },
    };
  }

  // LOGIN USER
  async loginUser(data: loginUserDTO) {
    const normalizedEmail = data.email.trim().toLowerCase();

    const duplicateEmailUsers = await UserModel.countDocuments({
      email: normalizedEmail,
    });
    if (duplicateEmailUsers > 1) {
      throw new HttpError(
        "Duplicate accounts detected for this email. Please contact support.",
        409,
      );
    }

    // Find user and include password
    const user = await UserModel.findOne({ email: normalizedEmail }).select(
      "+password",
    );
    if (!user) throw new HttpError("Invalid credentials", 401);

    const isPasswordValid = await user.matchPassword(data.password);
    if (!isPasswordValid) throw new HttpError("Invalid credentials", 401);

    const tokenPayload = {
      id: user._id,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "30d" });
    return {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    };
  }

  // Get use
  // r by ID
  async getUserById(userId: string): Promise<IUser | null> {
    return UserModel.findById(userId);
  }

  async getPublicUserById(userId: string) {
    const user = await UserModel.findById(userId).select(
      "fullName email phoneNumber address profilePicture role createdAt",
    );
    if (!user) throw new HttpError("User not found", 404);

    return user;
  }

  // Update user profile
  async updateUser(userId: string, updateData: Partial<IUser>) {
    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    if (!updatedUser) throw new HttpError("User not found", 404);
    return {
      id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      address: updatedUser.address,
      role: updatedUser.role,
      profilePicture: updatedUser.profilePicture,
    };
  }

  async sendResetPasswordEmail(email?: string) {
    if (!email) {
      throw new HttpError("Email is required", 400);
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new HttpError("User not found", 404);
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiry
    const resetLink = `${clientURL}/reset-password?token=${token}`;
    const html = `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`;
    await sendEmail(user.email, "Password Reset", html);
    return user;
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email }).select("+password");
  }

  async comparePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  // GET ALL USERS WITH PAGINATION
  async getAllUsers(filters: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
  }) {
    const query: any = {};

    if (filters.role) {
      query.role = filters.role;
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

  // RESET PASSWORD
  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const user = await UserModel.findById(decoded.id);

      if (!user) {
        throw new HttpError("User not found", 404);
      }

      // Update password (will be hashed by pre-save hook)
      user.password = newPassword;
      await user.save();

      return { success: true, message: "Password reset successfully" };
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new HttpError("Reset password token expired", 401);
      }
      throw new HttpError("Invalid or expired reset token", 401);
    }
  }

  // UPDATE FCM TOKEN
  async updateFcmToken(userId: string, fcmToken: string) {
    if (!userId || !fcmToken)
      throw new HttpError("Missing userId or fcmToken", 400);
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { fcmTokens: fcmToken },
    });
  }
}
