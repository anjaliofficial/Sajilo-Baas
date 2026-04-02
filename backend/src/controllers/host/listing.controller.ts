// controllers/listing.controller.ts

import { Request, Response } from "express";
import Listing from "../../models/listing.model";
import { AuthRequest } from "../../middlewares/auth.middleware";

const parseNumber = (value: unknown, fallback?: number) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDate = (value: unknown) => {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizeAmenities = (value: unknown) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return [String(value)];
};

const normalizeLocationText = (
  fullAddress?: string,
  neighborhood?: string,
  city?: string,
) => {
  const parts = [fullAddress, neighborhood, city]
    .map((item) => (item || "").trim())
    .filter(Boolean);
  return parts.join(", ");
};

const buildListingPayload = (
  body: Record<string, unknown>,
  partial = false,
) => {
  const payload: Record<string, unknown> = {};

  const hasKey = (key: string) =>
    Object.prototype.hasOwnProperty.call(body, key);

  const setField = (key: string, value: unknown) => {
    if (partial && !hasKey(key)) return;
    if (value === undefined && partial) return;
    payload[key] = value;
  };

  setField("title", body.title);
  setField("description", body.description);

  const city = typeof body.city === "string" ? body.city.trim() : undefined;
  const neighborhood =
    typeof body.neighborhood === "string"
      ? body.neighborhood.trim()
      : undefined;
  const fullAddress =
    typeof body.fullAddress === "string" ? body.fullAddress.trim() : undefined;

  const locationFromDetails = normalizeLocationText(
    fullAddress,
    neighborhood,
    city,
  );
  const rawLocation =
    typeof body.location === "string" ? body.location.trim() : "";
  const effectiveLocation = locationFromDetails || rawLocation;

  setField("location", effectiveLocation);
  if (
    !partial ||
    hasKey("city") ||
    hasKey("neighborhood") ||
    hasKey("fullAddress")
  ) {
    setField("locationDetails", {
      city: city || "",
      neighborhood: neighborhood || "",
      fullAddress: fullAddress || "",
    });
  }

  // 🗺 MAP COORDINATES
  const latitude = parseNumber(body.latitude ?? body.lat);
  const longitude = parseNumber(body.longitude ?? body.lng);

  setField("latitude", latitude);
  setField("longitude", longitude);

  if (
    latitude !== undefined &&
    longitude !== undefined &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    setField("coordinates", {
      type: "Point",
      coordinates: [longitude, latitude],
    });
  }

  setField("propertyType", body.propertyType);

  if (hasKey("amenities")) {
    setField("amenities", normalizeAmenities(body.amenities));
  }

  setField("pricePerNight", parseNumber(body.pricePerNight));
  setField("availableFrom", parseDate(body.availableFrom));
  setField("availableTo", parseDate(body.availableTo));
  setField("minStay", parseNumber(body.minStay, 1));
  setField("maxGuests", parseNumber(body.maxGuests, 1));
  setField("cancellationPolicy", body.cancellationPolicy);
  setField("houseRules", body.houseRules);

  // Handle images array
  if (hasKey("images")) {
    if (Array.isArray(body.images)) {
      setField("images", body.images);
    }
  }

  return payload;
};

export const createListing = async (req: AuthRequest, res: Response) => {
  try {
    const images = req.files
      ? (req.files as Express.Multer.File[]).map(
          (f) => `/uploads/${f.filename}`,
        )
      : [];

    const payload = buildListingPayload(req.body);

    const listing = await Listing.create({
      ...payload,
      images,
      hostId: req.user._id,
      status: "approved",
    });

    res.status(201).json(listing);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyListings = async (req: AuthRequest, res: Response) => {
  try {
    const listings = await Listing.find({
      hostId: req.user._id.toString(),
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      listings,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateListing = async (req: AuthRequest, res: Response) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.hostId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    const payload = buildListingPayload(req.body, true);

    Object.assign(listing, payload);

    await listing.save();

    res.json(listing);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getListings = async (req: Request, res: Response) => {
  try {
    const {
      location,
      city,
      neighborhood,
      minPrice,
      maxPrice,
      propertyType,
      availableFrom,
      availableTo,
      guests,
      amenities,
      lat,
      lng,
      radiusKm,
      page = "1",
      limit = "20",
    } = req.query;

    const filter: Record<string, any> = {};

    const locationQuery = String(location || "").trim();
    const cityQuery = String(city || "").trim();
    const neighborhoodQuery = String(neighborhood || "").trim();

    if (locationQuery) {
      filter.$or = [
        { location: { $regex: locationQuery, $options: "i" } },
        {
          "locationDetails.city": {
            $regex: locationQuery,
            $options: "i",
          },
        },
        {
          "locationDetails.neighborhood": {
            $regex: locationQuery,
            $options: "i",
          },
        },
        {
          "locationDetails.fullAddress": {
            $regex: locationQuery,
            $options: "i",
          },
        },
      ];
    }

    if (cityQuery) {
      filter["locationDetails.city"] = {
        $regex: cityQuery,
        $options: "i",
      };
    }

    if (neighborhoodQuery) {
      filter["locationDetails.neighborhood"] = {
        $regex: neighborhoodQuery,
        $options: "i",
      };
    }

    if (propertyType) {
      filter.propertyType = String(propertyType);
    }

    const min = parseNumber(minPrice);
    const max = parseNumber(maxPrice);

    if (min !== undefined || max !== undefined) {
      filter.pricePerNight = {};
      if (min !== undefined) filter.pricePerNight.$gte = min;
      if (max !== undefined) filter.pricePerNight.$lte = max;
    }

    const fromDate = parseDate(availableFrom);
    const toDate = parseDate(availableTo);

    if (fromDate) {
      filter.availableFrom = { $lte: fromDate };
    }

    if (toDate) {
      filter.availableTo = { ...(filter.availableTo || {}), $gte: toDate };
    }

    const guestCount = parseNumber(guests);

    if (guestCount !== undefined) {
      filter.maxGuests = { $gte: guestCount };
    }

    if (amenities) {
      const amenityList = String(amenities)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (amenityList.length) {
        filter.amenities = { $all: amenityList };
      }
    }

    const searchLat = parseNumber(lat);
    const searchLng = parseNumber(lng);
    const searchRadiusKm = Math.max(parseNumber(radiusKm, 10) || 10, 0.1);
    const hasGeoQuery =
      searchLat !== undefined &&
      searchLng !== undefined &&
      Number.isFinite(searchLat) &&
      Number.isFinite(searchLng);

    if (hasGeoQuery) {
      filter.coordinates = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [searchLng, searchLat],
          },
          $maxDistance: searchRadiusKm * 1000,
        },
      };
    }

    const pageNumber = Math.max(parseNumber(page, 1) || 1, 1);
    const limitNumber = Math.min(parseNumber(limit, 20) || 20, 50);

    const baseQuery = Listing.find(filter)
      .populate("hostId", "fullName phoneNumber profilePicture")
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    if (!hasGeoQuery) {
      baseQuery.sort({ createdAt: -1 });
    }

    const [listings, total] = await Promise.all([
      baseQuery,

      Listing.countDocuments(filter),
    ]);

    res.json({
      success: true,
      listings,
      total,
      page: pageNumber,
      limit: limitNumber,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getListingById = async (req: Request, res: Response) => {
  try {
    const { availableFrom, availableTo } = req.query;

    const listing = await Listing.findById(req.params.id).populate(
      "hostId",
      "fullName phoneNumber profilePicture address",
    );

    if (!listing) return res.status(404).json({ message: "Listing not found" });

    let isAvailable: boolean | undefined;

    const fromDate = parseDate(availableFrom);
    const toDate = parseDate(availableTo);

    if (fromDate && toDate) {
      isAvailable =
        listing.availableFrom <= fromDate && listing.availableTo >= toDate;
    }

    res.json({
      success: true,
      listing,
      isAvailable,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteListing = async (req: AuthRequest, res: Response) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.hostId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    await listing.deleteOne();

    res.json({
      message: "Listing deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLocationSuggestions = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(parseNumber(req.query.limit, 10) || 10, 30);

    if (!q) {
      return res.json({ success: true, suggestions: [] });
    }

    const listings = await Listing.find(
      {
        $or: [
          { location: { $regex: q, $options: "i" } },
          {
            "locationDetails.city": {
              $regex: q,
              $options: "i",
            },
          },
          {
            "locationDetails.neighborhood": {
              $regex: q,
              $options: "i",
            },
          },
          {
            "locationDetails.fullAddress": {
              $regex: q,
              $options: "i",
            },
          },
        ],
      },
      {
        location: 1,
        "locationDetails.city": 1,
        "locationDetails.neighborhood": 1,
        "locationDetails.fullAddress": 1,
      },
    )
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const seen = new Set<string>();
    const suggestions: string[] = [];

    for (const listing of listings) {
      const cityValue = String(listing?.locationDetails?.city || "").trim();
      const neighborhoodValue = String(
        listing?.locationDetails?.neighborhood || "",
      ).trim();
      const fullAddressValue = String(
        listing?.locationDetails?.fullAddress || "",
      ).trim();
      const locationValue = String(listing?.location || "").trim();

      const candidates = [
        fullAddressValue,
        normalizeLocationText(undefined, neighborhoodValue, cityValue),
        cityValue,
        locationValue,
      ].filter(Boolean);

      for (const candidate of candidates) {
        if (!candidate.toLowerCase().includes(q.toLowerCase())) continue;
        const key = candidate.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        suggestions.push(candidate);
        if (suggestions.length >= limit) break;
      }

      if (suggestions.length >= limit) break;
    }

    res.json({ success: true, suggestions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
