/*
  Warnings:

  - Added the required column `updatedAt` to the `LeaveApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentType` to the `LeaveDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSize` to the `LeaveDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "sex" VARCHAR(10);

-- AlterTable
ALTER TABLE "LeaveApplication" ADD COLUMN     "managerApprovalStatus" VARCHAR(30),
ADD COLUMN     "managerComments" TEXT,
ADD COLUMN     "managerReviewedAt" TIMESTAMP(3),
ADD COLUMN     "reportingManagerEmployeeId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "LeaveDocument" ADD COLUMN     "contentType" VARCHAR(100) NOT NULL,
ADD COLUMN     "fileSize" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "LeaveType" ADD COLUMN     "allowedSex" VARCHAR(10);

-- CreateTable
CREATE TABLE "LeaveDateSelection" (
    "selectionId" SERIAL NOT NULL,
    "leaveId" INTEGER NOT NULL,
    "leaveDate" DATE NOT NULL,
    "session" VARCHAR(30) NOT NULL,
    "unit" DECIMAL(3,1) NOT NULL,

    CONSTRAINT "LeaveDateSelection_pkey" PRIMARY KEY ("selectionId")
);

-- CreateTable
CREATE TABLE "LeaveStatusHistory" (
    "historyId" SERIAL NOT NULL,
    "leaveId" INTEGER NOT NULL,
    "changedById" INTEGER,
    "oldStatus" VARCHAR(30),
    "newStatus" VARCHAR(30) NOT NULL,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveStatusHistory_pkey" PRIMARY KEY ("historyId")
);

-- CreateIndex
CREATE INDEX "LeaveDateSelection_leaveDate_idx" ON "LeaveDateSelection"("leaveDate");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveDateSelection_leaveId_leaveDate_key" ON "LeaveDateSelection"("leaveId", "leaveDate");

-- CreateIndex
CREATE INDEX "LeaveStatusHistory_leaveId_idx" ON "LeaveStatusHistory"("leaveId");

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_reportingManagerEmployeeId_fkey" FOREIGN KEY ("reportingManagerEmployeeId") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveDateSelection" ADD CONSTRAINT "LeaveDateSelection_leaveId_fkey" FOREIGN KEY ("leaveId") REFERENCES "LeaveApplication"("leaveId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveStatusHistory" ADD CONSTRAINT "LeaveStatusHistory_leaveId_fkey" FOREIGN KEY ("leaveId") REFERENCES "LeaveApplication"("leaveId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveStatusHistory" ADD CONSTRAINT "LeaveStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;
