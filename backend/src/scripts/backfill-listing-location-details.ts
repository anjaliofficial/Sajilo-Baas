import mongoose from "mongoose";
import { connectToDatabase } from "../database/mongodb";
import Listing from "../models/listing.model";

type LocationDetails = {
  city: string;
  neighborhood: string;
  fullAddress: string;
};

const parseLocation = (location: string): LocationDetails => {
  const normalized = location.trim();
  const parts = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const city = parts.length ? parts[parts.length - 1] : "";
  const neighborhood = parts.length > 1 ? parts[parts.length - 2] : "";

  return {
    city,
    neighborhood,
    fullAddress: normalized,
  };
};

async function run() {
  const dryRun = process.argv.includes("--dry-run");

  await connectToDatabase();

  const candidates = await Listing.find(
    {
      location: { $type: "string", $ne: "" },
      $or: [
        { locationDetails: { $exists: false } },
        { "locationDetails.city": { $in: [null, ""] } },
        { "locationDetails.neighborhood": { $in: [null, ""] } },
        { "locationDetails.fullAddress": { $in: [null, ""] } },
      ],
    },
    { _id: 1, location: 1, locationDetails: 1 },
  ).lean();

  let wouldUpdate = 0;
  const operations: any[] = [];

  for (const listing of candidates) {
    const location = String((listing as any).location || "").trim();
    if (!location) continue;

    const existing = ((listing as any).locationDetails ||
      {}) as Partial<LocationDetails>;
    const parsed = parseLocation(location);

    const nextDetails: LocationDetails = {
      city: (existing.city || "").trim() || parsed.city,
      neighborhood: (existing.neighborhood || "").trim() || parsed.neighborhood,
      fullAddress: (existing.fullAddress || "").trim() || parsed.fullAddress,
    };

    const changed =
      nextDetails.city !== (existing.city || "") ||
      nextDetails.neighborhood !== (existing.neighborhood || "") ||
      nextDetails.fullAddress !== (existing.fullAddress || "");

    if (!changed) continue;

    wouldUpdate += 1;

    operations.push({
      updateOne: {
        filter: { _id: (listing as any)._id },
        update: { $set: { locationDetails: nextDetails } },
      },
    });
  }

  if (dryRun) {
    console.log(`[Backfill locationDetails] Dry run mode`);
    console.log(
      `[Backfill locationDetails] Candidates scanned: ${candidates.length}`,
    );
    console.log(
      `[Backfill locationDetails] Listings that would be updated: ${wouldUpdate}`,
    );
    await mongoose.disconnect();
    return;
  }

  if (!operations.length) {
    console.log(`[Backfill locationDetails] No updates needed.`);
    await mongoose.disconnect();
    return;
  }

  const result = await Listing.bulkWrite(operations, { ordered: false });

  console.log(
    `[Backfill locationDetails] Candidates scanned: ${candidates.length}`,
  );
  console.log(`[Backfill locationDetails] Planned updates: ${wouldUpdate}`);
  console.log(
    `[Backfill locationDetails] Modified: ${result.modifiedCount || 0}`,
  );

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("[Backfill locationDetails] Failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
