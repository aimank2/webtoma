import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "", // Ensures paths are relative, good for extensions
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        // Your main application entry (e.g., popup or options page)
        main: path.resolve(__dirname, "index.html"),
        // Content script entry point
        formExtractor: path.resolve(__dirname, "src/content/formExtractor.ts"),
        // Add other entry points like background scripts if you have them
        // background: path.resolve(__dirname, "src/background.ts"),
      },
      output: {
        // Configure output names for your entry points
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "formExtractor") {
            return "content/formExtractor.js"; // Output to dist/content/formExtractor.js
          }
          // if (chunkInfo.name === 'background') {
          //   return 'background.js'; // Output to dist/background.js
          // }
          return "[name].js"; // Default for 'main' and other chunks
        },
        chunkFileNames: "assets/[name]-[hash].js", // For code-split chunks from your main app
        assetFileNames: "assets/[name]-[hash].[ext]", // For assets like CSS, images
      },
    },
  },
});
