import mongoose, { Schema, Document } from "mongoose";

export interface IListing extends Document {
  title: string;
  description: string;
  location: string;
  locationDetails?: {
    city?: string;
    neighborhood?: string;
    fullAddress?: string;
  };

  latitude?: number;
  longitude?: number;
  coordinates?: {
    type: "Point";
    coordinates: [number, number];
  };

  propertyType: "room" | "apartment" | "house" | "homestay" | "villa";
  amenities: string[];
  pricePerNight: number;
  availableFrom: Date;
  availableTo: Date;
  minStay: number;
  maxGuests: number;
  cancellationPolicy: string;
  houseRules: string;
  images: string[];
  hostId: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },

    locationDetails: {
      city: { type: String, default: "" },
      neighborhood: { type: String, default: "" },
      fullAddress: { type: String, default: "" },
    },

    latitude: { type: Number },
    longitude: { type: Number },

    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },

    propertyType: {
      type: String,
      enum: ["room", "apartment", "house", "homestay", "villa"],
      default: "room",
    },

    amenities: { type: [String], default: [] },

    pricePerNight: { type: Number, required: true },

    availableFrom: { type: Date, required: true },
    availableTo: { type: Date, required: true },

    minStay: { type: Number, default: 1 },
    maxGuests: { type: Number, default: 1 },

    cancellationPolicy: {
      type: String,
      enum: ["flexible", "moderate", "strict"],
      default: "moderate",
    },

    houseRules: { type: String, default: "" },

    images: { type: [String], default: [] },

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

ListingSchema.index({ coordinates: "2dsphere" });
ListingSchema.index({
  location: "text",
  "locationDetails.city": "text",
  "locationDetails.neighborhood": "text",
  "locationDetails.fullAddress": "text",
});

export default mongoose.model<IListing>("Listing", ListingSchema);
