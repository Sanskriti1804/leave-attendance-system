import { selectScreen } from "../../src/web/selectScreen";
import EmployeeHomeScreen from "../../src/modules/attendance-management/EmployeeHomeScreen";
import WebEmployeeHomeScreen from "../../src/web/WebEmployeeHomeScreen";

export default selectScreen(EmployeeHomeScreen, WebEmployeeHomeScreen);
