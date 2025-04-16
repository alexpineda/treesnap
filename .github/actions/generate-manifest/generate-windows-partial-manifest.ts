import fs from "fs";
import path from "path";

const version = process.argv[2];
if (!version) throw new Error("Pass version as first arg");

const distDir = path.normalize("src-tauri/target/release/bundle/msi");
const artifactName = `RepoSnap_${version}_x64_en-US.msi`;
const sigName = `${artifactName}.sig`;

const urlBase = `https://releases.reposnap.io/releases/${version}`;
const artifactUrl = `${urlBase}/${artifactName}`;
const sigPath = path.join(distDir, sigName);

if (!fs.existsSync(sigPath)) {
  throw new Error(`Missing signature file: ${sigPath}`);
}

const signature = fs.readFileSync(sigPath, "utf-8").trim();

const manifest = {
  "windows-x86_64": {
    file: artifactName,
    url: artifactUrl,
    signature,
  },
};

const outPath = "partial-manifest-windows.json";
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));

console.log(`✅ Wrote ${outPath}`);
