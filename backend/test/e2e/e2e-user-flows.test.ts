import express from "express";
import cookieParser from "cookie-parser";
import userRoutes from "../../src/routes/user.routes";
import { UserModel } from "../../src/models/user.model";

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

describe("End-to-End User Flows - Simplified", () => {
  const testEmailPrefix = `e2e-simple-${Date.now()}`;

  // ============================================================================
  // E2E FLOW 1: COMPLETE AUTHENTICATION JOURNEY
  // Register (as Customer) → Register (as Host) → Login → Verify data
  // ============================================================================
  describe("E2E Flow 1: Complete Authentication Journey", () => {
    const customerEmail = `${testEmailPrefix}-customer@example.com`;
    const hostEmail = `${testEmailPrefix}-host@example.com`;

    let customerToken = "";
    let hostToken = "";

    afterAll(async () => {
      await UserModel.deleteMany({
        email: { $regex: testEmailPrefix, $options: "i" },
      });
    });

    test("1a) Customer registration flow", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);
      app.use("/api/users", userRoutes);

      const res = await request(app).post("/api/auth/register").send({
        fullName: "E2E Customer User",
        email: customerEmail,
        password: "CustomerPass123",
        confirmPassword: "CustomerPass123",
        phoneNumber: "9800000001",
        address: "Kathmandu",
        role: "customer",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(customerEmail);
      expect(res.body.user.role).toBe("customer");
      expect(res.body.token).toBeTruthy();

      customerToken = res.body.token;
    });

    test("1b) Host registration flow", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);

      const res = await request(app).post("/api/auth/register").send({
        fullName: "E2E Host User",
        email: hostEmail,
        password: "HostPass456",
        confirmPassword: "HostPass456",
        phoneNumber: "9800000002",
        address: "Pokhara",
        role: "host",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe("host");

      hostToken = res.body.token;
    });

    test("1c) Customer login with registered credentials", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);

      const res = await request(app).post("/api/auth/login").send({
        email: customerEmail,
        password: "CustomerPass123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeTruthy();

      customerToken = res.body.token;
    });

    test("1d) Host login with registered credentials", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);

      const res = await request(app).post("/api/auth/login").send({
        email: hostEmail,
        password: "HostPass456",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeTruthy();

      hostToken = res.body.token;
    });

    test("1e) Customer can access auth-protected /me endpoint", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/users", userRoutes);

      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(customerEmail);
    });

    test("1f) Host can access auth-protected /me endpoint", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/users", userRoutes);

      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${hostToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(hostEmail);
    });

    test("1g) Invalid password login fails", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);

      const res = await request(app).post("/api/auth/login").send({
        email: customerEmail,
        password: "WrongPassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test("1h) Non-existent user login returns 401", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: `${testEmailPrefix}-nonexistent@example.com`,
          password: "anypass123",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // E2E FLOW 2: PASSWORD RESET WORKFLOW
  // Request password reset → Verify email sent → Reset with token
  // ============================================================================
  describe("E2E Flow 2: Password Reset Workflow", () => {
    const resetEmail = `${testEmailPrefix}-reset@example.com`;

    let userId = "";

    afterAll(async () => {
      await UserModel.deleteMany({
        email: resetEmail,
      });
    });

    test("2a) Register user for password reset flow", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);

      const res = await request(app).post("/api/auth/register").send({
        fullName: "Reset Test User",
        email: resetEmail,
        password: "InitialPass123",
        confirmPassword: "InitialPass123",
        phoneNumber: "9800000003",
        address: "City",
        role: "customer",
      });

      expect(res.status).toBe(201);
      userId = String(res.body.user._id);
    });

    test("2b) Request password reset email", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);

      const res = await request(app)
        .post("/api/auth/send-reset-password")
        .send({
          email: resetEmail,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Password reset email sent");
    });

    test("2c) Verify user can login with old password before reset", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);

      const res = await request(app).post("/api/auth/login").send({
        email: resetEmail,
        password: "InitialPass123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test("2d) Cannot login after password reset token expiry", async () => {
      const jwt = require("jsonwebtoken");
      const { JWT_SECRET } = require("../../src/config");

      const expiredToken = jwt.sign({ id: userId }, JWT_SECRET, {
        expiresIn: "0s",
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);

      const res = await request(app).post("/api/auth/reset-password").send({
        token: expiredToken,
        newPassword: "NewPass456",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // E2E FLOW 3: USER ROLE VERIFICATION
  // Register with different roles → Verify role assignment → Access control
  // ============================================================================
  describe("E2E Flow 3: User Role Verification", () => {
    const roleTestPrefix = `${testEmailPrefix}-roles`;

    test("3a) Customer role is assigned correctly on registration", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          fullName: "Role Test Customer",
          email: `${roleTestPrefix}-cust@example.com`,
          password: "pass123",
          confirmPassword: "pass123",
          phoneNumber: "9800000004",
          address: "Place",
          role: "customer",
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("customer");

      await UserModel.deleteOne({ _id: res.body.user._id });
    });

    test("3b) Host role is assigned correctly on registration", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          fullName: "Role Test Host",
          email: `${roleTestPrefix}-host@example.com`,
          password: "pass123",
          confirmPassword: "pass123",
          phoneNumber: "9800000005",
          address: "Place",
          role: "host",
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("host");

      await UserModel.deleteOne({ _id: res.body.user._id });
    });

    test("3c) Duplicate email registration fails", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);

      const email = `${roleTestPrefix}-duplicate@example.com`;

      const first = await request(app).post("/api/auth/register").send({
        fullName: "First User",
        email,
        password: "pass123",
        confirmPassword: "pass123",
        phoneNumber: "9800000006",
        address: "Place",
        role: "customer",
      });

      expect(first.status).toBe(201);

      const second = await request(app).post("/api/auth/register").send({
        fullName: "Second User",
        email,
        password: "pass456",
        confirmPassword: "pass456",
        phoneNumber: "9800000007",
        address: "Place",
        role: "customer",
      });

      expect(second.status).toBe(400);
      expect(second.body.message).toContain("Email already in use");

      await UserModel.deleteOne({ email });
    });

    test("3d) Profile information is persisted correctly", async () => {
      const app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/auth", userRoutes);
      app.use("/api/users", userRoutes);

      const userData = {
        fullName: "Profile Test User",
        email: `${roleTestPrefix}-profile@example.com`,
        password: "pass123",
        confirmPassword: "pass123",
        phoneNumber: "9800123456",
        address: "Test Address",
        role: "customer",
      };

      const regRes = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(regRes.status).toBe(201);

      const meRes = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${regRes.body.token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.fullName).toBe(userData.fullName);
      expect(meRes.body.user.email).toBe(userData.email);
      expect(meRes.body.user.phoneNumber).toBe(userData.phoneNumber);
      expect(meRes.body.user.address).toBe(userData.address);

      await UserModel.deleteOne({ _id: regRes.body.user._id });
    });
  });
});
