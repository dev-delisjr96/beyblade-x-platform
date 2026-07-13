/**
 * create-page.cjs
 *
 * Scaffolds a full page under src/pages/ with:
 *   - PageName.jsx (with LogoHead + Footer wired in)
 *   - PageName.module.scss
 *   - index.js re-export
 *
 * Usage: npm run crpage
 */

const path   = require("path");
const fs     = require("fs");
const { input, select } = require("@inquirer/prompts");
const LOGGER = require("../utilities/logger.cjs");
const { initSCSSFile } = require("../utilities/scss-file.cjs");

const ROOT    = path.resolve(__dirname, "../../");
const PAGES   = path.resolve(ROOT, "src/pages");
const APP_JSX = path.resolve(ROOT, "src/App.jsx");

async function run() {
  // 1. Page name
  const name = await input({ message: "Page name (PascalCase, e.g. ApplicationPage):" });
  if (!name || !/^[A-Z]/.test(name)) {
    LOGGER.error("Name must be PascalCase. Aborting.");
    process.exit(1);
  }

  // 2. Route path
  const route = await input({ message: "Route path (e.g. /apply/:country):" });

  // 3. Layout options
  const hasHeader = await select({
    message: "Include LogoHead header?",
    choices: [{ name: "Yes", value: true }, { name: "No", value: false }],
  });
  const hasFooter = await select({
    message: "Include Footer?",
    choices: [{ name: "Yes", value: true }, { name: "No", value: false }],
  });

  const dir = path.join(PAGES, name);
  fs.mkdirSync(dir, { recursive: true });

  // ── JSX ──
  const headerImport  = hasHeader ? `import LogoHead from 'components/LogoHead/LogoHead';\n` : "";
  const footerImport  = hasFooter ? `import Footer from 'components/Footer/Footer';\n` : "";
  const headerJSX     = hasHeader ? `      <LogoHead additionalstyles={styles} />\n` : "";
  const footerJSX     = hasFooter ? `      <Footer variant="light" />\n` : "";

  const jsx = [
    `import React from 'react';`,
    `import { useParams } from 'react-router-dom';`,
    ``,
    `// Components`,
    hasHeader ? `import LogoHead from 'components/LogoHead/LogoHead';` : null,
    hasFooter ? `import Footer from 'components/Footer/Footer';` : null,
    ``,
    `// Styles`,
    `import styles from './${name}.module.scss';`,
    `import { generateClassesNames } from 'styles/utilities';`,
    ``,
    `/* eslint-disable-next-line no-unused-vars */`,
    `const ${name} = ({ additionalstyles, ...props }) => {`,
    `  const params = useParams();`,
    ``,
    `  const elements = ['page', '${name.toLowerCase()}'];`,
    `  const cn = generateClassesNames(elements, styles, additionalstyles);`,
    ``,
    `  return (`,
    `    <div className={cn['page']} id={cn['${name.toLowerCase()}']}>`,
    hasHeader ? `      <LogoHead additionalstyles={styles} />` : null,
    `      {/* ${name} content */}`,
    hasFooter ? `      <Footer variant="light" />` : null,
    `    </div>`,
    `  );`,
    `};`,
    ``,
    `export default ${name};`,
    ``,
  ].filter(l => l !== null).join("\n");

  fs.writeFileSync(path.join(dir, `${name}.jsx`), jsx, "utf8");

  // ── SCSS ──
  const scssPath = path.join(dir, `${name}.module.scss`);
  fs.writeFileSync(scssPath, "", "utf8");
  initSCSSFile("src/styles/main.scss", scssPath);
  const scssExtra = [
    ``,
    `.page {`,
    `  // ${name} layout`,
    `  display: flex;`,
    `  flex-direction: column;`,
    `  min-height: 100%;`,
    `}`,
    ``,
  ].join("\n");
  fs.appendFileSync(scssPath, scssExtra, "utf8");

  // ── index.js ──
  fs.writeFileSync(
    path.join(dir, "index.js"),
    `export { default } from './${name}';\n`,
    "utf8"
  );

  // ── Reminder ──
  const routeSnippet = [
    ``,
    `// Add to src/App.jsx:`,
    `import ${name} from 'pages/${name}';`,
    `<Route path="${route}" element={<${name} />} />`,
    ``,
  ].join("\n");

  LOGGER.box(
    `${name} created at src/pages/${name}/\n\nRoute hint:${routeSnippet}`,
    "Page scaffold complete"
  );
}

run();
