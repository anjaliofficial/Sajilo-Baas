jest.mock("../../../src/models/booking.model", () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock("../../../src/models/listing.model", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock("../../../src/models/user.model", () => ({
  UserModel: {
    findById: jest.fn(),
  },
}));

jest.mock("../../../src/services/notification/notification.service", () => ({
  sendSocketNotification: jest.fn(),
}));

import Booking from "../../../src/models/booking.model";
import Listing from "../../../src/models/listing.model";
import { UserModel } from "../../../src/models/user.model";
import { BookingService } from "../../../src/services/booking/booking.service";

describe("BookingService", () => {
  let bookingService: BookingService;

  beforeEach(() => {
    jest.clearAllMocks();
    bookingService = new BookingService();
  });

  test("checkAvailability: should return true when listing is available and no overlaps", async () => {
    (Listing.findById as jest.Mock).mockResolvedValue({
      availableFrom: new Date("2026-01-01"),
      availableTo: new Date("2026-12-31"),
    });
    (Booking.countDocuments as jest.Mock).mockResolvedValue(0);

    const result = await bookingService.checkAvailability(
      "listing-1",
      new Date("2026-04-10"),
      new Date("2026-04-15"),
    );

    expect(result).toBe(true);
    expect(Booking.countDocuments).toHaveBeenCalled();
  });

  test("createBooking: should create booking successfully", async () => {
    const listing = {
      _id: "listing-1",
      hostId: "host-1",
      minStay: 1,
      pricePerNight: 100,
      availableFrom: new Date("2026-01-01"),
      availableTo: new Date("2026-12-31"),
    };

    (Listing.findById as jest.Mock).mockResolvedValue(listing);
    (UserModel.findById as jest.Mock).mockResolvedValue({
      _id: "customer-1",
      status: "active",
    });

    jest
      .spyOn(bookingService, "checkAvailability")
      .mockResolvedValue(true as never);

    const populatedBooking = { _id: "booking-1", status: "pending" };
    (Booking.create as jest.Mock).mockResolvedValue({
      populate: jest.fn().mockResolvedValue(populatedBooking),
    });

    const result = await bookingService.createBooking({
      listingId: "listing-1",
      customerId: "customer-1",
      checkInDate: new Date("2026-04-10"),
      checkOutDate: new Date("2026-04-12"),
    });

    expect(Booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        listingId: "listing-1",
        customerId: "customer-1",
        hostId: "host-1",
        totalNights: 2,
        totalPrice: 200,
        status: "pending",
      }),
    );
    expect(result).toEqual(populatedBooking);
  });

  test("createBooking: should throw 400 when check-in is not before check-out", async () => {
    await expect(
      bookingService.createBooking({
        listingId: "listing-1",
        customerId: "customer-1",
        checkInDate: new Date("2026-04-10"),
        checkOutDate: new Date("2026-04-10"),
      }),
    ).rejects.toMatchObject({
      message: "Check-in date must be before check-out date",
      statusCode: 400,
    });
  });

  test("createBooking: should throw 404 when listing is not found", async () => {
    (Listing.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      bookingService.createBooking({
        listingId: "missing-listing",
        customerId: "customer-1",
        checkInDate: new Date("2026-04-10"),
        checkOutDate: new Date("2026-04-12"),
      }),
    ).rejects.toMatchObject({
      message: "Listing not found",
      statusCode: 404,
    });
  });

  test("createBooking: should throw error when dates overlap", async () => {
    (Listing.findById as jest.Mock).mockResolvedValue({
      _id: "listing-1",
      hostId: "host-1",
      minStay: 1,
      pricePerNight: 100,
      availableFrom: new Date("2026-01-01"),
      availableTo: new Date("2026-12-31"),
    });

    (UserModel.findById as jest.Mock).mockResolvedValue({
      _id: "customer-1",
      status: "active",
    });

    jest
      .spyOn(bookingService, "checkAvailability")
      .mockResolvedValue(false as never);

    await expect(
      bookingService.createBooking({
        listingId: "listing-1",
        customerId: "customer-1",
        checkInDate: new Date("2026-04-10"),
        checkOutDate: new Date("2026-04-12"),
      }),
    ).rejects.toMatchObject({
      message:
        "The selected dates are already booked. Please choose different dates.",
      statusCode: 400,
    });
    expect(Booking.create).not.toHaveBeenCalled();
  });
});
