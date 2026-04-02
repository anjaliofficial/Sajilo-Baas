import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();
const authController = new AuthController();

// Google OAuth endpoint
router.post("/google/login", authController.googleLogin.bind(authController));

export default router;
