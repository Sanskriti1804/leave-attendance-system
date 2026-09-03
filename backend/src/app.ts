import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { logger } from "./logger.js";
import authRouter from "./modules/shared/auth/route.js";
import departmentRouter from "./modules/shared/departments/route.js";
import employeeRouter from "./modules/shared/employees/route.js";
import holidayRouter from "./modules/shared/holidays/route.js";
import organisationSettingsRouter from "./modules/shared/organisation-settings/route.js";
import { errorMiddleware, notFoundMiddleware } from "./modules/shared/middlewares/error.middleware.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(pinoHttp({ logger }));

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/departments", departmentRouter);
  app.use("/api/v1/employees", employeeRouter);
  app.use("/api/v1/holidays", holidayRouter);
  app.use("/api/v1/org-settings", organisationSettingsRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
}
