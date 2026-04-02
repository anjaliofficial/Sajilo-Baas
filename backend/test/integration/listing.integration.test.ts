import express from "express";
import cookieParser from "cookie-parser";
import userRoutes from "../../src/routes/user.routes";
import listingRoutes from "../../src/routes/listing/listing.routes";
import { UserModel } from "../../src/models/user.model";
import Listing from "../../src/models/listing.model";

jest.mock("mime", () => ({
  define: jest.fn(),
  getType: jest.fn(() => "application/json"),
}));

const request = require("supertest");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", userRoutes);
app.use("/api/listings", listingRoutes);

describe("Listing API Integration", () => {
  const testEmailPrefix = `integration-listing-${Date.now()}`;
  const testTitlePrefix = `Integration Listing ${Date.now()}`;

  const buildHostUser = () => ({
    fullName: "Listing Host",
    email: `${testEmailPrefix}@example.com`,
    password: "password123",
    confirmPassword: "password123",
    phoneNumber: "9811111111",
    address: "Kathmandu",
    role: "host" as const,
  });

  const buildListingPayload = (suffix: string) => ({
    title: `${testTitlePrefix} ${suffix}`,
    description: "Comfortable place near city center",
    city: "Kathmandu",
    neighborhood: "Lazimpat",
    fullAddress: `House ${suffix}, Lazimpat`,
    propertyType: "apartment",
    amenities: ["wifi", "kitchen"],
    pricePerNight: 2500,
    availableFrom: "2026-04-01",
    availableTo: "2026-12-31",
    minStay: 1,
    maxGuests: 2,
    cancellationPolicy: "moderate",
    houseRules: "No smoking",
  });

  let authToken = "";
  let createdListingId = "";

  beforeAll(async () => {
    await UserModel.deleteMany({
      email: { $regex: `^${testEmailPrefix}`, $options: "i" },
    });

    await Listing.deleteMany({
      title: { $regex: `^${testTitlePrefix}`, $options: "i" },
    });

    const registerRes = await request(app)
      .post("/api/auth/register")
      .send(buildHostUser());

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.token).toBeDefined();

    authToken = registerRes.body.token;
  });

  afterAll(async () => {
    await UserModel.deleteMany({
      email: { $regex: `^${testEmailPrefix}`, $options: "i" },
    });

    await Listing.deleteMany({
      title: { $regex: `^${testTitlePrefix}`, $options: "i" },
    });
  });

  test("1) Create property successfully", async () => {
    const payload = buildListingPayload("Create");

    const res = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${authToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.title).toBe(payload.title);
    expect(res.body.hostId).toBeDefined();

    createdListingId = String(res.body._id);
  });

  test("2) Create property with missing title", async () => {
    const payload = buildListingPayload("Missing Title");
    const { title: _unused, ...payloadWithoutTitle } = payload;

    const res = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${authToken}`)
      .send(payloadWithoutTitle);

    expect(res.status).toBe(500);
    expect(res.body.message).toContain("title");
  });

  test("3) Fetch all properties", async () => {
    const res = await request(app).get("/api/listings");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.listings)).toBe(true);
    expect(res.body.listings.length).toBeGreaterThan(0);
    expect(
      res.body.listings.some((item: { _id: string }) =>
        String(item._id) === createdListingId,
      ),
    ).toBe(true);
  });

  test("4) Fetch single property by ID", async () => {
    const res = await request(app).get(`/api/listings/${createdListingId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.listing._id).toBe(createdListingId);
  });

  test("5) Update property successfully", async () => {
    const updatePayload = {
      title: `${testTitlePrefix} Updated`,
      pricePerNight: 3200,
    };

    const res = await request(app)
      .put(`/api/listings/${createdListingId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(createdListingId);
    expect(res.body.title).toBe(updatePayload.title);
    expect(res.body.pricePerNight).toBe(updatePayload.pricePerNight);
  });

  test("6) Delete property successfully", async () => {
    const deleteRes = await request(app)
      .delete(`/api/listings/${createdListingId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Listing deleted successfully");

    const fetchRes = await request(app).get(`/api/listings/${createdListingId}`);
    expect(fetchRes.status).toBe(404);
    expect(fetchRes.body.message).toBe("Listing not found");
  });
});
