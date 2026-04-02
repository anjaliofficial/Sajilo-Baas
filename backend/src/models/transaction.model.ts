import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  bookingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  amount: number;
  method: "credit_card" | "debit_card" | "paypal" | "bank_transfer" | "cash";
  status: "pending" | "completed" | "failed" | "refunded";
  transactionDetails: {
    transactionId?: string;
    reference?: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "bank_transfer", "cash"],
      default: "credit_card",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    transactionDetails: {
      transactionId: { type: String, default: "" },
      reference: { type: String, default: "" },
      notes: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);
