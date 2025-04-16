import fs from "fs";
import path from "path";

const version = process.argv[2]; // passed as CLI arg like "0.1.0"
if (!version) throw new Error("Pass version as first arg");

const distDir = `src-tauri/target/universal-apple-darwin/release/bundle/macos`;
const artifactName = `RepoSnap.app.tar.gz`;
const sigName = `${artifactName}.sig`;

const urlBase = `https://releases.reposnap.io/releases/${version}`;
const artifactUrl = `${urlBase}/${artifactName}`;
const sigPath = path.join(distDir, sigName);

const isDev = process.env.DEV === "true" || !fs.existsSync(sigPath);
const signature = isDev
  ? "dev-mode-placeholder"
  : fs.readFileSync(sigPath, "utf-8").trim();

const manifest = {
  "darwin-x86_64": {
    file: artifactName,
    url: artifactUrl,
    signature,
  },
  "darwin-aarch64": {
    file: artifactName,
    url: artifactUrl,
    signature,
  },
};

const outPath = `partial-manifest-macos.json`;
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));

console.log(`✅ Wrote ${outPath}`);
