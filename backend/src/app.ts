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
import leaveApplicationRouter from "./modules/leave-management/leave-applications/route.js";
import leaveDocumentRouter from "./modules/leave-management/leave-documents/route.js";
import leavePolicyRouter from "./modules/leave-management/leave-policies/route.js";
import leaveTypeRouter from "./modules/leave-management/leave-types/route.js";
import attendanceRouter from "./modules/attendance-management/attendance/route.js";
import attendanceCorrectionRouter from "./modules/attendance-management/attendance-corrections/route.js";
import notificationRouter from "./modules/shared/notifications/route.js";
import auditLogRouter from "./modules/shared/audit-logs/route.js";
import reportRouter from "./modules/shared/reports/route.js";
import healthRouter from "./modules/shared/health/route.js";
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
  app.use("/api/v1/leaves", leaveApplicationRouter);
  app.use("/api/v1/documents", leaveDocumentRouter);
  app.use("/api/v1/leave-policies", leavePolicyRouter);
  app.use("/api/v1/leave-types", leaveTypeRouter);
  app.use("/api/v1/attendance", attendanceRouter);
  app.use("/api/v1/attendance/corrections", attendanceCorrectionRouter);
  app.use("/api/v1/notifications", notificationRouter);
  app.use("/api/v1/audit", auditLogRouter);
  app.use("/api/v1/reports", reportRouter);
  app.use("/health", healthRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
}
