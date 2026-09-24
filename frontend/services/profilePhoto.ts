import { Platform } from "react-native";

const STORAGE_KEY = "lams-profile-photos";
const listeners = new Set<() => void>();
let cache: Record<string, string> = {};
let loaded = false;

function notify() {
  listeners.forEach((listener) => listener());
}

async function readStore(): Promise<Record<string, string>> {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    }
    const FileSystem = require("expo-file-system") as {
      documentDirectory?: string | null;
      readAsStringAsync?: (uri: string) => Promise<string>;
    };
    const dir = FileSystem.documentDirectory;
    if (!dir || !FileSystem.readAsStringAsync) {
      return {};
    }
    const raw = await FileSystem.readAsStringAsync(`${dir}profile-photos.json`);
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeStore(next: Record<string, string>): Promise<void> {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return;
    }
    const FileSystem = require("expo-file-system") as {
      documentDirectory?: string | null;
      writeAsStringAsync?: (uri: string, contents: string) => Promise<void>;
    };
    const dir = FileSystem.documentDirectory;
    if (!dir || !FileSystem.writeAsStringAsync) {
      return;
    }
    await FileSystem.writeAsStringAsync(`${dir}profile-photos.json`, JSON.stringify(next));
  } catch {
    // Local photo cache is best-effort; profile still falls back to initials.
  }
}

export async function hydrateProfilePhotos(): Promise<void> {
  if (loaded) {
    return;
  }
  cache = await readStore();
  loaded = true;
  notify();
}

export function subscribeProfilePhotos(listener: () => void): () => void {
  listeners.add(listener);
  void hydrateProfilePhotos();
  return () => {
    listeners.delete(listener);
  };
}

export function getProfilePhotoUri(employeeId: number | null | undefined): string | null {
  if (employeeId == null) {
    return null;
  }
  return cache[String(employeeId)] ?? null;
}

export async function setProfilePhotoUri(employeeId: number, uri: string): Promise<void> {
  cache = { ...cache, [String(employeeId)]: uri };
  notify();
  await writeStore(cache);
}

export async function pickAndSaveProfilePhoto(employeeId: number): Promise<string | null> {
  const DocumentPicker = require("expo-document-picker") as typeof import("expo-document-picker");
  const result = await DocumentPicker.getDocumentAsync({
    type: ["image/jpeg", "image/png", "image/jpg"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }
  const uri = await persistablePhotoUri(result.assets[0].uri);
  await setProfilePhotoUri(employeeId, uri);
  return uri;
}

async function persistablePhotoUri(uri: string): Promise<string> {
  if (Platform.OS !== "web" || uri.startsWith("data:")) {
    return uri;
  }
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return uri;
  }
}
