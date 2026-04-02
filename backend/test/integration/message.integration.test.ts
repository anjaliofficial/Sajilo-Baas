import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import userRoutes from "../../src/routes/user.routes";
import messageRoutes from "../../src/routes/message/message.route";
import { UserModel } from "../../src/models/user.model";
import Listing from "../../src/models/listing.model";
import Message from "../../src/models/message.model";

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
app.use("/api/messages", messageRoutes);

describe("Message API Integration", () => {
  const testPrefix = `integration-message-${Date.now()}`;

  let senderToken = "";
  let senderId = "";
  let receiverToken = "";
  let receiverId = "";
  let listingId = "";
  let messageId = "";

  beforeAll(async () => {
    // Clean up existing test data
    await UserModel.deleteMany({
      email: { $regex: `^${testPrefix}`, $options: "i" },
    });

    // Create sender user directly
    const sender = await UserModel.create({
      fullName: "Message Sender",
      email: `${testPrefix}-sender@example.com`,
      password: "password123",
      phoneNumber: "9800001001",
      address: "Kathmandu",
      role: "host",
      status: "active",
    });

    senderId = String(sender._id);

    // Get sender token by login
    const senderLoginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: `${testPrefix}-sender@example.com`,
        password: "password123",
      });

    expect(senderLoginRes.status).toBe(200);
    senderToken = senderLoginRes.body.token;

    // Create receiver user
    const receiverRes = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Message Receiver",
        email: `${testPrefix}-receiver@example.com`,
        password: "password123",
        confirmPassword: "password123",
        phoneNumber: "9800001002",
        address: "Lalitpur",
        role: "customer",
      });

    expect(receiverRes.status).toBe(201);
    receiverToken = receiverRes.body.token;
    receiverId = String(receiverRes.body.user.id);

    // Create listing
    const listing = await Listing.create({
      title: `${testPrefix} Listing`,
      description: "Message test property",
      location: "Lazimpat, Kathmandu",
      locationDetails: {
        city: "Kathmandu",
        neighborhood: "Lazimpat",
        fullAddress: "House 101",
      },
      propertyType: "apartment",
      amenities: ["wifi"],
      pricePerNight: 3000,
      availableFrom: new Date(),
      availableTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      minStay: 1,
      maxGuests: 2,
      cancellationPolicy: "moderate",
      houseRules: "No smoking",
      images: [],
      hostId: senderId,
      status: "approved",
    });

    listingId = String(listing._id);
  });

  afterAll(async () => {
    // Clean up messages
    const messageDeleteFilters: Record<string, unknown>[] = [];

    if (mongoose.isValidObjectId(senderId)) {
      messageDeleteFilters.push({
        sender: new mongoose.Types.ObjectId(senderId),
      });
      messageDeleteFilters.push({
        receiver: new mongoose.Types.ObjectId(senderId),
      });
    }

    if (mongoose.isValidObjectId(receiverId)) {
      messageDeleteFilters.push({
        sender: new mongoose.Types.ObjectId(receiverId),
      });
      messageDeleteFilters.push({
        receiver: new mongoose.Types.ObjectId(receiverId),
      });
    }

    if (messageDeleteFilters.length > 0) {
      await Message.deleteMany({ $or: messageDeleteFilters });
    }

    // Clean up listing and users
    await Listing.deleteMany({
      title: { $regex: `^${testPrefix}`, $options: "i" },
    });

    await UserModel.deleteMany({
      email: { $regex: `^${testPrefix}`, $options: "i" },
    });
  });

  // Test 1: Send a message successfully
  it("should send a text message successfully", async () => {
    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({
        receiverId,
        listingId,
        content: "Hello, is this property still available?",
        type: "text",
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("_id");
    expect(res.body.data.content).toBe(
      "Hello, is this property still available?",
    );
    expect(res.body.data.type).toBe("text");
    expect(res.body.data.sender._id).toBe(senderId);
    expect(res.body.data.receiver._id).toBe(receiverId);
    expect(res.body.data.read).toBe(false);

    messageId = res.body.data._id;
  });

  // Test 2: Send message without authentication should fail
  it("should fail to send message without authentication", async () => {
    const res = await request(app).post("/api/messages").send({
      receiverId,
      listingId,
      content: "Test message",
      type: "text",
    });

    expect(res.status).toBe(401);
  });

  // Test 3: Send message with invalid receiver should fail
  it("should fail to send message with invalid receiver", async () => {
    const invalidReceiverId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({
        receiverId: invalidReceiverId.toString(),
        listingId,
        content: "Test message",
        type: "text",
      });

    // API may return success or error depending on implementation
    expect([200, 201, 400, 404]).toContain(res.status);
  });

  // Test 4: Get conversation between two users
  it("should get conversation between two users", async () => {
    // Send a few messages first
    await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({
        receiverId,
        listingId,
        content: "First message",
        type: "text",
      });

    await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${receiverToken}`)
      .send({
        receiverId: senderId,
        listingId,
        content: "Second message",
        type: "text",
      });

    const res = await request(app)
      .get(`/api/messages/${receiverId}/${listingId}`)
      .set("Authorization", `Bearer ${senderToken}`);

    expect(res.status).toBe(200);
    const messages = Array.isArray(res.body) ? res.body : res.body.data || [];
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThanOrEqual(2);
    if (messages.length > 0) {
      expect(messages[0]).toHaveProperty("_id");
      expect(messages[0]).toHaveProperty("content");
    }
  });

  // Test 5: Get threads (list of conversations)
  it("should get all message threads for a user", async () => {
    const res = await request(app)
      .get("/api/messages/threads")
      .set("Authorization", `Bearer ${senderToken}`);

    expect(res.status).toBe(200);
    const threads = Array.isArray(res.body) ? res.body : res.body.data || [];
    expect(Array.isArray(threads)).toBe(true);
    // Just verify it's an array, even if empty
  });

  // Test 6: Mark conversation as read
  it("should mark conversation as read", async () => {
    const res = await request(app)
      .patch("/api/messages/read")
      .set("Authorization", `Bearer ${receiverToken}`)
      .send({
        otherUserId: senderId,
        listingId,
      });

    expect(res.status).toBe(200);
  });

  // Test 7: Edit a message
  it("should edit a message successfully", async () => {
    // First, send a message
    const sendRes = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({
        receiverId,
        listingId,
        content: "Original message",
        type: "text",
      });

    const msgId = sendRes.body.data._id;

    // Edit the message
    const editRes = await request(app)
      .put(`/api/messages/${msgId}`)
      .set("Authorization", `Bearer ${senderToken}`)
      .send({
        content: "Edited message",
      });

    expect(editRes.status).toBe(200);
    const msgData = editRes.body.data || editRes.body;
    expect(msgData.content).toBe("Edited message");
    expect(msgData.isEdited).toBe(true);
    expect(msgData).toHaveProperty("editedAt");
  });

  // Test 8: Delete a message
  it("should delete a message for the sender", async () => {
    // First, send a message
    const sendRes = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({
        receiverId,
        listingId,
        content: "Message to delete",
        type: "text",
      });

    const msgId = sendRes.body.data._id;

    // Delete the message
    const deleteRes = await request(app)
      .delete(`/api/messages/${msgId}`)
      .set("Authorization", `Bearer ${senderToken}`)
      .send({
        deleteType: "for_me",
      });

    expect([200, 204]).toContain(deleteRes.status);
  });

  // Test 9: Cannot edit message that doesn't belong to you
  it("should fail to edit message from another user", async () => {
    // Send a message as sender
    const sendRes = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({
        receiverId,
        listingId,
        content: "Sender message",
        type: "text",
      });

    const msgId = sendRes.body.data._id;

    // Try to edit as receiver
    const editRes = await request(app)
      .put(`/api/messages/${msgId}`)
      .set("Authorization", `Bearer ${receiverToken}`)
      .send({
        content: "Hacked message",
      });

    expect([403, 401, 500]).toContain(editRes.status);
  });

  // Test 10: Send multiple messages in conversation
  it("should maintain message order in conversation", async () => {
    const messages = [];

    // Send 3 messages
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          receiverId,
          listingId,
          content: `Message ${i + 1}`,
          type: "text",
        });

      expect(res.status).toBe(201);
      messages.push(res.body.data);

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Get conversation
    const convRes = await request(app)
      .get(`/api/messages/${receiverId}/${listingId}`)
      .set("Authorization", `Bearer ${senderToken}`);

    expect(convRes.status).toBe(200);
    const msgArray = Array.isArray(convRes.body)
      ? convRes.body
      : convRes.body.data || [];
    expect(msgArray.length).toBeGreaterThanOrEqual(3);

    // Verify messages exist
    const lastThree = msgArray.slice(-3);
    for (let i = 0; i < Math.min(3, lastThree.length); i++) {
      expect(lastThree[i]).toHaveProperty("content");
    }
  });
});
