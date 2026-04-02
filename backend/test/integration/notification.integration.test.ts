import express from "express";
import cookieParser from "cookie-parser";
import userRoutes from "../../src/routes/user.routes";
import notificationApiRoutes from "../../src/routes/notification/notification.api.routes";
import { UserModel } from "../../src/models/user.model";
import { NotificationModel } from "../../src/models/notification.model";

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
app.use("/api/auth", userRoutes);
app.use("/api/notifications", notificationApiRoutes);

describe("Notification / Messaging API Integration", () => {
  const testEmailPrefix = `integration-notification-${Date.now()}`;

  const buildUser = () => ({
    fullName: "Notification User",
    email: `${testEmailPrefix}@example.com`,
    password: "password123",
    confirmPassword: "password123",
    phoneNumber: "9800002000",
    address: "Kathmandu",
    role: "customer" as const,
  });

  let authToken = "";
  let userId = "";
  let notificationId = "";

  beforeAll(async () => {
    await UserModel.deleteMany({
      email: { $regex: `^${testEmailPrefix}`, $options: "i" },
    });

    await NotificationModel.deleteMany({
      message: { $regex: "Booking confirmed", $options: "i" },
    });

    const registerRes = await request(app)
      .post("/api/auth/register")
      .send(buildUser());

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.token).toBeDefined();

    authToken = registerRes.body.token;
    userId = String(registerRes.body.user.id || registerRes.body.user._id);
  });

  afterAll(async () => {
    if (userId) {
      await NotificationModel.deleteMany({ user: userId });
    }

    await UserModel.deleteMany({
      email: { $regex: `^${testEmailPrefix}`, $options: "i" },
    });
  });

  test("1) Send booking confirmation notification", async () => {
    const payload = {
      message: "Booking confirmed for your upcoming stay",
      link: "/dashboard/bookings/booking-123",
    };

    const res = await request(app)
      .post("/api/notifications")
      .set("Authorization", `Bearer ${authToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.message).toBe(payload.message);
    expect(res.body.link).toBe(payload.link);
    expect(res.body.read).toBe(false);

    notificationId = String(res.body._id);
  });

  test("2) Send email notification", async () => {
    const res = await request(app)
      .post("/api/auth/send-reset-password")
      .send({ email: `${testEmailPrefix}@example.com` });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Password reset email sent");
  });

  test("3) Send notification with invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/send-reset-password")
      .send({ email: "invalid-email-format" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("User not found");
  });

  test("4) Send notification with missing message", async () => {
    const res = await request(app)
      .post("/api/notifications")
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Message is required");
  });

  test("5) Fetch notification history", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(
      res.body.some(
        (notification: { _id: string }) =>
          String(notification._id) === notificationId,
      ),
    ).toBe(true);
  });

  test("6) Mark notification as read", async () => {
    const markRes = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ read: true });

    expect(markRes.status).toBe(200);
    expect(markRes.body.success).toBe(true);

    const historyRes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${authToken}`);

    expect(historyRes.status).toBe(200);

    const updatedNotification = historyRes.body.find(
      (notification: { _id: string; read: boolean }) =>
        String(notification._id) === notificationId,
    );

    expect(updatedNotification).toBeDefined();
    expect(updatedNotification.read).toBe(true);
  });
});
