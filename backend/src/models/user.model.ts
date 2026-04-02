import mongoose, { Schema, Document, Model } from "mongoose";

// export interface IUser extends Document {
//   fullName: string;
//   email: string;
//   phoneNumber: string;
//   role: "customer" | "host" | "admin";
//   password: string;
//   profilePicture?: string;

export interface IUser extends Document {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "customer" | "host" | "admin";
  password: string;
  profilePicture?: string;
  address: string;
  status: "active" | "suspended" | "banned";
  fcmTokens: string[];
  googleId?: string;
  authProvider: "email" | "google";
  createdAt: Date;
  updatedAt: Date;
  getSignedJwtToken(): string;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phoneNumber: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "host", "admin"],
      default: "customer",
    },
    password: { type: String, required: false, select: false },
    profilePicture: { type: String, default: "" },
    address: { type: String, required: false },
    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },
    fcmTokens: { type: [String], default: [] },
    googleId: { type: String, default: null, sparse: true },
    authProvider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
  },
  { timestamps: true },
);

// Pre-save hook to hash password
userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const bcrypt = await import("bcryptjs");
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to generate JWT
userSchema.methods.getSignedJwtToken = function (): string {
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET || "secret",
    {
      expiresIn: process.env.JWT_EXPIRE || "1h",
    },
  );
};

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  const bcrypt = await import("bcryptjs");
  return await bcrypt.compare(enteredPassword, this.password);
};

export const UserModel: Model<IUser> = mongoose.model<IUser>(
  "User",
  userSchema,
);
