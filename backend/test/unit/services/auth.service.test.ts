jest.mock("../../../src/models/user.model", () => ({
  UserModel: {
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

import { UserService } from "../../../src/services/user.service";
import { UserModel } from "../../../src/models/user.model";
import jwt from "jsonwebtoken";
import { HttpError } from "../../../src/error/http-error";

describe("AuthService (UserService)", () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();
  });

  test("createUser: should register user successfully", async () => {
    (UserModel.findOne as jest.Mock).mockResolvedValue(null);

    const createdUser = {
      _id: "user-1",
      fullName: "Test User",
      email: "test@example.com",
      password: "hashed-password",
      phoneNumber: "9800000000",
      address: "Kathmandu",
      role: "customer",
      profilePicture: "",
      getSignedJwtToken: jest.fn().mockReturnValue("token-123"),
    };

    (UserModel.create as jest.Mock).mockResolvedValue(createdUser);

    const result = await userService.createUser({
      fullName: "Test User",
      email: " TEST@EXAMPLE.COM ",
      password: "password123",
      confirmPassword: "password123",
      phoneNumber: "9800000000",
      address: "Kathmandu",
    });

    expect(UserModel.findOne).toHaveBeenCalledWith({
      email: "test@example.com",
    });
    expect(UserModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        role: "customer",
      }),
    );
    expect(result.token).toBe("token-123");
    expect(result.user.email).toBe("test@example.com");
  });

  test("createUser: should throw when email already exists", async () => {
    (UserModel.findOne as jest.Mock).mockResolvedValue({
      _id: "existing-user",
    });

    await expect(
      userService.createUser({
        fullName: "Test User",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        phoneNumber: "9800000000",
        address: "Kathmandu",
      }),
    ).rejects.toMatchObject({
      message: "Email already in use",
      statusCode: 403,
    });
  });

  test("loginUser: should login successfully with valid credentials", async () => {
    (UserModel.countDocuments as jest.Mock).mockResolvedValue(1);

    const mockUser = {
      _id: "user-1",
      fullName: "Test User",
      email: "test@example.com",
      phoneNumber: "9800000000",
      address: "Kathmandu",
      role: "customer",
      profilePicture: "",
      matchPassword: jest.fn().mockResolvedValue(true),
    };

    (UserModel.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    (jwt.sign as jest.Mock).mockReturnValue("jwt-login-token");

    const result = await userService.loginUser({
      email: " TEST@EXAMPLE.COM ",
      password: "password123",
    });

    expect(UserModel.countDocuments).toHaveBeenCalledWith({
      email: "test@example.com",
    });
    expect(jwt.sign).toHaveBeenCalled();
    expect(result.token).toBe("jwt-login-token");
    expect(result.user.email).toBe("test@example.com");
  });

  test("loginUser: should throw when duplicate accounts exist", async () => {
    (UserModel.countDocuments as jest.Mock).mockResolvedValue(2);

    await expect(
      userService.loginUser({
        email: "test@example.com",
        password: "password123",
      }),
    ).rejects.toMatchObject({
      message:
        "Duplicate accounts detected for this email. Please contact support.",
      statusCode: 409,
    });
  });

  test("loginUser: should throw invalid credentials for wrong password", async () => {
    (UserModel.countDocuments as jest.Mock).mockResolvedValue(1);

    const mockUser = {
      _id: "user-1",
      role: "customer",
      matchPassword: jest.fn().mockResolvedValue(false),
    };

    (UserModel.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    await expect(
      userService.loginUser({
        email: "test@example.com",
        password: "wrong-password",
      }),
    ).rejects.toMatchObject({
      message: "Invalid credentials",
      statusCode: 401,
    });
  });
});
