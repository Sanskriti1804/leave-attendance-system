import { selectScreen } from "../src/web/selectScreen";
import AttendanceCorrectionsScreen from "../src/modules/attendance-management/AttendanceCorrectionsScreen";
import WebAttendanceCorrectionsScreen from "../src/web/WebAttendanceCorrectionsScreen";

export default selectScreen(AttendanceCorrectionsScreen, WebAttendanceCorrectionsScreen);
