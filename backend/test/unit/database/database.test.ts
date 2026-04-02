jest.mock("mongoose", () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
  },
}));

jest.mock("../../../src/config/index", () => ({
  MONGODB_URI: "mongodb://localhost:27017/test-db",
}));

import mongoose from "mongoose";
import { connectToDatabase } from "../../../src/database/mongodb";

describe("Database (connectToDatabase)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should connect using configured MONGODB_URI", async () => {
    (mongoose.connect as jest.Mock).mockResolvedValue({});

    await connectToDatabase();

    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/test-db",
    );
  });

  test("should log success when connected", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (mongoose.connect as jest.Mock).mockResolvedValue({});

    await connectToDatabase();

    expect(logSpy).toHaveBeenCalledWith("Connected to MongoDB successfully.");
    logSpy.mockRestore();
  });

  test("should exit process on connection failure", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as any);

    (mongoose.connect as jest.Mock).mockRejectedValue(
      new Error("connect failed"),
    );

    await connectToDatabase();

    expect(errSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);

    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
