const fs = require("fs");
const { execSync } = require("child_process");

const CHANGELOG_FILE = "CHANGELOG.md";
const REPO_URL = "https://github.com/1abhishekpandey/abhishek-kotlin";
const rootVersionFile = "version.json"; // Path to the centralized version file

// Function to get the current version from version.json
function getCurrentVersion(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(fileContent);
  return json.SDK_VERSION;
}

// Function to get git commits between two tags
function getCommitsBetweenTags(oldTag, newTag) {
  try {
    const log = execSync(
      `git log ${oldTag}..${newTag} --name-only --pretty=format:"%h|%s"`
    )
      .toString()
      .split("\n")
      .filter(Boolean)
      .reduce((acc, line, index, array) => {
        // If the current line is a commit hash and message
        if (line.includes("|")) {
          const [hash, message] = line.split("|");

          // Only process commits that start with 'feat' or 'fix'
          if (!message.startsWith("feat") && !message.startsWith("fix")) {
            return acc;
          }

          // Gather all the subsequent lines (files) until the next commit
          const files = [];
          while (array[index + 1] && !array[index + 1].includes("|")) {
            files.push(array[index + 1]);
            index++;
          }

          // Filter the files based on the module names 'android' and 'core'
          const filteredFiles = files.filter(
            (file) => file.includes("android") || file.includes("core")
          );

          // Only push to the array if there are files related to 'android' or 'core'
          if (filteredFiles.length > 0) {
            acc.push({
              hash,
              message: message.trim(),
              files: filteredFiles.filter(Boolean),
            });
          }
        }
        return acc;
      }, []);
    console.log(log);
    return log;
  } catch (error) {
    console.error("Error fetching commits:", error.message);
    return [];
  }
}

// Function to classify commits based on file paths
function classifyCommitsByModule(commits, modules) {
  const classifiedCommits = {};

  // Initialize module objects
  modules.forEach((module) => {
    classifiedCommits[module] = [];
  });

  commits.forEach(({ message, hash, files }) => {
    modules.forEach((module) => {
      if (files.some((file) => file.startsWith(module))) {
        classifiedCommits[module].push({ message, hash });
      }
    });
  });

  return classifiedCommits;
}

// Function to classify commits based on type
function classifyCommits(commits) {
  const breakingChanges = [];
  const features = [];
  const fixes = [];

  commits.forEach(({ message, hash }) => {
    const isBreaking =
      message.startsWith("feat!") || message.startsWith("fix!");
    if (isBreaking) {
      breakingChanges.push({ message, hash });
    }

    if (message.startsWith("feat")) {
      features.push({ message, hash });
    } else if (message.startsWith("fix")) {
      fixes.push({ message, hash });
    }
  });

  return { breakingChanges, features, fixes };
}

// Function to clean commit messages by removing anything before ': '
function cleanCommitMessage(message) {
  return message.replace(/^.*?:\s*/, "").trim();
}

function writeChangelogForModule(module, newVersion, oldVersion, commits) {
  const versionTag = `v${newVersion}`;
  const oldTag = `v${oldVersion}`;
  const date = new Date().toISOString().split("T")[0];
  const changelogFile = `${module}/CHANGELOG.md`;
  const header = "# Changelog\n\n";

  // Generate changelog content for this update
  let changelogContent = `## [${newVersion}](${REPO_URL}/compare/${oldTag}...${versionTag}) (${date})\n\n`;

  const { breakingChanges, features, fixes } = classifyCommits(commits);

  if (breakingChanges.length > 0) {
    changelogContent += "### ⚠ BREAKING CHANGES\n\n";
    breakingChanges.forEach(({ message, hash }) => {
      changelogContent += `* ${cleanCommitMessage(
        message
      )} ([${hash}](${REPO_URL}/commit/${hash}))\n`;
    });
    changelogContent += "\n";
  }

  if (features.length > 0) {
    changelogContent += "### Features\n\n";
    features.forEach(({ message, hash }) => {
      changelogContent += `* ${cleanCommitMessage(
        message
      )} ([${hash}](${REPO_URL}/commit/${hash}))\n`;
    });
    changelogContent += "\n";
  }

  if (fixes.length > 0) {
    changelogContent += "### Fixes\n\n";
    fixes.forEach(({ message, hash }) => {
      changelogContent += `* ${cleanCommitMessage(
        message
      )} ([${hash}](${REPO_URL}/commit/${hash}))\n`;
    });
    changelogContent += "\n";
  }

  // Add default changelog entry if no changes
  if (!breakingChanges.length && !features.length && !fixes.length) {
    changelogContent += "### Miscellaneous Chores\n\n";
    changelogContent += `* **${module}:** Synchronize Kotlin SDKs versions\n\n`;
  }

  // Handle file creation or update
  if (!fs.existsSync(changelogFile)) {
    // If file doesn't exist, create it with the header and changelog content
    fs.writeFileSync(changelogFile, header + changelogContent);
    console.log(`Changelog for module ${module} created.`);
  } else {
    // If file exists, prepend the new changelog after removing the first line
    const existingContent = fs.readFileSync(changelogFile, "utf-8");
    const existingWithoutHeader = existingContent
      .split("\n")
      .slice(1)
      .join("\n");
    fs.writeFileSync(
      changelogFile,
      header + changelogContent + existingWithoutHeader
    );
    console.log(`Changelog for module ${module} updated.`);
  }
}

// Main logic
function generateChangelog() {
  const modules = ["core", "android"]; // List of modules
  const currentVersion = getCurrentVersion(rootVersionFile);

  // Fetch the latest tag
  const tags = execSync("git tag").toString().split("\n").filter(Boolean);
  const oldVersionTag = tags[tags.length - 1]; // Last tag
  const oldVersion = oldVersionTag.replace(/^v/, "");

  // Get commits for each module
  const commits = getCommitsBetweenTags(oldVersionTag, "HEAD");

  if (commits.length === 0) {
    console.log("No new commits found.");
  } else {
    const classifiedCommits = classifyCommitsByModule(commits, modules);

    modules.forEach((module) => {
      if (classifiedCommits[module]?.length > 0) {
        writeChangelogForModule(
          module,
          currentVersion,
          oldVersion,
          classifiedCommits[module]
        );
        console.log(`Changelog for module ${module} updated.`);
      } else {
        // Add the default message for modules with no changes
        writeChangelogForModule(module, currentVersion, oldVersion, []);
        console.log(
          `No new commits for module ${module}. Added default message.`
        );
      }
    });
  }
}

generateChangelog();
