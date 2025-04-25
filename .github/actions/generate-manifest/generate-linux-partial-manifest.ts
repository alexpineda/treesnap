import fs from "fs";
import path from "path";

const version = process.argv[2];
if (!version) throw new Error("Pass version as first arg");

const distDir = `src-tauri/target/release/bundle/appimage`;
const artifactName = `TreeSnap_${version}_amd64.AppImage`;
const sigName = `${artifactName}.sig`;

const urlBase = `https://releases.treesnap.app/releases/${version}`;
const artifactUrl = `${urlBase}/${artifactName}`;
const sigPath = path.join(distDir, sigName);

if (!fs.existsSync(sigPath)) {
  throw new Error(`Missing signature file: ${sigPath}`);
}

const signature = fs.readFileSync(sigPath, "utf-8").trim();

const manifest = {
  "linux-x86_64": {
    file: artifactName,
    url: artifactUrl,
    signature,
  },
};

const outPath = "partial-manifest-linux.json";
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));

console.log(`✅ Wrote ${outPath}`);
