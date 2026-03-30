import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  refresh,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  loginLimiter,
  refreshLimiter,
  registerLimiter,
} from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", registerLimiter, register);

router.post("/login", loginLimiter, login);

router.post("/refresh", refreshLimiter, refresh);

router.post("/logout", logout);

router.get("/me", authMiddleware, getMe);

export default router;
