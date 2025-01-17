const fs = require("fs");
const { execSync } = require("child_process");

const sdkModules = ["android", "core"]; // Module directories
const baseBranch = "main"; // Target branch for comparison
const rootVersionFile = "version.json"; // Centralized version file

// Function to read the current version from the JSON file
function getCurrentVersion(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Version file not found: ${filePath}`);
  }
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(fileContent);
  const [major, minor, patch] = json.SDK_VERSION.split(".").map(Number);
  return { major, minor, patch };
}

// Function to get commits affecting a specific module between the local HEAD and the base branch
function getCommits(module) {
  try {
    const tags = execSync("git tag").toString().split("\n").filter(Boolean);
    const oldVersionTag = tags[tags.length - 1]; // Last tag
    const log = execSync(
      `git log ${oldVersionTag}..HEAD --pretty=format:%s -- ${module}`
    ).toString();
    return log.split("\n").filter(Boolean);
  } catch (error) {
    console.error(
      `Error fetching commits for module ${module}:`,
      error.message
    );
    return [];
  }
}

// Function to determine the next version based on commit messages
function bumpVersion(commits, currentVersion) {
  let { major, minor, patch } = currentVersion;

  const hasBreakingChange = commits.some((commit) =>
    commit.startsWith("feat!")
  );
  const hasFeature = commits.some(
    (commit) => commit.startsWith("feat") && !commit.startsWith("feat!")
  );
  const hasFix = commits.some((commit) => commit.startsWith("fix"));

  if (hasBreakingChange) {
    major++;
    minor = 0;
    patch = 0;
  } else if (hasFeature) {
    minor++;
    patch = 0;
  } else if (hasFix) {
    patch++;
  }

  return { major, minor, patch };
}

// Utility function to get the highest version between two versions
function getHighestVersion(version1, version2) {
  if (version1.major > version2.major) return version1;
  if (version1.major < version2.major) return version2;
  if (version1.minor > version2.minor) return version1;
  if (version1.minor < version2.minor) return version2;
  return version1.patch >= version2.patch ? version1 : version2;
}

// Main logic for version bumping
let newVersion = null;

sdkModules.forEach((module) => {
  try {
    const currentVersion = getCurrentVersion(rootVersionFile);
    const commits = getCommits(module);

    if (commits.length === 0) {
      console.log(
        `No relevant changes for module ${module}. Skipping version bump.`
      );
      return;
    }

    const nextVersion = bumpVersion(commits, currentVersion);
    newVersion = newVersion
      ? getHighestVersion(newVersion, nextVersion)
      : nextVersion;

    console.log(
      `Calculated version for ${module}: ${nextVersion.major}.${nextVersion.minor}.${nextVersion.patch}`
    );
  } catch (error) {
    console.error(`Error processing module ${module}:`, error.message);
  }
});

// Function to write the updated version back to the JSON file
function writeVersion(filePath, version) {
  const newVersion = {
    SDK_VERSION: `${version.major}.${version.minor}.${version.patch}`,
  };
  fs.writeFileSync(filePath, JSON.stringify(newVersion, null, 2));
}

const areVersionsEqual = (version1, version2) =>
  version1.major === version2.major &&
  version1.minor === version2.minor &&
  version1.patch === version2.patch;

const currentVersion = getCurrentVersion(rootVersionFile);

if (newVersion && !areVersionsEqual(newVersion, currentVersion)) {
  try {
    writeVersion(rootVersionFile, newVersion);
    console.log(
      `Updated centralized version to ${newVersion.major}.${newVersion.minor}.${newVersion.patch}`
    );
  } catch (error) {
    console.error("Error updating root version file:", error.message);
  }
} else {
  console.log("No version bump required.");
}
