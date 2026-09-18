import { selectScreen } from "../src/web/selectScreen";
import SplashScreen from "../src/modules/shared/SplashScreen";
import WebSplashScreen from "../src/web/WebSplashScreen";

export default selectScreen(SplashScreen, WebSplashScreen);
