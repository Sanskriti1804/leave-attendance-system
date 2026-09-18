import { selectScreen } from "../../src/web/selectScreen";
import AdminLeaveReviewQueueScreen from "../../src/modules/leave-management/AdminLeaveReviewQueueScreen";
import WebAdminReviewScreen from "../../src/web/WebAdminReviewScreen";

export default selectScreen(AdminLeaveReviewQueueScreen, WebAdminReviewScreen);
