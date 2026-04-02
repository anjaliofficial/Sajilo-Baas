import Listing from "../../models/listing.model";

export const createListingService = async (data: any) => {
  return await Listing.create(data);
};

export const getListingsService = async () => {
  return await Listing.find().sort({ createdAt: -1 });
};

export const getListingByIdService = async (id: string) => {
  return await Listing.findById(id);
};
