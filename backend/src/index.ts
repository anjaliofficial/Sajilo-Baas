import app, { server } from "./app";
import { connectToDatabase } from "./database/mongodb";
import { PORT } from "./config/index";

// Start server
async function startServer() {
  try {
    await connectToDatabase();
    // ✅ Listen on all interfaces (localhost and 127.0.0.1 will work)
    server.listen(5050, "0.0.0.0", () => {
      console.log("Server running on http://0.0.0.0:5050");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
