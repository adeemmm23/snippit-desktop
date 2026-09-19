import { execSync } from "child_process";
import fs from "fs";

const type = process.argv[2] || "patch";
const message = process.argv.slice(3).join(" ") || `Release ${type}`;

try {
  const pkgPath = "./package.json";
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

  let [major, minor, patch] = pkg.version.split(".").map(Number);

  if (type === "major") {
    major++;
    minor = 0;
    patch = 0;
  } else if (type === "minor") {
    minor++;
    patch = 0;
  } else {
    patch++;
  }

  const newVersion = `${major}.${minor}.${patch}`;
  pkg.version = newVersion;

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`Updated to v${newVersion}`);

  execSync(`git add ${pkgPath}`, { stdio: "inherit" });

  execSync(`git commit -m "${message}"`, { stdio: "inherit" });

  execSync(`git tag v${newVersion}`, { stdio: "inherit" });
} catch (error) {
  console.error("\n❌ Release failed. Check the errors above.");
  process.exit(1);
}
