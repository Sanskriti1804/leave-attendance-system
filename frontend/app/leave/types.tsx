import { selectScreen } from "../../src/web/selectScreen";
import LeaveTypesScreen from "../../src/modules/leave-management/LeaveTypesScreen";
import WebLeaveTypesScreen from "../../src/web/WebLeaveTypesScreen";

export default selectScreen(LeaveTypesScreen, WebLeaveTypesScreen);
