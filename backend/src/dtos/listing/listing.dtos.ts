export interface ListingDTO {
  _id: string;

  title: string;
  description: string;

  location: string;

  lat: number;
  lng: number;

  propertyType: string;

  amenities: string[];

  pricePerNight: number;

  availableFrom: Date;
  availableTo: Date;

  minStay: number;
  maxGuests: number;

  cancellationPolicy: string;

  houseRules: string;

  images: string[];

  hostId: string;

  status: string;
}
