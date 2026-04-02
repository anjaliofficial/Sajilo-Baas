import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";

describe("Authentication Routes", // test group/suites name 
    () => {
        const testUser = {
            fullName: "Test User",
            email: "test@example.com",
            password: "password123",
            confirmPassword: "password123",
            phoneNumber: "1234567890",
            address: "123 Test St",
            role: "customer" as const,
        };
        beforeAll(async () => {
            //  clean up before test
            await UserModel.deleteMany({ email: testUser.email });
        });

        afterAll(async () => {
            //  clean up after test
            await UserModel.deleteMany({ email: testUser.email });
        });

        describe("POST /api/auth/register", () => {
            test(
                'Should register a new user successfully',
                async () => {
                    const res = await request(app)
                        .post("/api/auth/register")
                        .send(testUser)
                        .expect(201);
                    expect(res.body).toHaveProperty("message", "User registered successfully");
                }
            );
        });
    });
