import express from "express";
import cookieParser from "cookie-parser";
import userRoutes from "../../src/routes/user.routes";
import listingRoutes from "../../src/routes/listing/listing.routes";

export const buildTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", userRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/listings", listingRoutes);

  return app;
};

export default buildTestApp;
