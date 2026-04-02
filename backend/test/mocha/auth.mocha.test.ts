import assert from "assert";
import express from "express";
import cookieParser from "cookie-parser";
import userRoutes from "../../src/routes/user.routes";

const request = require("supertest");

describe("Mocha Auth Flow", () => {
  const app = express();
  const email = `mocha-user-${Date.now()}@example.com`;
  const password = "password123";

  before(() => {
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/auth", userRoutes);
  });

  it("registers a user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Mocha User",
      email,
      password,
      confirmPassword: password,
      phoneNumber: "9800000099",
      address: "Kathmandu",
      role: "customer",
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
  });

  it("logs in the user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email,
      password,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
  });
});
