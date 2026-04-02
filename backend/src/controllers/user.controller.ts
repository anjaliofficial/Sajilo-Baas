import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { CreateUserDTO } from "../dtos/auth/register.dto";
import { loginUserDTO } from "../dtos/auth/login.dto";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { HttpError } from "../error/http-error";
import { JWT_SECRET } from "../config";

const userService = new UserService();

export class UserController {
  async register(req: Request, res: Response) {
    try {
      const data = CreateUserDTO.parse(req.body);
      const result = await userService.createUser(data);

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: result.user,
        token: result.token,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res
          .status(400)
          .json({ success: false, message: "Email and password required" });

      const result = await userService.loginUser({ email, password });

      res.cookie("token", result.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        user: result.user,
        token: result.token,
      });
    } catch (err: any) {
      res.status(401).json({ success: false, message: err.message });
    }
  }

  // ============================
  // UPDATE PROFILE (Protected)
  // ============================
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id; // user injected by JWT middleware
      const updatedUser = await userService.updateUser(userId, req.body);

      res.status(200).json({
        success: true,
        user: updatedUser,
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
      }
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  // ============================
  // SEND RESET PASSWORD EMAIL
  // ============================
  async sendResetPasswordEmail(req: Request, res: Response) {
    try {
      const email = req.body.email || req.query.email;
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email is required" });
      }

      await userService.sendResetPasswordEmail(String(email));

      res.status(200).json({
        success: true,
        message: "Password reset email sent",
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
      }
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  // ============================
  // LOGOUT (optional)
  // ============================
  async logout(req: Request, res: Response) {
    // Clear the cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  }

  // ============================
  // GET ALL USERS (PAGINATION)
  // ============================
  async getAllUsers(req: Request, res: Response) {
    try {
      const { page = "1", limit = "10", search, role } = req.query;

      const users = await userService.getAllUsers({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        role: role as string,
      });

      res.status(200).json({
        success: true,
        ...users,
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
      }
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  async getPublicProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "User id is required" });
      }

      const user = await userService.getPublicUserById(id);

      res.status(200).json({ success: true, user });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  // ============================
  // RESET PASSWORD
  // ============================
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Token and new password are required",
        });
      }

      const result = await userService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
      }
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  // ============================
  // UPDATE FCM TOKEN
  // ============================
  async updateFcmToken(req: Request, res: Response) {
    const { userId, fcmToken } = req.body;
    if (!userId || !fcmToken) {
      return res.status(400).json({ message: "Missing userId or fcmToken" });
    }
    try {
      await userService.updateFcmToken(userId, fcmToken);
      return res.json({ success: true });
    } catch (err) {
      console.error("Error updating FCM token:", err);
      return res.status(500).json({ message: "Failed to update FCM token" });
    }
  }
}
