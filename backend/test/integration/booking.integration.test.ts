import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import userRoutes from "../../src/routes/user.routes";
import customerBookingRoutes from "../../src/routes/booking/customer.route";
import { UserModel } from "../../src/models/user.model";
import Listing from "../../src/models/listing.model";
import Booking from "../../src/models/booking.model";

jest.mock("mime", () => ({
  define: jest.fn(),
  getType: jest.fn(() => "application/json"),
}));

jest.mock("../../src/services/notification/notification.service", () => ({
  sendPushNotification: jest.fn(async () => undefined),
  sendSocketNotification: jest.fn(() => undefined),
}));

const request = require("supertest");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", userRoutes);
app.use("/api/bookings/customer", customerBookingRoutes);

describe("Booking API Integration", () => {
  const testPrefix = `integration-booking-${Date.now()}`;

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const today = new Date();
  const listingAvailableFrom = new Date(today);
  listingAvailableFrom.setDate(today.getDate() + 10);

  const listingAvailableTo = new Date(today);
  listingAvailableTo.setDate(today.getDate() + 120);

  const validCheckIn = new Date(today);
  validCheckIn.setDate(today.getDate() + 12);

  const validCheckOut = new Date(today);
  validCheckOut.setDate(today.getDate() + 15);

  const pastCheckIn = new Date(today);
  pastCheckIn.setDate(today.getDate() - 7);

  const pastCheckOut = new Date(today);
  pastCheckOut.setDate(today.getDate() - 5);

  let customerToken = "";
  let customerId = "";
  let hostId = "";
  let listingId = "";
  let bookingId = "";

  beforeAll(async () => {
    await UserModel.deleteMany({
      email: { $regex: `^${testPrefix}`, $options: "i" },
    });

    const host = await UserModel.create({
      fullName: "Booking Host",
      email: `${testPrefix}-host@example.com`,
      password: "password123",
      phoneNumber: "9800001001",
      address: "Kathmandu",
      role: "host",
      status: "active",
    });

    hostId = String(host._id);

    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Booking Customer",
        email: `${testPrefix}-customer@example.com`,
        password: "password123",
        confirmPassword: "password123",
        phoneNumber: "9800001002",
        address: "Lalitpur",
        role: "customer",
      });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.token).toBeDefined();

    customerToken = registerRes.body.token;
    customerId = String(registerRes.body.user._id);

    const listing = await Listing.create({
      title: `${testPrefix} Listing`,
      description: "Booking test property",
      location: "Lazimpat, Kathmandu",
      locationDetails: {
        city: "Kathmandu",
        neighborhood: "Lazimpat",
        fullAddress: "House 101",
      },
      propertyType: "apartment",
      amenities: ["wifi"],
      pricePerNight: 3000,
      availableFrom: listingAvailableFrom,
      availableTo: listingAvailableTo,
      minStay: 1,
      maxGuests: 2,
      cancellationPolicy: "moderate",
      houseRules: "No smoking",
      images: [],
      hostId,
      status: "approved",
    });

    listingId = String(listing._id);
  });

  afterAll(async () => {
    const bookingDeleteFilters: Record<string, unknown>[] = [];

    if (mongoose.isValidObjectId(customerId)) {
      bookingDeleteFilters.push({
        customerId: new mongoose.Types.ObjectId(customerId),
      });
    }

    if (mongoose.isValidObjectId(hostId)) {
      bookingDeleteFilters.push({
        hostId: new mongoose.Types.ObjectId(hostId),
      });
    }

    if (mongoose.isValidObjectId(listingId)) {
      bookingDeleteFilters.push({
        listingId: new mongoose.Types.ObjectId(listingId),
      });
    }

    if (bookingDeleteFilters.length > 0) {
      await Booking.deleteMany({ $or: bookingDeleteFilters });
    }

    await Listing.deleteMany({
      title: { $regex: `^${testPrefix}`, $options: "i" },
    });

    await UserModel.deleteMany({
      email: { $regex: `^${testPrefix}`, $options: "i" },
    });
  });

  test("1) Create booking successfully", async () => {
    const res = await request(app)
      .post("/api/bookings/customer")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        listingId,
        checkInDate: formatDate(validCheckIn),
        checkOutDate: formatDate(validCheckOut),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Booking created successfully");
    expect(res.body.booking._id).toBeDefined();

    bookingId = String(res.body.booking._id);
  });

  test("2) Booking with invalid property ID", async () => {
    const invalidListingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post("/api/bookings/customer")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        listingId: invalidListingId,
        checkInDate: formatDate(validCheckIn),
        checkOutDate: formatDate(validCheckOut),
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Listing not found");
  });

  test("3) Booking with past date", async () => {
    const res = await request(app)
      .post("/api/bookings/customer")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        listingId,
        checkInDate: formatDate(pastCheckIn),
        checkOutDate: formatDate(pastCheckOut),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Booking dates cannot be in the past");
  });

  test("4) Fetch booking list", async () => {
    const res = await request(app)
      .get("/api/bookings/customer/my")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.bookings)).toBe(true);
    expect(
      res.body.bookings.some(
        (item: { _id: string }) => String(item._id) === bookingId,
      ),
    ).toBe(true);
  });

  test("5) Booking with overlapping dates", async () => {
    const overlapCheckIn = new Date(validCheckIn);
    overlapCheckIn.setDate(validCheckIn.getDate() + 1);

    const overlapCheckOut = new Date(validCheckOut);
    overlapCheckOut.setDate(validCheckOut.getDate() + 1);

    const res = await request(app)
      .post("/api/bookings/customer")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        listingId,
        checkInDate: formatDate(overlapCheckIn),
        checkOutDate: formatDate(overlapCheckOut),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "The selected dates are already booked. Please choose different dates.",
    );
  });

  test("6) Cancel booking successfully", async () => {
    const res = await request(app)
      .put(`/api/bookings/customer/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Booking cancelled successfully");
    expect(res.body.booking.status).toBe("cancelled");
  });

  test("7) Cancel non-existing booking", async () => {
    const nonExistingBookingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .put(`/api/bookings/customer/${nonExistingBookingId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Booking not found");
  });
});
