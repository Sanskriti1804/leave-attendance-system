import { RoleStubScreen } from "../../src/modules/shared/RoleStubScreen";
import { WebStubScreen } from "../../src/web/WebStubScreen";
import { selectScreen } from "../../src/web/selectScreen";

function MobileAttendance() {
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

function WebAttendance() {
  return (
    <WebStubScreen
      variant="employee"
      activeRoute="attendance"
      title="Attendance"
      icon="fingerprint"
      body="Daily punch APIs are not implemented. Check-in and check-out remain on Home as in the approved Stitch employee design."
    />
  );
}

export default selectScreen(MobileAttendance, WebAttendance);
