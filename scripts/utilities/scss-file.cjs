const fs = require("fs");
const path = require("path");

const {
    DEFAULT_MAIN_SCSS_PATH
} = require("../templates/scss-module.cjs")

/**
 * Writes a line with the mainStylesPath in the specified file.
 * @param {string} mainStylesPath - Relative path of the styles file (default is "src/styles/main.scss").
 * @param {string} targetFilePath - Relative path to the current file where the import statement should be written.
 */
function initSCSSFile(mainStylesPath = DEFAULT_MAIN_SCSS_PATH, targetFilePath) {
    try {
        
        // Resolve absolute paths of both mainStylesPath and targetFilePath
        const absoluteMainStylesPath = path.resolve(mainStylesPath);
        const absoluteTargetPath = path.resolve(targetFilePath);

        // Calculate the relative path from the target file to the main styles file
        const relativePathToMainStyles = path.relative(path.dirname(absoluteTargetPath), absoluteMainStylesPath);
        
        // The line to write in the file, e.g., `@import "src/styles/main.scss";`
        const contentToWrite = `@use "${relativePathToMainStyles.replace(/\\/g, "/")}";\n`;
        
        // Append or write the line to the target file
        fs.writeFileSync(absoluteTargetPath, contentToWrite, { flag: "a" });
        
        console.log(`Successfully wrote to ${absoluteTargetPath}`);
    } catch (error) {
        console.error("An error occurred:", error);
    
    }
}

module.exports = { initSCSSFile }

// Usage example
// writeMainStylePath("src/styles/main.scss", "src/components/Accordion/Accordion.module.scss");
