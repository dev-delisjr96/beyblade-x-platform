/**
 * Template for the main SCSS import declaration.
 * 
 * This template dynamically creates an SCSS `@use` import statement 
 * with a resolved relative path to the main styles.
 * 
 * TO USE : REPLACE {{relativePathToMainStyles}} with proper name
 * TO USE IN FUNCTION: REPLACE {{relativePathToMainStyles}} with ${relativePathToMainStyles}.
 * @constant {string} MAIN_SCSS_IMPORT_DECLARATION
 * @param {string} relativePathToMainStyles
 * 
 */
const MAIN_SCSS_IMPORT_DECLARATION = `@use "{{relativePathToMainStyles.replace(/\\/g, "/")}}";\n`;

module.exports = { MAIN_SCSS_IMPORT_DECLARATION }

const DEFAULT_MAIN_SCSS_PATH = "src/styles/main.scss";

module.exports = { DEFAULT_MAIN_SCSS_PATH }