import { RoleStubScreen } from "../src/modules/shared/RoleStubScreen";

export default function ReportsRoute() {
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
