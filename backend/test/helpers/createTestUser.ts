import { Express } from "express";

const request = require("supertest");

export type TestUserRole = "customer" | "host" | "admin";

export interface CreateTestUserInput {
  email: string;
  password?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  role?: TestUserRole;
}

export interface CreateTestUserResult {
  token: string;
  user: any;
  email: string;
  password: string;
}

export const createTestUser = async (
  app: Express,
  input: CreateTestUserInput,
): Promise<CreateTestUserResult> => {
  const password = input.password ?? "password123";

  const payload = {
    fullName: input.fullName ?? "Test User",
    email: input.email,
    password,
    confirmPassword: password,
    phoneNumber: input.phoneNumber ?? "9800000000",
    address: input.address ?? "Kathmandu",
    role: input.role ?? "customer",
  };

  const res = await request(app).post("/api/auth/register").send(payload);

  if (res.status !== 201 || !res.body?.token) {
    throw new Error(
      `createTestUser failed: status=${res.status}, body=${JSON.stringify(res.body)}`,
    );
  }

  return {
    token: res.body.token,
    user: res.body.user,
    email: payload.email,
    password,
  };
};

export default createTestUser;
