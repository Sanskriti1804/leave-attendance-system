import React from "react";
import { Platform } from "react-native";

export function selectScreen(mobile: React.ComponentType, web: React.ComponentType): React.ComponentType {
  return Platform.OS === "web" ? web : mobile;
}
