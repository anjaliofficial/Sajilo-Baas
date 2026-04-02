import { ZodError } from "zod";

export function formatZodError(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join("."),   // e.g. "email" or "address.street"
    message: issue.message,       // human-readable error message
  }));
}
