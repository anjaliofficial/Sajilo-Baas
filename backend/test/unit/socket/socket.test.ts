const mockServerUse = jest.fn();
const mockServerOn = jest.fn();
const mockServerEmit = jest.fn();
const mockServerTo = jest.fn(() => ({ emit: jest.fn() }));

jest.mock("socket.io", () => ({
  Server: jest.fn().mockImplementation(() => ({
    use: mockServerUse,
    on: mockServerOn,
    emit: mockServerEmit,
    to: mockServerTo,
  })),
}));

jest.mock("jsonwebtoken", () => ({ verify: jest.fn() }));
jest.mock("../../../src/services/user.service", () => ({
  UserService: jest.fn().mockImplementation(() => ({
    getUserById: jest.fn(),
  })),
}));
jest.mock("../../../src/services/message/message.service", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn(),
    updateMessageStatus: jest.fn(),
  })),
}));
jest.mock("../../../src/models/message.model", () => ({
  MessageStatus: { DELIVERED: "delivered" },
}));
jest.mock("../../../src/utils/notification.util", () => ({
  sendPushNotification: jest.fn(),
}));

import { getIoInstance, getOnlineUsers, initSocket } from "../../../src/socket";

describe("Socket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getIoInstance: should be null before initSocket", () => {
    expect(getIoInstance()).toBeNull();
  });

  test("getOnlineUsers: should return a mutable Map", () => {
    const users = getOnlineUsers();
    users.set("u1", "s1");

    expect(users.get("u1")).toBe("s1");
  });

  test("initSocket: should initialize io instance", () => {
    const fakeServer: any = {};

    initSocket(fakeServer);

    expect(getIoInstance()).not.toBeNull();
    expect(mockServerUse).toHaveBeenCalled();
    expect(mockServerOn).toHaveBeenCalledWith(
      "connection",
      expect.any(Function),
    );
  });
});
