import { selectScreen } from "../../src/web/selectScreen";
import MyLeaveListScreen from "../../src/modules/leave-management/MyLeaveListScreen";
import WebLeaveListScreen from "../../src/web/WebLeaveListScreen";

export default selectScreen(MyLeaveListScreen, WebLeaveListScreen);
