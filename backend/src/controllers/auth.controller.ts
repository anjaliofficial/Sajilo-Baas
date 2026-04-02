import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { UserModel } from "../models/user.model";
import jwt from "jsonwebtoken";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthController {
  async googleLogin(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Google token is required",
        });
      }

      // Verify the Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({
          success: false,
          message: "Invalid Google token",
        });
      }

      const { sub: googleId, email, name, picture } = payload;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Google account did not provide an email",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const duplicateEmailUsers = await UserModel.countDocuments({
        email: normalizedEmail,
      });

      if (duplicateEmailUsers > 1) {
        return res.status(409).json({
          success: false,
          message:
            "Duplicate accounts detected for this email. Please contact support.",
        });
      }

      // Check if user exists
      let user = await UserModel.findOne({ email: normalizedEmail });

      if (user) {
        // Update googleId if not set
        if (!user.googleId) {
          user.googleId = googleId;
          user.authProvider = "google";
          await user.save();
        }
      } else {
        // Create new user with Google info
        user = new UserModel({
          fullName: name || normalizedEmail.split("@")[0] || "User",
          email: normalizedEmail,
          phoneNumber: "+977", // Default placeholder
          address: "", // Empty for now
          googleId,
          authProvider: "google",
          profilePicture: picture,
          role: "customer",
          status: "active",
        });
        await user.save();
      }

      // Generate JWT token
      const jwtToken = user.getSignedJwtToken();

      res.cookie("token", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.status(200).json({
        success: true,
        message: "Google login successful",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          profilePicture: user.profilePicture,
          role: user.role,
        },
        token: jwtToken,
      });
    } catch (error: any) {
      console.error("Google login error:", error);
      res.status(401).json({
        success: false,
        message: error.message || "Google authentication failed",
      });
    }
  }
}
