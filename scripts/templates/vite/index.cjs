const { readJson, writeFile } = require("../../utilities/index.cjs");
const path = require("path");
const prettier = require("prettier");

const vitejs = path.resolve(__dirname, "../../../vite.config.js");
let DEFAULT_ABSOLUTE_PATHS = path.resolve(__dirname, "./paths.json");

const MILLION_CONFIGS = () => {
  const imports_dep = 'import million from "million/compiler";';
  const plugin_dep = ` million.vite({
        auto: {
          threshold: 0.05,
          skip: ["useBadHook", /badVariable/g],
        },
      })`;

  return {
    dep: imports_dep,
    handler: plugin_dep,
  };
};

const BUILD_CONFIGS = `esbuild: {
      minify: true,
      target: "esnext",
    },
    build: {
      minify: "esbuild",
      sourcemap: false,
      target: "esnext", // Use latest JavaScript features
      brotliSize: false, // Avoid additional gzip/brotli size computation
      cssCodeSplit: true, // Only bundle used CSS
      chunkSizeWarningLimit: 1000, // Increase limit for large projects
      rollupOptions: {
        output: {
          manualChunks: undefined, // Let Rollup optimize automatically
        },
      },
      terserOptions: {
        compress: {
          drop_console: true, // Remove console logs in production
        },
      },
      terser: {
        parallel: true, // Use multiple cores for minification
      },
    }`;

function viteConfigTemplate() {
  const MILLIONJS = MILLION_CONFIGS();

  const defaultTemplate = `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
${MILLIONJS.dep}

import fs from "fs";
import path from "path";

const paths = JSON.parse(
  fs.readFileSync(path.resolve("./scripts/templates/vite/paths.json"), "utf-8")
);

export default defineConfig({
    plugins: [
        ${MILLIONJS.handler},
        react(),
    ],
    ${BUILD_CONFIGS},
    resolve: {
      alias: paths
    }
});
`;

  return defaultTemplate;
}

module.exports.viteConfigTemplate = viteConfigTemplate;
