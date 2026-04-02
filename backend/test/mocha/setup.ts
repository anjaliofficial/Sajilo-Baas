import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

let mongoServer: MongoMemoryServer | null = null;

export const mochaHooks = {
	beforeAll: [
		async function () {
			const mongoUri = process.env.TEST_DB_URI;

			if (mongoUri) {
				await mongoose.connect(mongoUri);
				return;
			}

			mongoServer = await MongoMemoryServer.create();
			await mongoose.connect(mongoServer.getUri());
		},
	],
	afterAll: [
		async function () {
			await mongoose.connection.close();

			if (mongoServer) {
				await mongoServer.stop();
			}
		},
	],
};
