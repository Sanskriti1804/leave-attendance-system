import { RoleStubScreen } from "../../src/modules/shared/RoleStubScreen";

export default function AttendanceRoute() {
  return (
    <RoleStubScreen
      variant="employee"
      activeRoute="attendance"
      title="Attendance"
      icon="fingerprint"
      body="Daily punch APIs are not implemented. Check-in and check-out remain on Home as in the approved Stitch employee design."
    />
  );
}
