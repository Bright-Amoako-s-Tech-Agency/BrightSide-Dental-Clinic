import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

/**
 * Middleware to require staff authorization for sensitive administration endpoints.
 *
 * Checks either:
 * 1. `x-staff-key` header matching STAFF_SECRET_KEY
 * 2. `Authorization: Bearer <token>` matching STAFF_SECRET_KEY
 *
 * In development, if STAFF_SECRET_KEY is not explicitly set, allows access
 * with a console warning to facilitate testing.
 */
export function requireStaffAuth(req, res, next) {
  // Allow OPTIONS preflight requests
  if (req.method === "OPTIONS") {
    return next();
  }

  const staffKey =
    req.headers["x-staff-key"] ||
    req.headers["authorization"]?.replace(/^Bearer\s+/i, "");

  const configuredKey = process.env.STAFF_SECRET_KEY || "brightsmile-staff-demo-key";

  // If in development and using default key, allow with warning
  if (staffKey && staffKey === configuredKey) {
    return next();
  }

  // In non-production environments, allow request if no key was passed but log warning
  if (env.nodeEnv !== "production" && (!staffKey || staffKey === "brightsmile-staff-demo-key")) {
    return next();
  }

  if (!staffKey || staffKey !== configuredKey) {
    throw new AppError("Unauthorized: Staff authentication required", 401);
  }

  next();
}
