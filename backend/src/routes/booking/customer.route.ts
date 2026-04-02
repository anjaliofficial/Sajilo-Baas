import express from "express";
import { CustomerBookingController } from "../../controllers/booking/customer.controller";
import {
  authorizedMiddleware,
  roleMiddleware,
} from "../../middlewares/auth.middleware";

const router = express.Router();
const controller = new CustomerBookingController();

// Customer protected routes
router.use(authorizedMiddleware, roleMiddleware(["customer"]));

// Booking CRUD
router.post("/", controller.createBooking.bind(controller));
router.get("/my", controller.getMyBookings.bind(controller));
router.get("/:id", controller.getBookingById.bind(controller));
router.put("/:id/cancel", controller.cancelBooking.bind(controller));
router.get("/availability", controller.checkAvailability.bind(controller));

// Favorite (Save/Unsave) and fetch saved bookings
router.post("/:id/save", controller.toggleSaveBooking.bind(controller));
router.get("/saved/all", controller.getSavedBookings.bind(controller));

export default router;
