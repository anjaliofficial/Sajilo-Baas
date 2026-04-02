import { z } from "zod";
import {
  checkAvailability,
  calculateTotalPrice,
} from "../../../src/utils/bookingUtils";
import { formatZodError } from "../../../src/utils/formatZodError";

describe("Utils", () => {
  test("checkAvailability: returns true when check-in/out are within available range", () => {
    const result = checkAvailability(
      new Date("2026-04-01"),
      new Date("2026-04-30"),
      new Date("2026-04-10"),
      new Date("2026-04-15"),
    );

    expect(result).toBe(true);
  });

  test("checkAvailability: returns false when check-in is before availableFrom", () => {
    const result = checkAvailability(
      new Date("2026-04-01"),
      new Date("2026-04-30"),
      new Date("2026-03-31"),
      new Date("2026-04-15"),
    );

    expect(result).toBe(false);
  });

  test("checkAvailability: returns false when check-out is after availableTo", () => {
    const result = checkAvailability(
      new Date("2026-04-01"),
      new Date("2026-04-30"),
      new Date("2026-04-10"),
      new Date("2026-05-01"),
    );

    expect(result).toBe(false);
  });

  test("calculateTotalPrice: multiplies nightly price by number of days", () => {
    const total = calculateTotalPrice(2500, 4);

    expect(total).toBe(10000);
  });

  test("formatZodError: maps issues to path/message objects", () => {
    const schema = z.object({
      email: z.string().email("Invalid email"),
      profile: z.object({
        age: z.number().min(18, "Must be 18+"),
      }),
    });

    const parsed = schema.safeParse({
      email: "not-an-email",
      profile: { age: 16 },
    });

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      const formatted = formatZodError(parsed.error);

      expect(formatted).toEqual(
        expect.arrayContaining([
          { path: "email", message: "Invalid email" },
          { path: "profile.age", message: "Must be 18+" },
        ]),
      );
    }
  });
});
