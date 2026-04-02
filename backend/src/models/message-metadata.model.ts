import mongoose, { Document, Schema, Types } from "mongoose";

// Message metadata interface
export interface IMessageMetadata extends Document {
  _id: Types.ObjectId;
  messageId: string;
  senderId: string;
  receiverId: string;
  messageType: "text" | "image" | "video" | "audio" | "file";
  hasMedia: boolean;
  mediaCount?: number;
  mediaTypes?: ("image" | "video" | "audio" | "file")[];
  totalMediaSize?: number; // in bytes
  deliveryStatus: "sent" | "delivered" | "read";
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Message metadata schema
const messageMetadataSchema = new Schema<IMessageMetadata>(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    receiverId: {
      type: String,
      required: true,
      index: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "file"],
      default: "text",
    },
    hasMedia: {
      type: Boolean,
      default: false,
    },
    mediaCount: {
      type: Number,
      default: 0,
    },
    mediaTypes: {
      type: [String],
      enum: ["image", "video", "audio", "file"],
    },
    totalMediaSize: {
      type: Number,
    },
    deliveryStatus: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Create indexes for queries
messageMetadataSchema.index({ senderId: 1, createdAt: -1 });
messageMetadataSchema.index({ receiverId: 1, createdAt: -1 });

export default mongoose.model<IMessageMetadata>(
  "MessageMetadata",
  messageMetadataSchema,
);
