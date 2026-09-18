import { selectScreen } from "../src/web/selectScreen";
import LoginScreen from "../src/modules/shared/LoginScreen";
import WebLoginScreen from "../src/web/WebLoginScreen";

export default selectScreen(LoginScreen, WebLoginScreen);
