import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

if (process.env.BUMP_IN_PROGRESS === "1") {
  process.exit(0);
}

let commitMsg = "";
try {
  commitMsg = execSync("git log -1 --pretty=%B", { encoding: "utf-8" })
    .trim()
    .split("\n")[0];
} catch (err) {
  console.error("[version] Error reading commit message:", err.message);
  process.exit(1);
}

function getBumpType(msg) {
  if (/^[a-z]+(\(.*\))?!:/.test(msg) || /BREAKING CHANGE/.test(msg)) {
    return "major";
  }
  if (/^feat(\(.*\))?:/.test(msg)) {
    return "minor";
  }
  if (/^(fix|refactor)(\(.*\))?:/.test(msg)) {
    return "patch";
  }
  return null;
}

const bumpType = getBumpType(commitMsg);

if (!bumpType) {
  process.exit(0);
}

const pkgPath = resolve(process.cwd(), "package.json");
if (!existsSync(pkgPath)) {
  console.error("[version] Error: package.json not found.");
  process.exit(1);
}

let rawPkgContent = "";
try {
  rawPkgContent = execSync("git show HEAD~1:package.json", {
    encoding: "utf-8",
  });
} catch (_) {
  rawPkgContent = readFileSync(pkgPath, "utf-8");
}

let baseVersion = "0.0.0";
try {
  const basePkg = JSON.parse(rawPkgContent);
  baseVersion = basePkg.version || "0.0.0";
} catch (err) {
  console.error("[version] Error parsing base package.json:", err.message);
  process.exit(1);
}

function bumpSemver(version, type) {
  let [major, minor, patch] = version.split(".").map(Number);

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    console.error(`[version] Invalid semver version: "${version}"`);
    process.exit(1);
  }

  switch (type) {
    case "major":
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case "minor":
      minor += 1;
      patch = 0;
      break;
    case "patch":
      patch += 1;
      break;
  }

  return `${major}.${minor}.${patch}`;
}

const newVersion = bumpSemver(baseVersion, bumpType);

try {
  const diskPkgContent = readFileSync(pkgPath, "utf-8");
  const pkg = JSON.parse(diskPkgContent);

  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  execSync("git add package.json", { stdio: "ignore" });
  execSync("git commit --amend --no-edit --no-verify", {
    stdio: "ignore",
    env: { ...process.env, BUMP_IN_PROGRESS: "1" },
  });

  console.log(
    `\x1b[32m[version]\x1b[0m Version updated & included in commit: ${baseVersion} -> ${newVersion} (${bumpType})`,
  );
} catch (err) {
  console.error("[version] Failed to amend commit:", err.message);
  process.exit(1);
}
