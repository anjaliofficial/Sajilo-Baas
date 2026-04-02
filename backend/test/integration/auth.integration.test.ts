import express from "express";
import cookieParser from "cookie-parser";
import userRoutes from "../../src/routes/user.routes";
import { UserModel } from "../../src/models/user.model";

jest.mock("mime", () => ({
  define: jest.fn(),
  getType: jest.fn(() => "application/json"),
}));

const request = require("supertest");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", userRoutes);

describe("Auth API Integration", () => {
  const testEmailPrefix = `integration-auth-${Date.now()}`;

  const buildUser = (suffix: string) => ({
    fullName: "Integration User",
    email: `${testEmailPrefix}-${suffix}@example.com`,
    password: "password123",
    confirmPassword: "password123",
    phoneNumber: "9800000000",
    address: "Kathmandu",
    role: "customer" as const,
  });

  beforeAll(async () => {
    await UserModel.deleteMany({
      email: { $regex: `^${testEmailPrefix}-`, $options: "i" },
    });
  });

  afterAll(async () => {
    await UserModel.deleteMany({
      email: { $regex: `^${testEmailPrefix}-`, $options: "i" },
    });
  });

  test("1) Register user successfully", async () => {
    const payload = buildUser("register-success");

    const res = await request(app).post("/api/auth/register").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User registered successfully");
    expect(res.body.user.email).toBe(payload.email.toLowerCase());
    expect(res.body.token).toBeDefined();
  });

  test("2) Register user with missing email", async () => {
    const payload: any = buildUser("missing-email");
    delete payload.email;

    const res = await request(app).post("/api/auth/register").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  test("3) Register user with duplicate email", async () => {
    const payload = buildUser("duplicate");

    await request(app).post("/api/auth/register").send(payload).expect(201);

    const duplicateRes = await request(app)
      .post("/api/auth/register")
      .send(payload);

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.message).toContain("Email already in use");
  });

  test("4) Login with correct credentials", async () => {
    const payload = buildUser("login-success");

    await request(app).post("/api/auth/register").send(payload).expect(201);

    const loginRes = await request(app).post("/api/auth/login").send({
      email: payload.email,
      password: payload.password,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.message).toBe("Login successful");
    expect(loginRes.body.token).toBeDefined();
  });

  test("5) Login with incorrect password", async () => {
    const payload = buildUser("wrong-password");

    await request(app).post("/api/auth/register").send(payload).expect(201);

    const loginRes = await request(app).post("/api/auth/login").send({
      email: payload.email,
      password: "wrong-password",
    });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.success).toBe(false);
    expect(loginRes.body.message).toContain("Invalid credentials");
  });

  test("6) Login with non-existing user", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: `${testEmailPrefix}-not-found@example.com`,
        password: "password123",
      });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.success).toBe(false);
    expect(loginRes.body.message).toContain("Invalid credentials");
  });

  test("7) Register user with invalid email format", async () => {
    const payload = {
      ...buildUser("invalid-email"),
      email: "invalid-email-format",
    };

    const res = await request(app).post("/api/auth/register").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  test("8) Register user with password mismatch", async () => {
    const payload = {
      ...buildUser("password-mismatch"),
      confirmPassword: "different-password",
    };

    const res = await request(app).post("/api/auth/register").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Passwords do not match");
  });

  test("9) Login with missing password", async () => {
    const payload = buildUser("login-missing-password");

    await request(app).post("/api/auth/register").send(payload).expect(201);

    const loginRes = await request(app).post("/api/auth/login").send({
      email: payload.email,
    });

    expect(loginRes.status).toBe(400);
    expect(loginRes.body.success).toBe(false);
    expect(loginRes.body.message).toBe("Email and password required");
  });
});
