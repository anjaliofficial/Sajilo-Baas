// Mock the UserService before importing the controller
const mockCreateUser = jest.fn();
const mockLoginUser = jest.fn();

jest.mock("../../../src/services/user.service", () => {
  return {
    UserService: jest.fn().mockImplementation(() => {
      return {
        createUser: mockCreateUser,
        loginUser: mockLoginUser,
      };
    }),
  };
});

import { Request, Response } from "express";
import { UserController } from "../../../src/controllers/user.controller";
import { UserService } from "../../../src/services/user.service";

describe("AuthController (User Registration & Login)", () => {
  let userController: UserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    userController = new UserController();

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
      cookie: jest.fn().mockReturnThis() as any,
    };

    mockRequest = {
      body: {},
    };
  });

  // ==========================================
  // REGISTER TESTS (5 Tests)
  // ==========================================
  describe("register", () => {
    const validUserData = {
      fullName: "John Doe",
      email: "john.doe@example.com",
      password: "password123",
      confirmPassword: "password123",
      phoneNumber: "9841234567",
      address: "Kathmandu, Nepal",
      role: "customer" as const,
    };

    test("should register a new user successfully with valid data", async () => {
      const mockResult = {
        token: "mock-jwt-token",
        user: {
          id: "user-id-123",
          fullName: validUserData.fullName,
          email: validUserData.email,
          phoneNumber: validUserData.phoneNumber,
          address: validUserData.address,
          role: validUserData.role,
          profilePicture: "",
        },
      };

      mockRequest.body = validUserData;
      mockCreateUser.mockResolvedValue(mockResult);

      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "User registered successfully",
        user: mockResult.user,
        token: mockResult.token,
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "token",
        mockResult.token,
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
        }),
      );
    });

    test("should return error when email is missing", async () => {
      const invalidData = {
        ...validUserData,
        email: "",
      };

      mockRequest.body = invalidData;

      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("email"),
      });
    });

    test("should return error when password is missing", async () => {
      const invalidData = {
        ...validUserData,
        password: "",
        confirmPassword: "",
      };

      mockRequest.body = invalidData;

      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("password"),
      });
    });

    test("should return error when email format is invalid", async () => {
      const invalidData = {
        ...validUserData,
        email: "invalid-email-format",
      };

      mockRequest.body = invalidData;

      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("email"),
      });
    });

    test("should return error when email is already registered (duplicate email)", async () => {
      mockRequest.body = validUserData;
      mockCreateUser.mockRejectedValue(new Error("Email already in use"));

      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Email already in use",
      });
    });
  });

  // ==========================================
  // LOGIN TESTS (5 Tests)
  // ==========================================
  describe("login", () => {
    const validLoginData = {
      email: "john.doe@example.com",
      password: "password123",
    };

    test("should login successfully with valid credentials", async () => {
      const mockResult = {
        token: "mock-jwt-token",
        user: {
          id: "user-id-123",
          fullName: "John Doe",
          email: validLoginData.email,
          phoneNumber: "9841234567",
          address: "Kathmandu, Nepal",
          role: "customer" as const,
          profilePicture: "",
        },
      };

      mockRequest.body = validLoginData;
      mockLoginUser.mockResolvedValue(mockResult);

      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Login successful",
        user: mockResult.user,
        token: mockResult.token,
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "token",
        mockResult.token,
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
        }),
      );
    });

    test("should return error when password is incorrect", async () => {
      mockRequest.body = validLoginData;
      mockLoginUser.mockRejectedValue(new Error("Invalid credentials"));

      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid credentials",
      });
    });

    test("should return error when password is missing", async () => {
      mockRequest.body = {
        email: validLoginData.email,
        password: "",
      };

      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Email and password required",
      });
    });

    test("should return error when user does not exist", async () => {
      mockRequest.body = {
        email: "nonexistent@example.com",
        password: "password123",
      };
      mockLoginUser.mockRejectedValue(new Error("Invalid credentials"));

      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid credentials",
      });
    });

    test("should return error when email format is invalid", async () => {
      mockRequest.body = {
        email: "invalid-email-format",
        password: "password123",
      };

      // Mock the service to reject with invalid credentials error
      mockLoginUser.mockRejectedValue(new Error("Invalid credentials"));

      await userController.login(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Login doesn't validate email format upfront, so it attempts login and returns 401
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid credentials",
      });
    });
  });
});
