import * as DocumentPicker from "expo-document-picker";

const photosByEmployee: Record<string, string> = {};

export function getLocalProfilePhotoUri(employeeId: number | string | undefined | null): string | null {
  if (employeeId == null) {
    return null;
  }
  return photosByEmployee[String(employeeId)] ?? null;
}

export async function pickLocalProfilePhoto(
  employeeId: number | string,
): Promise<"ok" | "cancel" | "error"> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png", "image/jpg"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]?.uri) {
      return "cancel";
    }
    photosByEmployee[String(employeeId)] = result.assets[0].uri;
    return "ok";
  } catch {
    return "error";
  }
}

export function roleTagsFor(role: string | undefined | null): string[] {
  const tags: string[] = [];
  if (role === "employee" || role === "admin") {
    tags.push("Employee");
  }
  if (role === "admin") {
    tags.push("Admin");
    tags.push("Reporting Manager");
  }
  if (role === "guest_admin") {
    tags.push("Guest Admin");
  }
  if (!role) {
    tags.push("Employee");
  }
  return tags;
}
