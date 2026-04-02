import Listing from "../../src/models/listing.model";
import { UserModel } from "../../src/models/user.model";
import {
  buildTestApp,
  clearTestDB,
  createTestProperty,
  createTestUser,
  loginTestUser,
} from "../helpers";

jest.mock("mime", () => ({
  define: jest.fn(),
  getType: jest.fn(() => "application/json"),
}));

const request = require("supertest");

describe("Ready-to-Use Helper Test", () => {
  const emailPrefix = `ready-helper-${Date.now()}`;
  const app = buildTestApp();

  afterAll(async () => {
    await UserModel.deleteMany({
      email: { $regex: `^${emailPrefix}`, $options: "i" },
    });
    await Listing.deleteMany({
      title: { $regex: "^Test Listing", $options: "i" },
    });
  });

  test("create user -> login -> create listing", async () => {
    await clearTestDB();

    const host = await createTestUser(app, {
      email: `${emailPrefix}-host@example.com`,
      password: "hostpass123",
      role: "host",
      fullName: "Ready Host",
    });

    expect(host.token).toBeTruthy();
    expect(host.user.role).toBe("host");

    const login = await loginTestUser(app, {
      email: host.email,
      password: host.password,
    });

    expect(login.token).toBeTruthy();

    const listing = await createTestProperty(app, {
      authToken: login.token,
      suffix: "ready-1",
      pricePerNight: 3000,
    });

    expect(listing.listingId).toBeTruthy();
    expect(listing.listing.pricePerNight).toBe(3000);

    const getRes = await request(app).get(`/api/listings/${listing.listingId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
  });
});
