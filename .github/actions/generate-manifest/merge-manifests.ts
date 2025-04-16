import fs from "fs";
import path from "path";

const version = process.argv[2]; // passed as CLI arg like "0.1.0"

const files = fs
  .readdirSync("manifests")
  .filter((f) => f.startsWith("partial-manifest-"));
const output = {
  version,
  pub_date: new Date().toISOString(),
  platforms: {},
};

for (const file of files) {
  const data = JSON.parse(
    fs.readFileSync(path.join("manifests", file), "utf-8")
  );
  Object.assign(output.platforms, data);
}

fs.writeFileSync("manifests/latest.json", JSON.stringify(output, null, 2));
