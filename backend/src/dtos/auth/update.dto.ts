import { z } from "zod";

export const UpdateUserDTO = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  phoneNumber: z.string().regex(/^[0-9]{7,15}$/, "Invalid phone number").optional(),
  address: z.string().min(3, "Address is required").optional(),
  role: z.enum(["customer", "host", "admin"]).optional(),
  profilePicture: z.string().optional(),
});

export type UpdateUserDTOType = z.infer<typeof UpdateUserDTO>;
