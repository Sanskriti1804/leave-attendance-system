#!/usr/bin/env node
/**
 * MaxStarter design apply (generated project runner)
 * Reads public/design.md and updates MaxStarter-owned files only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function fail(message, hint) {
  console.error("\n❌ " + message);
  if (hint) console.error("\n" + hint);
  console.error("");
  process.exit(1);
}

function parseBoolean(value) {
  const v = String(value).trim().toLowerCase();
  if (["true", "yes", "1", "on"].includes(v)) return true;
  if (["false", "no", "0", "off"].includes(v)) return false;
  fail('Expected a boolean value, got "' + value + '".');
}

function isHexColor(value) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(String(value).trim());
}

function extractSections(content) {
  const lines = content.split(/\r?\n/);
  const sections = {};
  let current = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("# ") || line === "---") continue;
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      current = heading[1].trim();
      sections[current] = sections[current] || {};
      continue;
    }
    if (!current) continue;
    const kv = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.+)$/);
    if (kv) {
      let value = kv[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      sections[current][kv[1]] = value;
    }
  }
  return sections;
}

function requireSection(sections, name) {
  if (!sections[name]) fail('Missing required section "## ' + name + '" in public/design.md.');
  return sections[name];
}

function requireString(section, key) {
  const value = section[key];
  if (value === undefined || !String(value).trim()) fail('Missing required field "' + key + '" in design.md.');
  return String(value).trim();
}

function optionalString(section, key, fallback) {
  const value = section[key];
  return value === undefined || !String(value).trim() ? fallback : String(value).trim();
}

function requireColor(section, key) {
  const value = requireString(section, key);
  if (!isHexColor(value)) fail('Invalid color for "' + key + '": "' + value + '". Use #RGB or #RRGGBB.');
  return value;
}

function optionalColor(section, key, fallback) {
  if (section[key] === undefined) return fallback;
  return requireColor(section, key);
}

function parseDesign(content) {
  if (!content.trim()) fail("public/design.md is empty.", "Add design configuration sections as documented in the README.");
  const sections = extractSections(content);
  const app = requireSection(sections, "App");
  const colors = requireSection(sections, "Colors");
  const typography = requireSection(sections, "Typography");
  const login = requireSection(sections, "Login");
  const home = requireSection(sections, "Home");
  const navigation = requireSection(sections, "Navigation");
  const splash = sections["Splash"] || {};

  const durationMs = splash.durationMs !== undefined ? Number(splash.durationMs) : 1800;
  if (!Number.isFinite(durationMs) || durationMs < 0 || durationMs > 30000) {
    fail("splash.durationMs must be between 0 and 30000.");
  }

  return {
    app: { name: requireString(app, "name") },
    colors: {
      primary: requireColor(colors, "primary"),
      secondary: optionalColor(colors, "secondary", "#FFFFFF"),
      background: requireColor(colors, "background"),
      text: requireColor(colors, "text"),
      muted: optionalColor(colors, "muted", "#6B7280"),
      error: optionalColor(colors, "error", "#DC2626"),
      border: optionalColor(colors, "border", "#E5E7EB"),
    },
    typography: {
      headingFont: optionalString(typography, "headingFont", "System"),
      bodyFont: optionalString(typography, "bodyFont", "System"),
    },
    login: {
      enabled: parseBoolean(requireString(login, "enabled")),
      title: optionalString(login, "title", "Welcome Back"),
      subtitle: optionalString(login, "subtitle", "Login to continue"),
    },
    home: {
      enabled: parseBoolean(requireString(home, "enabled")),
      title: optionalString(home, "title", "Welcome"),
      subtitle: optionalString(home, "subtitle", "Your app is ready."),
    },
    navigation: {
      enabled: parseBoolean(requireString(navigation, "enabled")),
    },
    splash: { durationMs },
  };
}

function replaceOwnedSection(source, id, nextBody) {
  const begin = "// MAXSTARTER:BEGIN " + id;
  const end = "// MAXSTARTER:END " + id;
  const startIdx = source.indexOf(begin);
  const endIdx = source.indexOf(end);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    return null;
  }
  return source.slice(0, startIdx) + begin + "\n" + nextBody + "\n" + end + source.slice(endIdx + end.length);
}

function write(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}

function step(ok, label) {
  console.log((ok ? "✔" : "⚠") + " " + label);
}

console.log("");
console.log("🚀 Applying MaxStarter design...");
console.log("");

const designPath = path.join(root, "public", "design.md");
const logoSvgPath = path.join(root, "public", "logo.svg");
const logoPngPath = path.join(root, "public", "logo.png");
const configPath = path.join(root, "maxstarter", "config.json");

function resolveLogo() {
  if (fs.existsSync(logoSvgPath)) {
    return { format: "svg", fileName: "logo.svg", absolutePath: logoSvgPath };
  }
  if (fs.existsSync(logoPngPath)) {
    return { format: "png", fileName: "logo.png", absolutePath: logoPngPath };
  }
  return null;
}

if (!fs.existsSync(designPath)) {
  fail('Missing "public/design.md".', "Create public/design.md using the MaxStarter template, then re-run apply.");
}

const raw = fs.readFileSync(designPath, "utf8");
step(true, "Reading public/design.md");

let design;
try {
  design = parseDesign(raw);
} catch (error) {
  fail(error.message || "Invalid design.md");
}
step(true, "Validating configuration");

if (!fs.existsSync(configPath)) {
  fail('Missing "maxstarter/config.json".', "This does not look like a MaxStarter-generated project.");
}

const themeDir = path.join(root, "src", "maxstarter", "theme");
write(path.join(themeDir, "colors.ts"), `/**
 * MaxStarter-owned theme colors.
 * Generated by \`npm run apply-maxstarter\`. Do not edit by hand —
 * change public/design.md instead.
 */
export const colors = {
  primary: "${design.colors.primary}",
  secondary: "${design.colors.secondary}",
  background: "${design.colors.background}",
  text: "${design.colors.text}",
  muted: "${design.colors.muted}",
  error: "${design.colors.error}",
  border: "${design.colors.border}",
} as const;

export type ColorToken = keyof typeof colors;
`);

write(path.join(themeDir, "typography.ts"), `/**
 * MaxStarter-owned typography tokens.
 * Generated by \`npm run apply-maxstarter\`.
 */
export const typography = {
  headingFont: "${design.typography.headingFont}",
  bodyFont: "${design.typography.bodyFont}",
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 34,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    bold: "700" as const,
  },
} as const;
`);

write(path.join(themeDir, "spacing.ts"), `/**
 * MaxStarter-owned spacing scale.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
`);

write(path.join(themeDir, "index.ts"), `import { colors } from "./colors";
import { spacing } from "./spacing";
import { typography } from "./typography";

export { colors, spacing, typography };

export const theme = {
  colors,
  spacing,
  typography,
} as const;
`);

const logo = resolveLogo();

if (logo?.format === "svg") {
  const svgXml = fs.readFileSync(logo.absolutePath, "utf8");
  write(path.join(root, "src", "maxstarter", "assets.ts"), `/**
 * Centralized asset references.
 * Logo: public/logo.svg (or logo.png). Regenerated by apply-maxstarter.
 */
export const assets = {
  logoFormat: "svg" as const,
  appName: ${JSON.stringify(design.app.name)},
} as const;
`);
  write(path.join(root, "src", "maxstarter", "Logo.tsx"), `/**
 * MaxStarter logo. Uses public/logo.svg via react-native-svg.
 * Regenerated by apply-maxstarter — safe to overwrite.
 */
import { View, type StyleProp, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";

const logoSvg = ${JSON.stringify(svgXml)};

export function Logo({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <SvgXml xml={logoSvg} width="100%" height="100%" />
    </View>
  );
}
`);
} else {
  write(path.join(root, "src", "maxstarter", "assets.ts"), `/**
 * Centralized asset references.
 * Logo: public/logo.png (or logo.svg). Regenerated by apply-maxstarter.
 */
export const assets = {
  logoFormat: "png" as const,
  logo: require("../../public/logo.png"),
  appName: ${JSON.stringify(design.app.name)},
} as const;
`);
  write(path.join(root, "src", "maxstarter", "Logo.tsx"), `/**
 * MaxStarter logo. Uses public/logo.png via React Native Image.
 * Regenerated by apply-maxstarter — safe to overwrite.
 * Place public/logo.svg or public/logo.png, then run apply-maxstarter.
 */
import { Image, type ImageStyle, type StyleProp } from "react-native";
import { assets } from "./assets";

export function Logo({ style }: { style?: StyleProp<ImageStyle> }) {
  return <Image source={assets.logo} style={style} resizeMode="contain" />;
}
`);
}

write(path.join(root, "src", "maxstarter", "design.ts"), `/**
 * Runtime snapshot of design.md values used by MaxStarter-owned UI sections.
 * Regenerated by apply-maxstarter — safe to overwrite.
 */
export const designContent = {
  login: {
    title: ${JSON.stringify(design.login.title)},
    subtitle: ${JSON.stringify(design.login.subtitle)},
  },
  home: {
    title: ${JSON.stringify(design.home.title)},
    subtitle: ${JSON.stringify(design.home.subtitle)},
  },
  splash: {
    durationMs: ${design.splash.durationMs},
  },
} as const;
`);
step(true, "Updating theme");

const projectConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

function patchFile(relPath, id, body, label) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) return false;
  const source = fs.readFileSync(full, "utf8");
  const next = replaceOwnedSection(source, id, body);
  if (!next) return false;
  fs.writeFileSync(full, next, "utf8");
  step(true, label);
  return true;
}

if (projectConfig.login) {
  patchFile(
    "app/login.tsx",
    "login-copy",
    "  const loginTitle = designContent.login.title;\n  const loginSubtitle = designContent.login.subtitle;",
    "Updating Login Screen",
  );
}

if (projectConfig.home) {
  const homePatched =
    patchFile(
      "app/home.tsx",
      "home-copy",
      "  const homeTitle = designContent.home.title;\n  const homeSubtitle = designContent.home.subtitle;",
      "Updating Home Screen",
    ) ||
    patchFile(
      "app/(tabs)/index.tsx",
      "home-copy",
      "  const homeTitle = designContent.home.title;\n  const homeSubtitle = designContent.home.subtitle;",
      "Updating Home Screen",
    );
  void homePatched;
}

patchFile(
  "app/index.tsx",
  "splash-config",
  "  const splashDuration = designContent.splash.durationMs;",
  "Updating Splash Screen",
);

if (logo) {
  step(true, "Updating logo (" + logo.fileName + ")");
} else {
  step(false, "No logo found — place public/logo.svg or public/logo.png");
}

console.log("");
console.log("✨ MaxStarter design applied successfully!");
console.log("");
