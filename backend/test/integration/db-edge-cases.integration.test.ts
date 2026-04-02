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

describe("DB Edge Cases", () => {
  const testPrefix = `integration-db-edge-${Date.now()}`;

  const buildCustomer = (suffix: string) => ({
    fullName: "DB Edge Customer",
    email: `${testPrefix}-${suffix}@example.com`,
    password: "password123",
    confirmPassword: "password123",
    phoneNumber: "9800010000",
    address: "Kathmandu",
    role: "customer" as const,
  });

  const buildHostDoc = (suffix: string) => ({
    fullName: "DB Edge Host",
    email: `${testPrefix}-host-${suffix}@example.com`,
    password: "password123",
    phoneNumber: "9800010001",
    address: "Lalitpur",
    role: "host" as const,
    status: "active" as const,
  });

  let customerToken = "";
  let customerId = "";
  let hostId = "";

  beforeAll(async () => {
    await UserModel.deleteMany({
      email: { $regex: `^${testPrefix}`, $options: "i" },
    });

    const customerRes = await request(app)
      .post("/api/auth/register")
      .send(buildCustomer("booker"));

    expect(customerRes.status).toBe(201);
    customerToken = customerRes.body.token;
    customerId = String(customerRes.body.user.id || customerRes.body.user._id);

    const host = await UserModel.create(buildHostDoc("primary"));
    hostId = String(host._id);
  });

  afterAll(async () => {
    const deleteFilters: Record<string, unknown>[] = [];

    if (mongoose.isValidObjectId(customerId)) {
      deleteFilters.push({
        customerId: new mongoose.Types.ObjectId(customerId),
      });
    }

    if (mongoose.isValidObjectId(hostId)) {
      deleteFilters.push({ hostId: new mongoose.Types.ObjectId(hostId) });
    }

    if (deleteFilters.length > 0) {
      await Booking.deleteMany({ $or: deleteFilters });
    }

    await Listing.deleteMany({
      title: { $regex: `^${testPrefix}`, $options: "i" },
    });
    await UserModel.deleteMany({
      email: { $regex: `^${testPrefix}`, $options: "i" },
    });
  });

  test("1) Attempt duplicate entries (email) via API", async () => {
    const payload = buildCustomer("duplicate-email");

    await request(app).post("/api/auth/register").send(payload).expect(201);

    const duplicateRes = await request(app)
      .post("/api/auth/register")
      .send(payload);

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.message).toContain("Email already in use");
  });

  test("2) Attempt duplicate entries (property ID) at DB level", async () => {
    const fixedId = new mongoose.Types.ObjectId();

    const basePayload = {
      _id: fixedId,
      title: `${testPrefix} Duplicate Property ID`,
      description: "Property for duplicate _id test",
      location: "Kathmandu",
      propertyType: "apartment" as const,
      amenities: ["wifi"],
      pricePerNight: 3000,
      availableFrom: new Date("2026-05-01"),
      availableTo: new Date("2026-06-01"),
      minStay: 1,
      maxGuests: 2,
      cancellationPolicy: "moderate" as const,
      houseRules: "No smoking",
      images: [],
      hostId,
      status: "approved" as const,
    };

    await Listing.create(basePayload);

    let duplicateError: any;
    try {
      await Listing.create({
        ...basePayload,
        title: `${testPrefix} Duplicate Property ID Copy`,
      });
    } catch (error) {
      duplicateError = error;
    }

    expect(duplicateError).toBeDefined();
    expect(duplicateError.code).toBe(11000);
  });

  test("3) Invalid foreign keys (booking propertyId does not exist)", async () => {
    const nonExistingListingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post("/api/bookings/customer")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        listingId: nonExistingListingId,
        checkInDate: "2026-07-01",
        checkOutDate: "2026-07-03",
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Listing not found");
  });

  test("4) Missing required fields via API", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Missing Email",
      password: "password123",
      confirmPassword: "password123",
      phoneNumber: "9800010002",
      address: "Bhaktapur",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  test("5) Missing required fields at DB level", async () => {
    let validationError: any;

    try {
      await Listing.create({
        title: `${testPrefix} Missing Required`,
        location: "Pokhara",
        hostId,
        status: "approved",
      });
    } catch (error) {
      validationError = error;
    }

    expect(validationError).toBeDefined();
    expect(validationError.name).toBe("ValidationError");
    expect(validationError.errors.description).toBeDefined();
    expect(validationError.errors.pricePerNight).toBeDefined();
    expect(validationError.errors.availableFrom).toBeDefined();
    expect(validationError.errors.availableTo).toBeDefined();
  });
});
