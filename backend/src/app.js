import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import treatmentRoutes from "./modules/treatments/treatment.routes.js";

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
  }),
);

app.use(helmet());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BrightSmile API is running",
  });
});

app.use("/api/treatments", treatmentRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
