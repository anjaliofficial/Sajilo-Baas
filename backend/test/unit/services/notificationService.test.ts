const mockSendEachForMulticast = jest.fn();
const mockEmit = jest.fn();
const mockTo = jest.fn(() => ({ emit: mockEmit }));
const mockOnlineUsers = new Map<string, string>();

jest.mock("firebase-admin", () => ({
  __esModule: true,
  default: {
    apps: [{}],
    initializeApp: jest.fn(),
    credential: { cert: jest.fn() },
    messaging: jest.fn(() => ({
      sendEachForMulticast: mockSendEachForMulticast,
    })),
  },
}));

jest.mock("../../../src/socket/index", () => ({
  getIoInstance: jest.fn(() => ({ to: mockTo })),
  getOnlineUsers: jest.fn(() => mockOnlineUsers),
}));

import {
  sendPushNotification,
  sendSocketNotification,
} from "../../../src/services/notification/notification.service";

describe("NotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnlineUsers.clear();
  });

  test("sendPushNotification: should return early when token list is empty", async () => {
    await sendPushNotification([], "Title", "Body", { bookingId: "1" });

    expect(mockSendEachForMulticast).not.toHaveBeenCalled();
  });

  test("sendPushNotification: should send multicast payload with stringified data", async () => {
    mockSendEachForMulticast.mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true }],
    });

    await sendPushNotification(["token-1"], "Hello", "World", {
      bookingId: 123,
      status: "confirmed",
      meta: { nights: 2 },
    });

    expect(mockSendEachForMulticast).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ["token-1"],
        notification: { title: "Hello", body: "World" },
        data: {
          bookingId: "123",
          status: "confirmed",
          meta: JSON.stringify({ nights: 2 }),
        },
      }),
    );
  });

  test("sendPushNotification: should handle failed token responses", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    mockSendEachForMulticast.mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      responses: [{ success: true }, { success: false, error: "InvalidToken" }],
    });

    await sendPushNotification(["ok-token", "bad-token"], "T", "B");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[FCM] Failed token: bad-token"),
    );

    warnSpy.mockRestore();
  });

  test("sendSocketNotification: should emit notification when user is online", () => {
    mockOnlineUsers.set("user-1", "socket-1");

    const payload = { message: "Booking confirmed" };
    sendSocketNotification("user-1", payload);

    expect(mockTo).toHaveBeenCalledWith("socket-1");
    expect(mockEmit).toHaveBeenCalledWith("notification", payload);
  });

  test("sendSocketNotification: should not emit when user is offline", () => {
    const payload = { message: "Booking cancelled" };

    sendSocketNotification("offline-user", payload);

    expect(mockTo).not.toHaveBeenCalled();
    expect(mockEmit).not.toHaveBeenCalled();
  });
});
