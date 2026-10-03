import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "dist",
    sourcemap: true,
    ssr: true,
    target: "es2024",
    lib: {
      entry: [resolve(import.meta.dirname, "src/index.ts")],
      formats: ["es"],
    },
  },
  plugins: [dts()],
});
