import mongoose, { Document, Schema } from "mongoose";

// Restriction type enum
export enum RestrictionType {
  MUTED = "muted",
  BANNED = "banned",
  UPLOAD_RESTRICTED = "upload_restricted",
}

// User restriction interface
export interface IUserRestriction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  restrictionType: RestrictionType;
  reason: string;
  isPermanent: boolean;
  expiresAt?: Date;
  restrictions?: {
    canSendMessages?: boolean;
    canUploadMedia?: boolean;
    mediaTypesAllowed?: ("image" | "video" | "audio")[];
    maxFileSize?: number; // in bytes
    messageLimitPerHour?: number;
  };
  appliedBy: string; // Admin ID
  appliedAt: Date;
  appealedAt?: Date;
  appealReason?: string;
  updatedAt: Date;
}

// User restriction schema
const userRestrictionSchema = new Schema<IUserRestriction>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    restrictionType: {
      type: String,
      enum: Object.values(RestrictionType),
      required: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    isPermanent: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
    restrictions: {
      canSendMessages: { type: Boolean, default: true },
      canUploadMedia: { type: Boolean, default: true },
      mediaTypesAllowed: {
        type: [String],
        enum: ["image", "video", "audio"],
        default: ["image", "video", "audio"],
      },
      maxFileSize: { type: Number }, // bytes
      messageLimitPerHour: { type: Number },
    },
    appliedBy: {
      type: String,
      required: true,
      index: true,
    },
    appliedAt: {
      type: Date,
      default: () => new Date(),
    },
    appealedAt: {
      type: Date,
    },
    appealReason: {
      type: String,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

export default mongoose.model<IUserRestriction>(
  "UserRestriction",
  userRestrictionSchema,
);
