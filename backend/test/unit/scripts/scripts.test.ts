const mockConnectToDatabase = jest.fn();
const mockDisconnect = jest.fn();

jest.mock("mongoose", () => ({
  __esModule: true,
  default: {
    disconnect: mockDisconnect,
  },
}));

jest.mock("../../../src/database/mongodb", () => ({
  connectToDatabase: mockConnectToDatabase,
}));

const mockListing = {
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
  find: jest.fn(),
  bulkWrite: jest.fn(),
};

jest.mock("../../../src/models/listing.model", () => ({
  __esModule: true,
  default: mockListing,
}));

describe("Scripts", () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    jest.clearAllMocks();
    process.argv = [...originalArgv];
  });

  afterAll(() => {
    process.argv = originalArgv;
  });

  test("backfill-listing-coordinates: dry-run should count candidates", async () => {
    process.argv = ["node", "script", "--dry-run"];
    mockListing.countDocuments.mockResolvedValue(3);

    await import("../../../src/scripts/backfill-listing-coordinates");

    await new Promise((resolve) => setImmediate(resolve));

    expect(mockConnectToDatabase).toHaveBeenCalled();
    expect(mockListing.countDocuments).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
  }, 15000);

  test("backfill-listing-coordinates: normal mode should call updateMany", async () => {
    process.argv = ["node", "script"];
    mockListing.countDocuments.mockResolvedValue(2);
    mockListing.updateMany.mockResolvedValue({
      matchedCount: 2,
      modifiedCount: 2,
    });

    jest.resetModules();
    await import("../../../src/scripts/backfill-listing-coordinates");
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockListing.updateMany).toHaveBeenCalled();
  }, 15000);

  test("backfill-listing-location-details: dry-run should scan candidates", async () => {
    process.argv = ["node", "script", "--dry-run"];
    mockListing.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

    jest.resetModules();
    await import("../../../src/scripts/backfill-listing-location-details");
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockListing.find).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
  }, 15000);

  test("backfill-listing-location-details: no updates should skip bulkWrite", async () => {
    process.argv = ["node", "script"];
    mockListing.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

    jest.resetModules();
    await import("../../../src/scripts/backfill-listing-location-details");
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockListing.bulkWrite).not.toHaveBeenCalled();
  }, 15000);
});
