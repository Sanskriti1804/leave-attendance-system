import ReportsScreen from "../src/modules/shared/ReportsScreen";
import WebReportsScreen from "../src/web/WebReportsScreen";
import { selectScreen } from "../src/web/selectScreen";

export default selectScreen(ReportsScreen, WebReportsScreen);
