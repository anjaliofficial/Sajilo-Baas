import mongoose, { Document, Schema } from "mongoose";

// Report reason enum
export enum ReportReason {
  SPAM = "spam",
  ABUSE = "abuse",
  HARASSMENT = "harassment",
  INAPPROPRIATE_CONTENT = "inappropriate_content",
  OTHER = "other",
}

// Report status enum
export enum ReportStatus {
  PENDING = "pending",
  REVIEWED = "reviewed",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}

// Reported message interface
export interface IReportedMessage extends Document {
  _id: mongoose.Types.ObjectId;
  messageId: string;
  reportedByUserId: string;
  reportedUserId: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;

  // 🔐 Captured content (stored here for admin review)
  capturedContent?: string;
  capturedMediaUrls?: string[];
  capturedMessageType?: string; // text, image, video, etc

  adminNotes?: string;
  actionTaken?: "warn" | "mute" | "ban" | "none";
  actionTakenBy?: string; // Admin ID
  actionTakenAt?: Date;

  // Audit: Track when admin viewed this report
  viewedByAdmin?: boolean;
  adminViewedAt?: Date;
  adminViewedCount?: number;

  createdAt: Date;
  updatedAt: Date;
}

// Reported message schema
const reportedMessageSchema = new Schema<IReportedMessage>(
  {
    messageId: {
      type: String,
      required: true,
      index: true,
    },
    reportedByUserId: {
      type: String,
      required: true,
      index: true,
    },
    reportedUserId: {
      type: String,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: Object.values(ReportReason),
      required: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.PENDING,
      index: true,
    },

    // 🔐 Captured content (stored when report is created)
    capturedContent: {
      type: String,
      maxlength: 5000,
    },
    capturedMediaUrls: {
      type: [String],
    },
    capturedMessageType: {
      type: String,
    },

    adminNotes: {
      type: String,
      maxlength: 1000,
    },
    actionTaken: {
      type: String,
      enum: ["warn", "mute", "ban", "none"],
    },
    actionTakenBy: {
      type: String,
      index: true,
    },
    actionTakenAt: {
      type: Date,
    },

    // Audit: Track admin views
    viewedByAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    adminViewedAt: {
      type: Date,
    },
    adminViewedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model<IReportedMessage>(
  "ReportedMessage",
  reportedMessageSchema,
);
