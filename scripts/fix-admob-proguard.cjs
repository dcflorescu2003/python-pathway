const fs = require("fs");
const path = require("path");

const admobGradlePath = path.join(
  __dirname,
  "..",
  "node_modules",
  "@capacitor-community",
  "admob",
  "android",
  "build.gradle",
);

if (!fs.existsSync(admobGradlePath)) {
  console.log("[fix-admob-proguard] AdMob build.gradle not found, skipping.");
  process.exit(0);
}

const original = fs.readFileSync(admobGradlePath, "utf8");
const updated = original.replace(
  /getDefaultProguardFile\('proguard-android\.txt'\)/g,
  "getDefaultProguardFile('proguard-android-optimize.txt')",
);

if (original === updated) {
  console.log("[fix-admob-proguard] No deprecated ProGuard reference found.");
  process.exit(0);
}

fs.writeFileSync(admobGradlePath, updated, "utf8");
console.log("[fix-admob-proguard] Replaced deprecated proguard-android.txt reference.");
