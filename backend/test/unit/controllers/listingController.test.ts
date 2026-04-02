jest.mock("../../../src/models/listing.model", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

import { Request, Response } from "express";
import Listing from "../../../src/models/listing.model";
import {
  createListing,
  updateListing,
  deleteListing,
  getListings,
  getListingById,
} from "../../../src/controllers/host/listing.controller";

const mockedListing = Listing as jest.Mocked<typeof Listing>;

describe("ListingController", () => {
  let req: any;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { _id: "host-1" },
      files: [],
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test("add property: should create listing with valid data", async () => {
    req.body = {
      title: "Cozy Apartment",
      description: "Nice stay",
      city: "Kathmandu",
      fullAddress: "New Baneshwor",
      pricePerNight: 2500,
      minStay: 1,
      maxGuests: 2,
      propertyType: "apartment",
    };
    req.files = [{ filename: "img1.jpg" }];

    const created = { _id: "listing-1", title: "Cozy Apartment" };
    mockedListing.create.mockResolvedValue(created as any);

    await createListing(req as any, res as Response);

    expect(mockedListing.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Cozy Apartment",
        hostId: "host-1",
        status: "approved",
        images: ["/uploads/img1.jpg"],
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  test("update property: should update listing for owner", async () => {
    req.params = { id: "listing-1" };
    req.body = { title: "Updated Title", pricePerNight: 3000 };

    const listingDoc = {
      hostId: { toString: () => "host-1" },
      title: "Old Title",
      pricePerNight: 2000,
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockedListing.findById.mockResolvedValue(listingDoc as any);

    await updateListing(req as any, res as Response);

    expect(listingDoc.title).toBe("Updated Title");
    expect(listingDoc.pricePerNight).toBe(3000);
    expect(listingDoc.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(listingDoc);
  });

  test("delete property: should delete listing for owner", async () => {
    req.params = { id: "listing-1" };

    const listingDoc = {
      hostId: { toString: () => "host-1" },
      deleteOne: jest.fn().mockResolvedValue(undefined),
    };

    mockedListing.findById.mockResolvedValue(listingDoc as any);

    await deleteListing(req as any, res as Response);

    expect(listingDoc.deleteOne).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "Listing deleted successfully",
    });
  });

  test("fetch properties: should return paginated listings", async () => {
    req.query = { page: "1", limit: "20" };

    const list = [{ _id: "l1" }, { _id: "l2" }];
    const queryChain: any = {
      populate: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      then: (resolve: any) => Promise.resolve(list).then(resolve),
    };

    mockedListing.find.mockReturnValue(queryChain);
    mockedListing.countDocuments.mockResolvedValue(2 as any);

    await getListings(req as Request, res as Response);

    expect(mockedListing.find).toHaveBeenCalled();
    expect(mockedListing.countDocuments).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      listings: list,
      total: 2,
      page: 1,
      limit: 20,
    });
  });

  test("fetch property: should return listing by id", async () => {
    req.params = { id: "listing-1" };

    const listingDoc = { _id: "listing-1", title: "Cozy Apartment" };
    mockedListing.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(listingDoc),
    } as any);

    await getListingById(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      listing: listingDoc,
      isAvailable: undefined,
    });
  });
});
