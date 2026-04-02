import { Schema, model, Document, Types } from "mongoose";

export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
}

export enum MessageType {
  TEXT = "text",
  MEDIA = "media",
}

export enum DeleteType {
  FOR_ME = "for_me",
  FOR_EVERYONE = "for_everyone",
}

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  listing?: Types.ObjectId;
  content?: string;
  type: MessageType;
  media?: {
    url: string;
    mimeType: string;
    kind: "image" | "video";
    fileName?: string;
  }[];
  status: MessageStatus;
  read: boolean;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedFor: Types.ObjectId[]; // Array of user IDs who deleted this message
  deleteType?: DeleteType;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: false },
    content: { type: String, default: "" },
    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
    media: [
      {
        url: { type: String, required: true },
        mimeType: { type: String, required: true },
        kind: { type: String, enum: ["image", "video"], required: true },
        fileName: { type: String },
      },
    ],
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.SENT,
    },
    read: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
    deleteType: {
      type: String,
      enum: Object.values(DeleteType),
    },
  },
  { timestamps: true },
);

const Message = model<IMessage>("Message", messageSchema);

export default Message;
