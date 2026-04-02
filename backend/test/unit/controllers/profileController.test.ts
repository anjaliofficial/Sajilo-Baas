const mockUpdateUser = jest.fn();
const mockGetPublicUserById = jest.fn();

jest.mock("../../../src/services/user.service", () => ({
  UserService: jest.fn().mockImplementation(() => ({
    updateUser: mockUpdateUser,
    getPublicUserById: mockGetPublicUserById,
  })),
}));

import { Request, Response } from "express";
import { UserController } from "../../../src/controllers/user.controller";
import { HttpError } from "../../../src/error/http-error";

describe("ProfileController (UserController profile actions)", () => {
  let userController: UserController;
  let mockRequest: any;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    userController = new UserController();

    mockRequest = {
      body: {},
      params: {},
      user: { _id: "user-123" },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test("updateProfile: should update profile successfully", async () => {
    const updatedUser = {
      id: "user-123",
      fullName: "Updated User",
      phoneNumber: "9800000000",
    };

    mockRequest.body = {
      fullName: "Updated User",
      phoneNumber: "9800000000",
    };
    mockUpdateUser.mockResolvedValue(updatedUser);

    await userController.updateProfile(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockUpdateUser).toHaveBeenCalledWith("user-123", mockRequest.body);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      user: updatedUser,
    });
  });

  test("updateProfile: should return HttpError status/message", async () => {
    mockRequest.body = { fullName: "X" };
    mockUpdateUser.mockRejectedValue(new HttpError("Unauthorized", 403));

    await userController.updateProfile(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized",
    });
  });

  test("updateProfile: should return 500 for unexpected errors", async () => {
    mockUpdateUser.mockRejectedValue(new Error("DB crashed"));

    await userController.updateProfile(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error",
    });
  });

  test("getPublicProfile: should return 400 when id is missing", async () => {
    mockRequest.params = {};

    await userController.getPublicProfile(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "User id is required",
    });
    expect(mockGetPublicUserById).not.toHaveBeenCalled();
  });

  test("getPublicProfile: should fetch and return public profile", async () => {
    const publicUser = {
      id: "user-999",
      fullName: "Public User",
      profilePicture: "avatar.png",
    };

    mockRequest.params = { id: "user-999" };
    mockGetPublicUserById.mockResolvedValue(publicUser);

    await userController.getPublicProfile(
      mockRequest as Request,
      mockResponse as Response,
    );

    expect(mockGetPublicUserById).toHaveBeenCalledWith("user-999");
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      user: publicUser,
    });
  });
});
