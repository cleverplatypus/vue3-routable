import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom", // Ensure JSDOM environment is used for Vue components
    globals: true, // Enable global APIs like describe and it
  },
});
