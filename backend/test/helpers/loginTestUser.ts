import { Express } from "express";

const request = require("supertest");

export interface LoginTestUserInput {
  email: string;
  password: string;
}

export interface LoginTestUserResult {
  token: string;
  user?: any;
}

export const loginTestUser = async (
  app: Express,
  input: LoginTestUserInput,
): Promise<LoginTestUserResult> => {
  const res = await request(app).post("/api/auth/login").send({
    email: input.email,
    password: input.password,
  });

  if (res.status !== 200 || !res.body?.token) {
    throw new Error(
      `loginTestUser failed: status=${res.status}, body=${JSON.stringify(res.body)}`,
    );
  }

  return {
    token: res.body.token,
    user: res.body.user,
  };
};

export default loginTestUser;
