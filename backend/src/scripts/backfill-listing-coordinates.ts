import mongoose from "mongoose";
import { connectToDatabase } from "../database/mongodb";
import Listing from "../models/listing.model";

async function run() {
  const dryRun = process.argv.includes("--dry-run");

  await connectToDatabase();

  const filter: Record<string, any> = {
    $and: [
      {
        $or: [
          { coordinates: { $exists: false } },
          { coordinates: null },
          { "coordinates.coordinates": { $size: 0 } },
        ],
      },
      { latitude: { $type: "number" } },
      { longitude: { $type: "number" } },
    ],
  };

  const totalCandidates = await Listing.countDocuments(filter);

  if (dryRun) {
    console.log(`[Backfill] Dry run mode`);
    console.log(
      `[Backfill] Listings that can be backfilled: ${totalCandidates}`,
    );
    await mongoose.disconnect();
    return;
  }

  const result = await Listing.updateMany(filter, [
    {
      $set: {
        coordinates: {
          type: "Point",
          coordinates: ["$longitude", "$latitude"],
        },
      },
    },
  ]);

  console.log(`[Backfill] Matched: ${result.matchedCount}`);
  console.log(`[Backfill] Modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("[Backfill] Failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
