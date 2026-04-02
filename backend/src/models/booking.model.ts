import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  listingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  checkInDate: Date;
  checkOutDate: Date;
  totalNights: number;
  pricePerNight: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "refunded";
  createdAt: Date;
  updatedAt: Date;
  savedBy?: mongoose.Types.ObjectId[];
}

const BookingSchema: Schema = new Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
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
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    totalNights: { type: Number, required: true },
    pricePerNight: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model<IBooking>("Booking", BookingSchema);
