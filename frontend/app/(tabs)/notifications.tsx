import { RoleStubScreen } from "../../src/modules/shared/RoleStubScreen";

export default function NotificationsRoute() {
  return (
    <RoleStubScreen
      variant="employee"
      activeRoute="notifications"
      title="Alerts"
      icon="notifications"
      body="Notification APIs are not implemented. This tab is registered so employee navigation matches the Stitch destinations."
    />
  );
}
