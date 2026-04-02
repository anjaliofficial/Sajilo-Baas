import mongoose, { Document, Schema } from "mongoose";

// Audit action enum
export enum AuditAction {
  // User management
  USER_BANNED = "user_banned",
  USER_MUTED = "user_muted",
  USER_UNMUTED = "user_unmuted",
  USER_UNBANNED = "user_unbanned",
  USER_UPLOAD_RESTRICTED = "user_upload_restricted",
  USER_RESTRICTION_LIFTED = "user_restriction_lifted",

  // Report handling
  REPORT_REVIEWED = "report_reviewed",
  REPORT_DISMISSED = "report_dismissed",
  REPORT_ACTION_TAKEN = "report_action_taken",

  // Admin login
  ADMIN_LOGIN = "admin_login",
  ADMIN_LOGOUT = "admin_logout",

  // System
  MESSAGE_DELETED = "message_deleted",
  GROUP_DISABLED = "group_disabled",
  GROUP_ENABLED = "group_enabled",
}

// Audit log interface
export interface IAuditLog extends Document {
  adminId: string;
  action: AuditAction;
  targetUserId?: string;
  targetEntityId?: string; // Message ID, Group ID, etc.
  targetEntityType?: string; // message, group, user, etc.
  details: Record<string, any>;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Audit log schema
const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },
    targetUserId: {
      type: String,
      index: true,
    },
    targetEntityId: {
      type: String,
    },
    targetEntityType: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    oldValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: true },
);

// Create index for date-based queries
auditLogSchema.index({ createdAt: -1 });

export default mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
