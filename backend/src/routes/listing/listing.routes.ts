// routes/listing.routes.ts
import { Router, RequestHandler } from "express";
import { authorizedMiddleware } from "../../middlewares/auth.middleware";
import upload from "../../middlewares/upload";
import {
  createListing,
  getListingById,
  getListings,
  getLocationSuggestions,
  getMyListings,
  updateListing,
  deleteListing,
} from "../../controllers/host/listing.controller";

const router = Router();

router.get("/location-suggest", getLocationSuggestions as RequestHandler);
router.get("/", getListings as RequestHandler);

router.post(
  "/",
  authorizedMiddleware,
  upload.array("images", 5),
  createListing as RequestHandler,
);
router.get("/my", authorizedMiddleware, getMyListings as RequestHandler);
router.put("/:id", authorizedMiddleware, updateListing as RequestHandler);
router.delete("/:id", authorizedMiddleware, deleteListing as RequestHandler);
router.get("/:id", getListingById as RequestHandler);

export default router;
