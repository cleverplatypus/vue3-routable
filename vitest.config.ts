import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    vue(),
    // Add a plugin to handle the virtual module
    {
      name: 'mock-vue3-routable-manifest',
      resolveId(id) {
        if (id === 'virtual:vue3-routable-manifest') {
          return id;
        }
        return null;
      },
      load(id) {
        if (id === 'virtual:vue3-routable-manifest') {
          return 'export const RoutableRegistry = [];';
        }
        return null;
      }
    }
  ],
  test: {
    environment: "jsdom", // Ensure JSDOM environment is used for Vue components
    globals: true, // Enable global APIs like describe and it
  },
});
