// utils/bookingUtils.ts
export const checkAvailability = (
  availableFrom: Date,
  availableTo: Date,
  checkIn: Date,
  checkOut: Date,
): boolean => {
  return checkIn >= availableFrom && checkOut <= availableTo;
};

export const calculateTotalPrice = (
  pricePerNight: number,
  days: number,
): number => {
  return pricePerNight * days;
};
