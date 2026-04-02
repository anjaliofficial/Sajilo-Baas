import mongoose from "mongoose";
import { MONGODB_URI } from "../config/index";

export async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5s timeout
    });
    console.log(" Connected to MongoDB successfully.");
  } catch (error) {
    console.error(" Error connecting to MongoDB:", error);
    console.error(
      "Tip: If using +srv URI, DNS might be blocked. Use the standard non-SRV URI from Atlas."
    );
    process.exit(1);
  }
}