import express from "express";
import { CustomerBookingController } from "../../controllers/booking/customer.controller";
import {
  authorizedMiddleware,
  roleMiddleware,
} from "../../middlewares/auth.middleware";

const router = express.Router();
const controller = new CustomerBookingController();

router.use(authorizedMiddleware, roleMiddleware(["customer"]));
router.get("/", controller.getMyBookings.bind(controller));

export default router;
