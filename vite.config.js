import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    // Android contains a copied production index; only crawl the source app in dev.
    entries: ["index.html"],
  },
});
