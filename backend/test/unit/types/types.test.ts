import { userSchema } from "../../../src/types/user.type";

describe("Types (userSchema)", () => {
  test("should parse valid user payload", () => {
    const parsed = userSchema.parse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
      username: "testuser",
      address: "Kathmandu",
      contactNumber: "9800000000",
      role: "host",
    });

    expect(parsed.role).toBe("host");
  });

  test("should fail for invalid email", () => {
    const result = userSchema.safeParse({
      email: "invalid",
      password: "password123",
      confirmPassword: "password123",
      username: "testuser",
      address: "Kathmandu",
      contactNumber: "9800000000",
      role: "user",
    });

    expect(result.success).toBe(false);
  });

  test("should fail when passwords do not match", () => {
    const result = userSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "different123",
      username: "testuser",
      address: "Kathmandu",
      contactNumber: "9800000000",
      role: "user",
    });

    expect(result.success).toBe(false);
  });
});
