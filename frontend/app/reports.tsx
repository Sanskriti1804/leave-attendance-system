import { RoleStubScreen } from "../src/modules/shared/RoleStubScreen";
import { WebStubScreen } from "../src/web/WebStubScreen";
import { selectScreen } from "../src/web/selectScreen";

function MobileReports() {
  return (
    <RoleStubScreen
      variant="admin"
      activeRoute="reports"
      title="Reports"
      icon="query-stats"
      body="Leave and attendance report exports are not implemented on the server yet. Destinations and permissions are unchanged."
    />
  );
}

function WebReports() {
  return (
    <WebStubScreen
      variant="admin"
      activeRoute="reports"
      title="Reports"
      icon="query-stats"
      body="Leave and attendance report exports are not implemented on the server yet. Destinations and permissions are unchanged."
    />
  );
}

export default selectScreen(MobileReports, WebReports);
