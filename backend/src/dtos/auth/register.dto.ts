import { z } from "zod";

// Register DTO
export const CreateUserDTO = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
    phoneNumber: z
      .string()
      .regex(/^[0-9]{7,15}$/, "Invalid phone number"),
    address: z.string().min(3, "Address is required"),
    role: z.enum(["customer", "host", "admin"]).optional(),
    profilePicture: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CreateUserDTOType = z.infer<typeof CreateUserDTO>;
