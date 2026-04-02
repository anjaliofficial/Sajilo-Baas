import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

jest.setTimeout(60000);

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  const mongoUri = process.env.TEST_DB_URI;

  if (mongoUri) {
    await mongoose.connect(mongoUri);
    return;
  }

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.close();

  if (mongoServer) {
    await mongoServer.stop();
  }
});
