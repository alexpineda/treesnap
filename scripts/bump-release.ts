import fs from "fs";
import { execSync } from "child_process";

// Utility: bump semver string
function bumpPatch(v: string): string {
  const parts = v.split(".");
  parts[2] = `${parseInt(parts[2]) + 1}`;
  return parts.join(".");
}

// STEP 1: Load + bump version
const pkgPath = "package.json";
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const newVersion = bumpPatch(pkg.version);
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log(`📦 package.json -> ${newVersion}`);

// STEP 2: Sync Tauri config
const tauriPath = "src-tauri/tauri.conf.json";
const tauriConf = JSON.parse(fs.readFileSync(tauriPath, "utf-8"));

tauriConf.version = newVersion;
if (tauriConf.package?.version) {
  delete tauriConf.package.version;
}

fs.writeFileSync(tauriPath, JSON.stringify(tauriConf, null, 2));
console.log(`🦀 tauri.conf.json -> ${newVersion}`);

// add to staging for review
execSync(`git add package.json ${tauriPath}`, { stdio: "inherit" });
