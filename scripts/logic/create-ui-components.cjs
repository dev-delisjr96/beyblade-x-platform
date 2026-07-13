/**
 * create-ui-components.cjs  (upgraded)
 *
 * Interactive generator for React components.
 * Creates: JSX + SCSS module + index.js re-export
 * Optionally: Redux slice, React Query hook, Storybook stub
 *
 * Usage: npm run crui
 */

const path     = require("path");
const fs       = require("fs");
const { input, select, checkbox } = require("@inquirer/prompts");
const { navigateAndSelectFolders } = require("../utilities/internal-nav.cjs");
const LOGGER   = require("../utilities/logger.cjs");
const { initSCSSFile } = require("../utilities/scss-file.cjs");
const templates = require("../templates/reactjs.cjs");

// ── Layer destinations ────────────────────────────────────────────────────────
const SRC = path.resolve(__dirname, "../../src");

const LAYER_DIRS = {
  "default-component": path.join(SRC, "components"),
  "page":              path.join(SRC, "pages"),
  "custom-position":   null, // resolved interactively
};

// ── File writers ──────────────────────────────────────────────────────────────

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
  LOGGER.box(`Created: ${path.relative(path.resolve(__dirname, "../../"), filePath)}`);
}

function createJSX(name, dir) {
  writeFile(path.join(dir, `${name}.jsx`), templates.generateReactJSXComponent(name));
}

function createSCSS(name, dir) {
  const scssPath = path.join(dir, `${name}.module.scss`);
  fs.writeFileSync(scssPath, "", "utf8");
  initSCSSFile("src/styles/main.scss", scssPath);
  LOGGER.box(`Created: ${name}.module.scss`);
}

function createIndex(name, dir) {
  writeFile(
    path.join(dir, "index.js"),
    `export { default } from './${name}';\n`
  );
}

function createSlice(name, dir) {
  const low  = name[0].toLowerCase() + name.slice(1);
  const content = [
    `import { createSlice } from '@reduxjs/toolkit';`,
    ``,
    `/** @type {{ data: any, loading: boolean, error: string|null }} */`,
    `const initialState = { data: null, loading: false, error: null };`,
    ``,
    `const ${low}Slice = createSlice({`,
    `  name: '${low}',`,
    `  initialState,`,
    `  reducers: {`,
    `    set${name}:    (state, { payload }) => { state.data    = payload; },`,
    `    setLoading:    (state, { payload }) => { state.loading = payload; },`,
    `    setError:      (state, { payload }) => { state.error   = payload; },`,
    `    reset${name}:  () => initialState,`,
    `  },`,
    `});`,
    ``,
    `export const { set${name}, setLoading, setError, reset${name} } = ${low}Slice.actions;`,
    `export default ${low}Slice.reducer;`,
    ``,
  ].join("\n");
  writeFile(path.join(dir, `${name}Slice.js`), content);
}

function createQueryHook(name, dir) {
  const low  = name[0].toLowerCase() + name.slice(1);
  const content = [
    `import { useQuery } from '@tanstack/react-query';`,
    `import { queryKeys } from 'api/queryKeys';`,
    ``,
    `/**`,
    ` * Fetches data for ${name}.`,
    ` * @param {string|number} id`,
    ` */`,
    `export function use${name}(id) {`,
    `  return useQuery({`,
    `    queryKey: queryKeys.${low}(id),`,
    `    queryFn:  () => fetch${name}(id),`,
    `    enabled:  !!id,`,
    `  });`,
    `}`,
    ``,
    `/** @param {string|number} id */`,
    `async function fetch${name}(id) {`,
    `  // TODO: implement fetcher for ${name}`,
    `  throw new Error('fetch${name} not implemented — wire to hiring_handlers or mondayClient');`,
    `}`,
    ``,
  ].join("\n");
  writeFile(path.join(dir, `use${name}.js`), content);
}

function createStories(name, dir) {
  const content = [
    `import ${name} from './${name}';`,
    ``,
    `export default {`,
    `  title: 'Components/${name}',`,
    `  component: ${name},`,
    `  tags: ['autodocs'],`,
    `};`,
    ``,
    `export const Default = {`,
    `  args: {},`,
    `};`,
    ``,
  ].join("\n");
  writeFile(path.join(dir, `${name}.stories.jsx`), content);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  // 1. Choose layer
  const layerKey = await select({
    message: "Component layer:",
    choices: [
      { name: "Shared component  (src/components)", value: "default-component" },
      { name: "Page              (src/pages)",       value: "page"              },
      { name: "Custom position   (browse src/)",     value: "custom-position"   },
    ],
  });

  let baseDir = LAYER_DIRS[layerKey];
  if (layerKey === "custom-position") {
    const selected = await navigateAndSelectFolders(SRC);
    baseDir = path.resolve(selected[0]);
  }

  // 2. Component name
  const name = await input({ message: "Component name (PascalCase):" });
  if (!name || !/^[A-Z]/.test(name)) {
    LOGGER.error("Name must be PascalCase (e.g. MyComponent). Aborting.");
    process.exit(1);
  }

  // 3. Optional extras
  const extras = await checkbox({
    message: "Also generate:",
    choices: [
      { name: "index.js re-export",       value: "index",   checked: true  },
      { name: "Redux slice",               value: "slice",   checked: false },
      { name: "React Query hook",          value: "query",   checked: false },
      { name: "Storybook stub (.stories)", value: "stories", checked: false },
    ],
  });

  // 4. Create directory + files
  const dir = path.join(baseDir, name);
  fs.mkdirSync(dir, { recursive: true });

  createJSX(name, dir);
  createSCSS(name, dir);
  if (extras.includes("index"))   createIndex(name, dir);
  if (extras.includes("slice"))   createSlice(name, dir);
  if (extras.includes("query"))   createQueryHook(name, dir);
  if (extras.includes("stories")) createStories(name, dir);

  LOGGER.box(`${name} scaffold complete → ${path.relative(path.resolve(__dirname, "../../"), dir)}`, "Done");
}

run();
