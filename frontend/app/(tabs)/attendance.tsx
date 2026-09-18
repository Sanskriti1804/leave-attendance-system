import { selectScreen } from "../../src/web/selectScreen";
import MyAttendanceScreen from "../../src/modules/attendance-management/MyAttendanceScreen";
import WebAttendanceScreen from "../../src/web/WebAttendanceScreen";

export default selectScreen(MyAttendanceScreen, WebAttendanceScreen);
