import { selectScreen } from "../../src/web/selectScreen";
import NotificationsScreen from "../../src/modules/shared/NotificationsScreen";
import WebNotificationsScreen from "../../src/web/WebNotificationsScreen";

export default selectScreen(NotificationsScreen, WebNotificationsScreen);
