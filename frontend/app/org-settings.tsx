import { selectScreen } from "../src/web/selectScreen";
import OrganisationSettingsScreen from "../src/modules/shared/OrganisationSettingsScreen";
import WebOrganisationSettingsScreen from "../src/web/WebOrganisationSettingsScreen";

export default selectScreen(OrganisationSettingsScreen, WebOrganisationSettingsScreen);
