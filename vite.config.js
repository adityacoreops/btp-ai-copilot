import { defineConfig } from "vite";

export default defineConfig({
  root: "client",
  server: {
    port: 5173,
    host: true, // Exposes the port so SAP BAS routing can access the frontend URL
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001", // Proxies to the Express backend
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true
  }
});