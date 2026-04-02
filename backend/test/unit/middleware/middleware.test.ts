jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

const mockGetUserById = jest.fn();
jest.mock("../../../src/services/user.service", () => ({
  UserService: jest.fn().mockImplementation(() => ({
    getUserById: mockGetUserById,
  })),
}));

import jwt from "jsonwebtoken";
import {
  authorizedMiddleware,
  roleMiddleware,
} from "../../../src/middlewares/auth.middleware";
import { adminRateLimit } from "../../../src/middlewares/rate-limit.middleware";

describe("Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("authorizedMiddleware: returns 401 when token is missing", async () => {
    const req: any = { headers: {}, cookies: {} };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authorizedMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("authorizedMiddleware: sets req.user and calls next for valid token", async () => {
    const req: any = {
      headers: { authorization: "Bearer token-123" },
      cookies: {},
    };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    (jwt.verify as jest.Mock).mockReturnValue({ id: "u1" });
    mockGetUserById.mockResolvedValue({ _id: "u1", role: "customer" });

    await authorizedMiddleware(req, res, next);

    expect(req.user).toEqual({ _id: "u1", role: "customer" });
    expect(next).toHaveBeenCalled();
  });

  test("roleMiddleware: returns 403 when role is not allowed", async () => {
    const req: any = { user: { role: "customer" } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await roleMiddleware(["admin", "host"])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("adminRateLimit: calls next and sets headers under limit", () => {
    const req: any = { user: { _id: "admin-1" } };
    const res: any = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    adminRateLimit(2)(req, res, next);

    expect(res.setHeader).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
