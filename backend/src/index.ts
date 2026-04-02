import { server } from "./app";
import { connectToDatabase } from "./database/mongodb";
import { PORT } from "./config/index";

async function startServer() {
  try {
    await connectToDatabase();
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();