-- `unspecified` is 11 characters; VARCHAR(10) cannot store the signed sex values.
ALTER TABLE "Employee" ALTER COLUMN "sex" TYPE VARCHAR(20);
ALTER TABLE "LeaveType" ALTER COLUMN "allowedSex" TYPE VARCHAR(20);
