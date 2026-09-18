import { selectScreen } from "../src/web/selectScreen";
import PeopleDirectoryScreen from "../src/modules/shared/PeopleDirectoryScreen";
import WebPeopleDirectoryScreen from "../src/web/WebPeopleDirectoryScreen";

export default selectScreen(PeopleDirectoryScreen, WebPeopleDirectoryScreen);
