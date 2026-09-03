import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../middlewares/rate-limit.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import * as authController from "./controller.js";
import {
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  refreshBodySchema,
  resetPasswordBodySchema,
} from "./validation.js";

const router = Router();

const loginRateLimiter = rateLimit({ max: 10, windowMs: 15 * 60 * 1000 });
const refreshRateLimiter = rateLimit({ max: 30, windowMs: 15 * 60 * 1000 });
const passwordResetRateLimiter = rateLimit({ max: 5, windowMs: 15 * 60 * 1000 });
const changePasswordRateLimiter = rateLimit({ max: 5, windowMs: 15 * 60 * 1000 });

router.post("/login", loginRateLimiter, validate({ body: loginBodySchema }), authController.login);
router.post(
  "/refresh",
  refreshRateLimiter,
  validate({ body: refreshBodySchema }),
  authController.refresh,
);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);
router.post(
  "/change-password",
  authenticate,
  changePasswordRateLimiter,
  validate({ body: changePasswordBodySchema }),
  authController.changePassword,
);
router.post(
  "/forgot-password",
  passwordResetRateLimiter,
  validate({ body: forgotPasswordBodySchema }),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  passwordResetRateLimiter,
  validate({ body: resetPasswordBodySchema }),
  authController.resetPassword,
);

export default router;
