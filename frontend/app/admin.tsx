import { selectScreen } from "../src/web/selectScreen";
import AdminDashboardScreen from "../src/modules/shared/AdminDashboardScreen";
import WebAdminDashboardScreen from "../src/web/WebAdminDashboardScreen";

export default selectScreen(AdminDashboardScreen, WebAdminDashboardScreen);
