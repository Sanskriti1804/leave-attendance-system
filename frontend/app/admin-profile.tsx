import { selectScreen } from "../src/web/selectScreen";
import AdminProfileScreen from "../src/modules/shared/AdminProfileScreen";
import WebAdminProfileScreen from "../src/web/WebAdminProfileScreen";

export default selectScreen(AdminProfileScreen, WebAdminProfileScreen);
