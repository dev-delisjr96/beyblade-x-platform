/**
 * create-slice.cjs
 *
 * Interactive Redux slice generator.
 * Creates:
 *   - src/state/slices/<name>Slice.js       (createSlice with actions)
 *   - src/state/slices/<name>Selectors.js   (memoised selectors via createSelector)
 *
 * Usage: npm run crslice
 */

const path   = require("path");
const fs     = require("fs");
const { input, checkbox } = require("@inquirer/prompts");
const LOGGER = require("../utilities/logger.cjs");

const ROOT       = path.resolve(__dirname, "../../");
const SLICES_DIR = path.resolve(ROOT, "src/state/slices");
const STORE_PATH = path.resolve(ROOT, "src/state/store.js");

async function run() {
  // 1. Slice name (camelCase)
  const rawName = await input({
    message: "Slice name (camelCase, e.g. jobSelection):",
  });
  const name = rawName.trim();
  if (!name || /[^a-zA-Z0-9]/.test(name)) {
    LOGGER.error("Name must be camelCase alphanumeric. Aborting.");
    process.exit(1);
  }
  const Name = name[0].toUpperCase() + name.slice(1); // PascalCase

  // 2. State fields
  const fieldsRaw = await input({
    message: "State fields (comma-separated, e.g. selectedJob,filter,page):",
  });
  const fields = fieldsRaw
    .split(",")
    .map(f => f.trim())
    .filter(Boolean);

  // 3. Extra reducers
  const extras = await checkbox({
    message: "Extra reducers to generate:",
    choices: [
      { name: "Async thunk (loading/error pattern)", value: "async", checked: true },
      { name: "Pagination (page, pageSize, total)",  value: "pagination", checked: false },
    ],
  });

  fs.mkdirSync(SLICES_DIR, { recursive: true });

  // ── Build initialState ────────────────────────────────────────────────────
  const stateFields = [
    ...fields.map(f => `  ${f}: null`),
    `  loading: false`,
    `  error: null`,
    ...(extras.includes("pagination") ? [`  page: 1`, `  pageSize: 20`, `  total: 0`] : []),
  ];

  // ── Build reducers ────────────────────────────────────────────────────────
  const setterReducers = fields.map(f => {
    const setter = `set${f[0].toUpperCase()}${f.slice(1)}`;
    return `    ${setter}: (state, { payload }) => { state.${f} = payload; },`;
  });

  const baseReducers = [
    ...setterReducers,
    `    setLoading:   (state, { payload }) => { state.loading = payload; },`,
    `    setError:     (state, { payload }) => { state.error   = payload; },`,
    `    reset${Name}: () => initialState,`,
  ];

  if (extras.includes("pagination")) {
    baseReducers.push(
      `    setPage:      (state, { payload }) => { state.page     = payload; },`,
      `    setPageSize:  (state, { payload }) => { state.pageSize = payload; },`,
      `    setTotal:     (state, { payload }) => { state.total    = payload; },`,
    );
  }

  // ── Build export names ────────────────────────────────────────────────────
  const exportNames = [
    ...fields.map(f => `set${f[0].toUpperCase()}${f.slice(1)}`),
    "setLoading",
    "setError",
    `reset${Name}`,
    ...(extras.includes("pagination") ? ["setPage", "setPageSize", "setTotal"] : []),
  ];

  // ── Async thunk stub ──────────────────────────────────────────────────────
  const thunkSection = extras.includes("async") ? [
    ``,
    `// ── Async thunk ───────────────────────────────────────────────────────────`,
    `import { createAsyncThunk } from '@reduxjs/toolkit';`,
    ``,
    `/**`,
    ` * Async thunk for ${name}.`,
    ` * Replace the body with your actual API call.`,
    ` */`,
    `export const fetch${Name} = createAsyncThunk(`,
    `  '${name}/fetch',`,
    `  async (params, { rejectWithValue }) => {`,
    `    try {`,
    `      // TODO: replace with real API call`,
    `      // const data = await hiringHandlers.get${Name}(params);`,
    `      // return data;`,
    `      throw new Error('fetch${Name} not implemented');`,
    `    } catch (err) {`,
    `      return rejectWithValue(err.message);`,
    `    }`,
    `  }`,
    `);`,
    ``,
    `// Wire the thunk into extraReducers if needed:`,
    `// extraReducers: (builder) => {`,
    `//   builder`,
    `//     .addCase(fetch${Name}.pending,   (state) => { state.loading = true; state.error = null; })`,
    `//     .addCase(fetch${Name}.fulfilled, (state, { payload }) => { state.loading = false; state.data = payload; })`,
    `//     .addCase(fetch${Name}.rejected,  (state, { payload }) => { state.loading = false; state.error = payload; });`,
    `// },`,
  ] : [];

  // ── Slice file ────────────────────────────────────────────────────────────
  const sliceContent = [
    `import { createSlice } from '@reduxjs/toolkit';`,
    ``,
    `/**`,
    ` * @typedef {Object} ${Name}State`,
    ...fields.map(f => ` * @property {*}       ${f}`),
    ` * @property {boolean} loading`,
    ` * @property {string|null} error`,
    ` */`,
    ``,
    `/** @type {${Name}State} */`,
    `const initialState = {`,
    stateFields.join(",\n"),
    `};`,
    ``,
    `const ${name}Slice = createSlice({`,
    `  name: '${name}',`,
    `  initialState,`,
    `  reducers: {`,
    baseReducers.join("\n"),
    `  },`,
    `});`,
    ``,
    `export const {`,
    `  ${exportNames.join(",\n  ")}`,
    `} = ${name}Slice.actions;`,
    ``,
    `export default ${name}Slice.reducer;`,
    ...thunkSection,
    ``,
  ].join("\n");

  // ── Selectors file ────────────────────────────────────────────────────────
  const selectorContent = [
    `import { createSelector } from '@reduxjs/toolkit';`,
    ``,
    `/** Root selector — assumes slice is mounted as state.${name} in the store */`,
    `const select${Name}Root = (state) => state.${name};`,
    ``,
    `export const select${Name}Loading = createSelector(select${Name}Root, (s) => s.loading);`,
    `export const select${Name}Error   = createSelector(select${Name}Root, (s) => s.error);`,
    ...fields.map(f => {
      const sel = `select${f[0].toUpperCase()}${f.slice(1)}`;
      return `export const ${sel} = createSelector(select${Name}Root, (s) => s.${f});`;
    }),
    ...(extras.includes("pagination") ? [
      `export const select${Name}Page     = createSelector(select${Name}Root, (s) => s.page);`,
      `export const select${Name}PageSize = createSelector(select${Name}Root, (s) => s.pageSize);`,
      `export const select${Name}Total    = createSelector(select${Name}Root, (s) => s.total);`,
    ] : []),
    ``,
  ].join("\n");

  const slicePath    = path.join(SLICES_DIR, `${name}Slice.js`);
  const selectorPath = path.join(SLICES_DIR, `${name}Selectors.js`);

  fs.writeFileSync(slicePath,    sliceContent,    "utf8");
  fs.writeFileSync(selectorPath, selectorContent, "utf8");

  // ── Store reminder ────────────────────────────────────────────────────────
  const storeReminder = fs.existsSync(STORE_PATH)
    ? `\nAdd to src/state/store.js:\n  import ${name}Reducer from './slices/${name}Slice';\n  reducer: { ..., ${name}: ${name}Reducer }`
    : `\nCreate src/state/store.js and add:\n  ${name}: ${name}Reducer`;

  LOGGER.box(
    `state/slices/${name}Slice.js\nstate/slices/${name}Selectors.js\n${storeReminder}`,
    "Slice created"
  );
}

run();
