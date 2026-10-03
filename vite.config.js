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
      entry: {
        lib: resolve(import.meta.dirname, "src/lib/index.ts"),
        bin: resolve(import.meta.dirname, "src/bin/index.ts"),
      },
      fileName: (...args) => {
        console.log(...args);
        const format = args[0];
        return `index.${format}.js`;
      },
      formats: ["es"],
    },
  },
  plugins: [dts()],
});
