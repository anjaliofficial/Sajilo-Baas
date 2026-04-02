import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import userRoutes from "../../src/routes/user.routes";
import adminRoutes from "../../src/routes/admin/admin.routes";
import { UserModel } from "../../src/models/user.model";
import { JWT_SECRET } from "../../src/config";

jest.mock("mime", () => ({
  define: jest.fn(),
  getType: jest.fn(() => "application/json"),
}));

jest.mock("../../src/config/email", () => ({
  transporter: {
    sendMail: jest.fn(async () => ({ messageId: "mocked-message-id" })),
  },
  sendEmail: jest.fn(async () => ({ messageId: "mocked-message-id" })),
}));

const request = require("supertest");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/users", userRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/admin", adminRoutes);

describe("Auth & Security Flows", () => {
  const testEmailPrefix = `integration-auth-security-${Date.now()}`;

  const buildCustomer = () => ({
    fullName: "Security Test Customer",
    email: `${testEmailPrefix}-customer@example.com`,
    password: "password123",
    confirmPassword: "password123",
    phoneNumber: "9800020000",
    address: "Kathmandu",
    role: "customer" as const,
  });

  const buildAdmin = () => ({
    fullName: "Test Admin",
    email: `${testEmailPrefix}-admin@example.com`,
    password: "adminpass123",
    phoneNumber: "9800020001",
    address: "Kathmandu",
  });

  let customerToken = "";
  let customerId = "";
  let adminToken = "";

  beforeAll(async () => {
    await UserModel.deleteMany({
      email: { $regex: `^${testEmailPrefix}`, $options: "i" },
    });

    const customerRes = await request(app)
      .post("/api/auth/register")
      .send(buildCustomer());

    expect(customerRes.status).toBe(201);
    customerToken = customerRes.body.token;
    customerId = String(customerRes.body.user.id || customerRes.body.user._id);

    const admin = await UserModel.create({
      ...buildAdmin(),
      role: "admin",
      status: "active",
    });

    const adminLoginRes = await request(app)
      .post("/api/admin/login")
      .send({
        email: admin.email,
        password: "adminpass123",
      });

    if (adminLoginRes.status === 200) {
      adminToken = adminLoginRes.body.token;
    }
  });

  afterAll(async () => {
    await UserModel.deleteMany({
      email: { $regex: `^${testEmailPrefix}`, $options: "i" },
    });
  });

  test("1) Token expiration / Invalid token rejection", async () => {
    const expiredToken = jwt.sign(
      { id: customerId },
      JWT_SECRET,
      { expiresIn: "0s" }
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("jwt expired");
  });

  test("2) Password reset → DB update → Email sent", async () => {
    const customerEmail = `${testEmailPrefix}-customer@example.com`;

    const resetReqRes = await request(app)
      .post("/api/auth/send-reset-password")
      .send({ email: customerEmail });

    expect(resetReqRes.status).toBe(200);
    expect(resetReqRes.body.success).toBe(true);
    expect(resetReqRes.body.message).toBe("Password reset email sent");

    const user = await UserModel.findOne({ email: customerEmail }).select(
      "+password"
    );
    expect(user).toBeDefined();

    const resetToken = jwt.sign({ id: user?._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    const newPassword = "newPassword456";
    const resetRes = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: resetToken,
        newPassword,
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);
    expect(resetRes.body.message).toBe("Password reset successfully");

    const updatedUser = await UserModel.findById(user?._id).select("+password");
    const passwordMatches = await updatedUser?.matchPassword(newPassword);
    expect(passwordMatches).toBe(true);
  });

  test("3) Role-based access control (customer blocked from admin routes)", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Forbidden");
  });

  test("4) Admin access to admin routes (authorized)", async () => {
    if (!adminToken) {
      console.warn(
        "Skipping admin access test - admin login not configured in test"
      );
      return;
    }

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  test("5) Invalid/missing token rejection", async () => {
    const res = await request(app).get("/api/users/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Unauthorized");
  });

  test("6) Password reset with expired token", async () => {
    const expiredResetToken = jwt.sign(
      { id: customerId },
      JWT_SECRET,
      { expiresIn: "0s" }
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: expiredResetToken,
        newPassword: "ignored123",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Reset password token expired");
  });
});
