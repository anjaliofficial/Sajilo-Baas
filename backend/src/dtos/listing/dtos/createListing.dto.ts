export interface CreateListingDTO {
  title: string;
  description: string;
  location: string;

  lat: number;
  lng: number;

  propertyType: "room" | "apartment" | "house" | "homestay" | "villa";

  amenities: string[];

  pricePerNight: number;

  availableFrom: Date;
  availableTo: Date;

  minStay: number;
  maxGuests: number;

  cancellationPolicy: "flexible" | "moderate" | "strict";

  houseRules: string;

  images: string[];
}
