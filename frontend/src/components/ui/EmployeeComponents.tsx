import React from "react";
import { RoleBottomNav, type EmployeeNavId } from "./AppChrome";

export function EmployeeBottomNavBar({ activeRoute }: { activeRoute: EmployeeNavId }) {
  return <RoleBottomNav variant="employee" activeRoute={activeRoute} />;
}
