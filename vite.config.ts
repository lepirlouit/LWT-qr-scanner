import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "node:path";
import { cpSync } from "node:fs";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    {
      name: 'copy-scandit-lib',
      buildStart() {
        cpSync(
          path.resolve(__dirname, 'node_modules/@scandit/web-datacapture-barcode/sdc-lib'),
          path.resolve(__dirname, 'public/scandit-lib'),
          { recursive: true }
        );
      },
    },
  ],
})
