jest.mock("../../../src/models/listing.model", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  },
}));

import Listing from "../../../src/models/listing.model";
import {
  createListingService,
  getListingsService,
  getListingByIdService,
} from "../../../src/services/listing/listing.service";

describe("ListingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("createListingService: should create listing successfully", async () => {
    const payload = {
      title: "Modern Room",
      location: "Kathmandu",
      pricePerNight: 2500,
    };

    const created = {
      _id: "listing-1",
      ...payload,
    };

    (Listing.create as jest.Mock).mockResolvedValue(created);

    const result = await createListingService(payload);

    expect(Listing.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(created);
  });

  test("createListingService: should throw when create fails", async () => {
    const payload = {
      title: "Modern Room",
      location: "Kathmandu",
      pricePerNight: 2500,
    };

    (Listing.create as jest.Mock).mockRejectedValue(
      new Error("DB create failed"),
    );

    await expect(createListingService(payload)).rejects.toThrow(
      "DB create failed",
    );
  });

  test("getListingsService: should return listings sorted by createdAt desc", async () => {
    const listings = [{ _id: "l2" }, { _id: "l1" }];

    const sortMock = jest.fn().mockResolvedValue(listings);
    (Listing.find as jest.Mock).mockReturnValue({
      sort: sortMock,
    });

    const result = await getListingsService();

    expect(Listing.find).toHaveBeenCalled();
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toEqual(listings);
  });

  test("getListingByIdService: should return listing when id exists", async () => {
    const listing = {
      _id: "listing-99",
      title: "Cozy Studio",
    };

    (Listing.findById as jest.Mock).mockResolvedValue(listing);

    const result = await getListingByIdService("listing-99");

    expect(Listing.findById).toHaveBeenCalledWith("listing-99");
    expect(result).toEqual(listing);
  });

  test("getListingByIdService: should return null when listing not found", async () => {
    (Listing.findById as jest.Mock).mockResolvedValue(null);

    const result = await getListingByIdService("missing-id");

    expect(Listing.findById).toHaveBeenCalledWith("missing-id");
    expect(result).toBeNull();
  });
});
