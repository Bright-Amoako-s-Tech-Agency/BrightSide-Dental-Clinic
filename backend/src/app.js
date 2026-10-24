import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import appointmentRoutes from "./modules/appointments/appointment.routes.js";
import availabilityRoutes from "./modules/availability/availability.routes.js";
import clinicianRoutes from "./modules/clinicians/clinician.routes.js";
import patientRoutes from "./modules/patients/patient.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import treatmentRoutes from "./modules/treatments/treatment.routes.js";

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Capture raw body for Paystack HMAC-SHA512 webhook signature verification
app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

// Rate limiting: general API limiter (100 requests per minute per IP)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.nodeEnv === "development" ? 1000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many requests from this IP, please try again in a minute.",
    },
  },
});

// Specific strict rate limiter for booking and payment initialization (20 per 10 mins)
const bookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: env.nodeEnv === "development" ? 200 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many appointment or payment attempts. Please wait a few minutes.",
    },
  },
});

app.use("/api/", apiLimiter);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BrightSmile API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/treatments", treatmentRoutes);
app.use("/api/clinicians", clinicianRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", bookingLimiter, appointmentRoutes);
app.use("/api/payments", paymentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
