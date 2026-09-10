-- Constrain sex / allowedSex to the signed value set (nullable = unrestricted / unknown).
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_sex_check"
  CHECK ("sex" IS NULL OR "sex" IN ('male', 'female', 'unspecified'));

ALTER TABLE "LeaveType" ADD CONSTRAINT "LeaveType_allowedSex_check"
  CHECK ("allowedSex" IS NULL OR "allowedSex" IN ('male', 'female', 'unspecified'));
