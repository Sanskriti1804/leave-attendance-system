-- Enforce stored document size is greater than zero (BR-06 / schema.md byte_size > 0).
ALTER TABLE "LeaveDocument" ADD CONSTRAINT "LeaveDocument_fileSize_positive" CHECK ("fileSize" > 0);

CREATE INDEX "LeaveDocument_leaveId_idx" ON "LeaveDocument"("leaveId");
