// import Listing, { IListing } from "../models/listing.model";
// import {
//   CreateListingDto,
//   NearbySearchDto,
// } from "../dtos/listing/listing.dtos";

// export default class ListingRepository {
//   // Create new listing
//   async create(dto: CreateListingDto): Promise<IListing> {
//     const listing = new Listing(dto);
//     return listing.save();
//   }

//   // Find all listings
//   async findAll(): Promise<IListing[]> {
//     return Listing.find({});
//   }

//   // Find listing by ID
//   async findById(id: string): Promise<IListing | null> {
//     return Listing.findById(id);
//   }

//   // Find listings near a point
//   async findNearby(dto: NearbySearchDto): Promise<IListing[]> {
//     const radius = dto.radius ?? 3000; // default 3 km
//     return Listing.find({
//       coordinates: {
//         $near: {
//           $geometry: {
//             type: "Point",
//             coordinates: [dto.lng, dto.lat],
//           },
//           $maxDistance: radius,
//         },
//       },
//     });
//   }

//   // Find listings by hostId
//   async findByHostId(hostId: string): Promise<IListing[]> {
//     return Listing.find({ hostId }).sort({ createdAt: -1 });
//   }

//   // Update listing
//   async update(
//     id: string,
//     payload: Partial<IListing>,
//   ): Promise<IListing | null> {
//     const listing = await Listing.findById(id);
//     if (!listing) return null;
//     Object.assign(listing, payload);
//     return listing.save();
//   }

//   // Delete listing
//   async delete(id: string): Promise<boolean> {
//     const listing = await Listing.findById(id);
//     if (!listing) return false;
//     await listing.deleteOne();
//     return true;
//   }
// }
