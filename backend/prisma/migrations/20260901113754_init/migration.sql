-- CreateTable
CREATE TABLE "Department" (
    "departmentId" SERIAL NOT NULL,
    "departmentName" VARCHAR(50) NOT NULL,
    "obsolete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("departmentId")
);

-- CreateTable
CREATE TABLE "Employee" (
    "employeeId" SERIAL NOT NULL,
    "firstName" VARCHAR(25) NOT NULL,
    "lastName" VARCHAR(25),
    "email" VARCHAR(100) NOT NULL,
    "passwordHash" VARCHAR(100) NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "managerId" INTEGER,
    "joiningDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "obsolete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("employeeId")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "attendanceId" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" VARCHAR(30) NOT NULL,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("attendanceId")
);

-- CreateTable
CREATE TABLE "AttendanceCorrection" (
    "correctionId" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "attendanceId" INTEGER NOT NULL,
    "correctionDate" DATE NOT NULL,
    "correctionType" VARCHAR(50) NOT NULL,
    "correctLoginTime" TIMESTAMP(3),
    "correctLogoutTime" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "supportingDocument" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "reviewedBy" INTEGER,
    "hrComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "AttendanceCorrection_pkey" PRIMARY KEY ("correctionId")
);

-- CreateTable
CREATE TABLE "LeaveType" (
    "leaveTypeId" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "requiresMedicalDocument" BOOLEAN NOT NULL DEFAULT false,
    "obsolete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("leaveTypeId")
);

-- CreateTable
CREATE TABLE "LeavePolicy" (
    "policyId" SERIAL NOT NULL,
    "leaveTypeId" INTEGER NOT NULL,
    "medicalDocumentAfterDays" INTEGER,
    "includeWeekends" BOOLEAN NOT NULL DEFAULT false,
    "includeHolidays" BOOLEAN NOT NULL DEFAULT false,
    "maxDays" DECIMAL(5,2),
    "obsolete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("policyId")
);

-- CreateTable
CREATE TABLE "LeaveApplication" (
    "leaveId" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "leaveTypeId" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "durationType" VARCHAR(30) NOT NULL,
    "halfDayType" VARCHAR(30),
    "numberOfDays" DECIMAL(5,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    "hrComments" TEXT,
    "reviewedBy" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveApplication_pkey" PRIMARY KEY ("leaveId")
);

-- CreateTable
CREATE TABLE "LeaveDocument" (
    "documentId" SERIAL NOT NULL,
    "leaveId" INTEGER NOT NULL,
    "fileName" VARCHAR(50) NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" VARCHAR(10) NOT NULL,
    "uploadedBy" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveDocument_pkey" PRIMARY KEY ("documentId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notificationId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "message" VARCHAR(100) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notificationId")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "auditId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" INTEGER,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("auditId")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "holidayId" SERIAL NOT NULL,
    "holidayName" VARCHAR(100) NOT NULL,
    "holidayDate" DATE NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("holidayId")
);

-- CreateTable
CREATE TABLE "ConfigurationSetting" (
    "settingId" SERIAL NOT NULL,
    "settingCategory" VARCHAR(50) NOT NULL,
    "settingKey" VARCHAR(100) NOT NULL,
    "settingValue" VARCHAR(100) NOT NULL,
    "settingType" VARCHAR(20) NOT NULL,

    CONSTRAINT "ConfigurationSetting_pkey" PRIMARY KEY ("settingId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Attendance_employeeId_idx" ON "Attendance"("employeeId");

-- CreateIndex
CREATE INDEX "Attendance_attendanceDate_idx" ON "Attendance"("attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_employeeId_attendanceDate_key" ON "Attendance"("employeeId", "attendanceDate");

-- CreateIndex
CREATE INDEX "LeaveApplication_employeeId_idx" ON "LeaveApplication"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveApplication_status_idx" ON "LeaveApplication"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_holidayDate_key" ON "Holiday"("holidayDate");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigurationSetting_settingCategory_settingKey_key" ON "ConfigurationSetting"("settingCategory", "settingKey");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCorrection" ADD CONSTRAINT "AttendanceCorrection_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCorrection" ADD CONSTRAINT "AttendanceCorrection_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("attendanceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCorrection" ADD CONSTRAINT "AttendanceCorrection_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePolicy" ADD CONSTRAINT "LeavePolicy_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("leaveTypeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("leaveTypeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveDocument" ADD CONSTRAINT "LeaveDocument_leaveId_fkey" FOREIGN KEY ("leaveId") REFERENCES "LeaveApplication"("leaveId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveDocument" ADD CONSTRAINT "LeaveDocument_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "Employee"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Employee"("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Employee"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;
