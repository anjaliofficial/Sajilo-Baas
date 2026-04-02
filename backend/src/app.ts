import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import uploadRoutes from "./routes/upload.routes";
import path from "path";
import cookieParser from "cookie-parser";
import adminRoutes from "./routes/admin/admin.routes";
import listingRoutes from "./routes/listing/listing.routes";
import customerBookingRoutes from "./routes/booking/customer.route";
import hostBookingRoutes from "./routes/booking/host.routes";
import messageRoutes from "./routes/message/message.route";
import reviewRoutes from "./routes/review/review.routes";
import moderationRoutes from "./routes/moderation/moderation.routes";
import notificationApiRoutes from "./routes/notification/notification.api.routes";
import { initSocket } from "./socket";
import http from "http";
import mime from "mime";
import * as admin from "firebase-admin";
import { ensureFirebaseAdminInitialized } from "./utils/firebase-admin";

const app = express();
const server = http.createServer(app);
initSocket(server);

// ✅ CORS MUST BE FIRST - Allow only frontend origin and credentials
app.use(
  cors({
    origin: "http://localhost:3000", // Frontend origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(cookieParser());

// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, filePath) => {
      const type = mime.getType(filePath);
      if (type) res.setHeader("Content-Type", type);
    },
  }),
);

app.use("/api/users", userRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/files", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings/customer", customerBookingRoutes);
import myBookingRoutes from "./routes/booking/my.route";
app.use("/api/bookings/my", myBookingRoutes);
app.use("/api/bookings/host", hostBookingRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationApiRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/moderation", moderationRoutes);

app.get("/", (_req, res) => res.send("API is running..."));

if (!admin.apps.length) {
  ensureFirebaseAdminInitialized();
}
export { server };
export default app;
