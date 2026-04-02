import { Express } from "express";

const request = require("supertest");

export interface CreateTestPropertyInput {
  authToken: string;
  suffix?: string;
  title?: string;
  pricePerNight?: number;
}

export interface CreateTestPropertyResult {
  listingId: string;
  listing: any;
}

export const createTestProperty = async (
  app: Express,
  input: CreateTestPropertyInput,
): Promise<CreateTestPropertyResult> => {
  const suffix = input.suffix ?? `${Date.now()}`;

  const payload = {
    title: input.title ?? `Test Listing ${suffix}`,
    description: "Comfortable place near city center",
    city: "Kathmandu",
    neighborhood: "Lazimpat",
    fullAddress: `House ${suffix}, Lazimpat`,
    propertyType: "apartment",
    amenities: ["wifi", "kitchen"],
    pricePerNight: input.pricePerNight ?? 2500,
    availableFrom: "2026-04-01",
    availableTo: "2026-12-31",
    minStay: 1,
    maxGuests: 2,
    cancellationPolicy: "moderate",
    houseRules: "No smoking",
  };

  const res = await request(app)
    .post("/api/listings")
    .set("Authorization", `Bearer ${input.authToken}`)
    .send(payload);

  if (res.status !== 201 || !res.body?._id) {
    throw new Error(
      `createTestProperty failed: status=${res.status}, body=${JSON.stringify(res.body)}`,
    );
  }

  return {
    listingId: String(res.body._id),
    listing: res.body,
  };
};

export default createTestProperty;
