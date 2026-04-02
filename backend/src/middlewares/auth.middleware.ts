import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { HttpError } from "../error/http-error";
import { JWT_SECRET } from "../config";
import { UserService } from "../services/user.service";
import { IUser } from "../models/user.model";

// Extend Express Request globally
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Optional interface for stricter typing
export interface AuthRequest extends Request {
  user: IUser;
}

const userService = new UserService();
const AUTH_DEBUG = process.env.AUTH_DEBUG === "true";

// JWT authentication middleware
export const authorizedMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) token = authHeader.split(" ")[1];

    if (!token && req.cookies?.token) token = req.cookies.token;

    if (AUTH_DEBUG) {
      console.log("🔍 [AUTH MIDDLEWARE] Headers:", req.headers);
      console.log("🔍 [AUTH MIDDLEWARE] Cookies:", req.cookies);
      console.log("🔍 [AUTH MIDDLEWARE] Token found:", !!token);
    }

    if (!token) {
      if (AUTH_DEBUG) {
        console.error(
          "❌ [AUTH MIDDLEWARE] No token provided in headers or cookies",
        );
      }
      throw new HttpError("Unauthorized: No token provided", 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    if (!decoded?.id) throw new HttpError("Unauthorized: Invalid token", 401);

    const user = await userService.getUserById(decoded.id);
    if (!user) throw new HttpError("Unauthorized: User not found", 401);

    // default role
    if (!user.role) user.role = "customer";

    req.user = user;
    if (AUTH_DEBUG) {
      console.log(
        "[AUTH MIDDLEWARE] User authenticated:",
        user._id,
        "Role:",
        user.role,
      );
    }
    next();
  } catch (error: any) {
    return res.status(error.statusCode ?? 401).json({
      success: false,
      message: error.message || "Unauthorized",
    });
  }
};

// Role-based access control
export const roleMiddleware =
  (allowedRoles: Array<"admin" | "host" | "customer">) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError("Forbidden: No user info", 403);
      if (!allowedRoles.includes(req.user.role))
        throw new HttpError("Forbidden: Insufficient permissions", 403);
      next();
    } catch (error: any) {
      return res.status(error.statusCode ?? 403).json({
        success: false,
        message: error.message || "Forbidden",
      });
    }
  };
