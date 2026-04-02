import mongoose from "mongoose";
import Booking from "../../../src/models/booking.model";
import { NotificationModel } from "../../../src/models/notification.model";

describe("Model Schemas", () => {
  test("Booking model: should fail validation when required fields are missing", () => {
    const booking = new Booking({});
    const error = booking.validateSync();

    expect(error).toBeDefined();
    expect(error?.errors).toHaveProperty("listingId");
    expect(error?.errors).toHaveProperty("customerId");
    expect(error?.errors).toHaveProperty("hostId");
    expect(error?.errors).toHaveProperty("checkInDate");
    expect(error?.errors).toHaveProperty("checkOutDate");
    expect(error?.errors).toHaveProperty("totalNights");
    expect(error?.errors).toHaveProperty("pricePerNight");
    expect(error?.errors).toHaveProperty("totalPrice");
  });

  test("Notification model: should set default read=false and createdAt", () => {
    const notification = new NotificationModel({
      user: new mongoose.Types.ObjectId(),
      message: "Test notification",
    });

    const error = notification.validateSync();

    expect(error).toBeUndefined();
    expect(notification.read).toBe(false);
    expect(notification.createdAt).toBeInstanceOf(Date);
  });
});
