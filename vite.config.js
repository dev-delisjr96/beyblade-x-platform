import million from "million/compiler";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  optimizeDeps: {
    include: ["redux-persist", "redux-persist/lib/storage"],
  },
  plugins: [
    million.vite({
      auto: {
        threshold: 0.05,
        skip: ["useBadHook", /badVariable/g],
        // exclude store and redux files entirely
      },
      exclude: ["src/redux/**", "src/state/**"],
    }),
    react(),
    svgr(),
  ],
  esbuild: {
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
  },
  resolve: {
    alias: {
      src: "/src",
      modules: "/src/modules",
      components: "/src/components",
      assets: "/src/assets",
      styles: "/src/styles",
      pages: "/src/pages",
      state: "/src/state",
      api: "/src/api",
      utilities: "/src/utilities",
      configs: "/src/configs",
      hooks: "/src/hooks",
      services: "/src/services",
      translations: "/src/translations",
      classes: "/src/classes",
      templates: "/src/templates",
    },
  },
});
