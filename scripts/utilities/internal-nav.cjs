/**
 * Reusable utilities and interactive CLI selectors for navigating and selecting folders or files.
 */

const fs = require("fs");
const path = require("path");
const { select } = require("@inquirer/prompts");
const LOGGER = require("./logger.cjs");

/**
 * @typedef {'file'|'folder'} SelectionType
 */

/**
 * @typedef {Object} SelectorOptions
 * @property {string} [startDir=process.cwd()] - Starting directory.
 * @property {SelectionType} type - Type of selection ('file' or 'folder').
 */

/**
 * Get directory entries with optional filtering.
 * @param {string} dir
 * @param {SelectionType} type
 * @returns {fs.Dirent[]}
 */
function getFilteredDirEntries(dir, type) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.filter((entry) =>
    type === "folder" ? entry.isDirectory() : entry.isFile()
  );
}
module.exports.getFilteredDirEntries = getFilteredDirEntries;

/**
 * Build relative path.
 * @param {string} base
 * @param {string} target
 * @returns {string}
 */
function getRelativePath(base, target) {
  return path.relative(base, path.resolve(base, target));
}
module.exports.getRelativePath = getRelativePath;

/**
 * Toggle item selection in a Set.
 * @param {Set<string>} selection
 * @param {string} item
 */
function toggleSelection(selection, item) {
  selection.has(item) ? selection.delete(item) : selection.add(item);
}
module.exports.toggleSelection = toggleSelection;

/**
 * Show an interactive menu to select files or folders with navigation.
 * @param {SelectorOptions} options
 * @returns {Promise<string[]>}
 */
async function navigateAndSelect({ startDir = process.cwd(), type }) {
  const selection = new Set();
  let currentDir = path.resolve(startDir);
  const history = [];

  while (true) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    const folders = entries.filter((e) => e.isDirectory());
    const targets = entries.filter((e) =>
      type === "folder" ? e.isDirectory() : e.isFile()
    );

    const choices = [];

    if (history.length > 0) {
      choices.push({ name: "⬅️  Back", value: "__back__" });
    }

    for (const entry of folders) {
      const value = `__folder__:${entry.name}`;
      const name = type === "folder" ? entry.name : `📁 ${entry.name}`;
      choices.push({ name, value });
    }

    for (const entry of targets) {
      if (type === "file") {
        const relPath = getRelativePath(
          process.cwd(),
          path.join(currentDir, entry.name)
        );
        const name = selection.has(relPath) ? `✅ ${entry.name}` : entry.name;
        choices.push({ name, value: `__file__:${entry.name}` });
      }
    }

    choices.push({ name: "✅ Confirm selection", value: "__confirm__" });

    const answer = await select({
      message: history.length > 0 ? "" : LOGGER.box (
        getRelativePath(process.cwd(), currentDir) || ".",
        "Current directory: ",
        100,
        true
      ),
      choices,
      loop: false,
    });

    if (answer === "__back__") {
      currentDir = history.pop();
    } else if (answer === "__confirm__") {
      return [...selection];
    } else if (answer.startsWith("__folder__:")) {
      const folderName = answer.split(":")[1];
      if (type === "folder") {
        const rel = getRelativePath(
          process.cwd(),
          path.join(currentDir, folderName)
        );
        if(!history.length > 0){
          LOGGER.box(rel, "Current Folder Path")
        }
        const subChoices = [
          { name: "📁 Open folder", value: "__open__" },
          {
            name: selection.has(rel)
              ? "❌ Deselect this folder"
              : "✅ Select this folder",
            value: "__toggle__",
          },
          { name: "⬅️  Cancel", value: "__cancel__" },
        ];

        const subAnswer = await select({
          // message: LOGGER.box(folderName, `What do you want to do with?`, 100, true),
          message: "",
          choices: subChoices,
          loop: false,
        });

        if (subAnswer === "__open__") {
          history.push(currentDir);
          currentDir = path.join(currentDir, folderName);
        } else if (subAnswer === "__toggle__") {
          toggleSelection(selection, rel);
        }
      } else {
        history.push(currentDir);
        currentDir = path.join(currentDir, folderName);
      }
    } else if (answer.startsWith("__file__:")) {
      const fileName = answer.split(":")[1];
      const relPath = getRelativePath(
        process.cwd(),
        path.join(currentDir, fileName)
      );
      LOGGER.box(relPath, "Current File Path")
      toggleSelection(selection, relPath);
    }
  }
}
module.exports.navigateAndSelect = navigateAndSelect;

/**
 * Start interactive folder selection.
 * @param {string} [startDir]
 * @returns {Promise<string[]>}
 */
async function navigateAndSelectFolders(startDir) {
  return navigateAndSelect({ startDir, type: "folder" });
}
module.exports.navigateAndSelectFolders = navigateAndSelectFolders;

/**
 * Start interactive file selection.
 * @param {string} [startDir]
 * @returns {Promise<string[]>}
 */
async function navigateAndSelectFiles(startDir) {
  return navigateAndSelect({ startDir, type: "file" });
}
module.exports.navigateAndSelectFiles = navigateAndSelectFiles;