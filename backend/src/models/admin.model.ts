import mongoose, { Document, Schema, Types } from "mongoose";

// Admin role enum
export enum AdminRole {
  ADMIN = "admin",
}

// Admin user document interface
export interface IAdmin extends Document {
  _id: Types.ObjectId;
  email: string;
  password?: string;
  fullName: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Admin schema
const adminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(AdminRole),
      default: AdminRole.ADMIN,
    },
    permissions: {
      type: [String],
      default: [],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model<IAdmin>("Admin", adminSchema);
