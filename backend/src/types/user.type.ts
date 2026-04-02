import { z } from "zod";

export const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  address: z.string().min(3, "Address is required"),
  contactNumber: z
    .string()
    .regex(/^[0-9]{7,15}$/, "Invalid contact number"),
  role: z.enum(["user", "admin", "host"]).default("user"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// TypeScript type inferred from schema
export type UserType = z.infer<typeof userSchema>;
