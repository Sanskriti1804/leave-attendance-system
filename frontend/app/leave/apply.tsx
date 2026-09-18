import { selectScreen } from "../../src/web/selectScreen";
import ApplyLeaveScreen from "../../src/modules/leave-management/ApplyLeaveScreen";
import WebApplyLeaveScreen from "../../src/web/WebApplyLeaveScreen";

export default selectScreen(ApplyLeaveScreen, WebApplyLeaveScreen);
