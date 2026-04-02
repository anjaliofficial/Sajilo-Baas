import { CreateUserDTO } from "../../../src/dtos/auth/register.dto";
import { loginUserDTO } from "../../../src/dtos/auth/login.dto";
import { UpdateUserDTO } from "../../../src/dtos/auth/update.dto";

describe("DTOs", () => {
  test("CreateUserDTO: should parse valid payload", () => {
    const parsed = CreateUserDTO.parse({
      fullName: "Valid User",
      email: "valid@example.com",
      password: "password123",
      confirmPassword: "password123",
      phoneNumber: "9800000000",
      address: "Kathmandu",
    });

    expect(parsed.email).toBe("valid@example.com");
  });

  test("CreateUserDTO: should fail for invalid email", () => {
    const result = CreateUserDTO.safeParse({
      fullName: "Valid User",
      email: "invalid-email",
      password: "password123",
      confirmPassword: "password123",
      phoneNumber: "9800000000",
      address: "Kathmandu",
    });

    expect(result.success).toBe(false);
  });

  test("loginUserDTO: should fail for short password", () => {
    const result = loginUserDTO.safeParse({
      email: "valid@example.com",
      password: "123",
    });

    expect(result.success).toBe(false);
  });

  test("UpdateUserDTO: should allow partial updates", () => {
    const result = UpdateUserDTO.parse({
      fullName: "Updated Name",
    });

    expect(result.fullName).toBe("Updated Name");
  });
});
