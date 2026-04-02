import express from "express";
import { HostBookingController } from "../../controllers/booking/host.controller";
import {
  authorizedMiddleware,
  roleMiddleware,
} from "../../middlewares/auth.middleware";

const router = express.Router();
const controller = new HostBookingController();

// Host protected routes
router.use(authorizedMiddleware, roleMiddleware(["host"]));

router.get("/", controller.getHostBookings.bind(controller));
router.put("/:id/accept", controller.acceptBooking.bind(controller));
router.put("/:id/reject", controller.rejectBooking.bind(controller));
router.post("/", (req, res) => controller.createBooking(req, res));
router.get("/dashboard", (req, res) => controller.getDashboardStats(req, res));

export default router;
