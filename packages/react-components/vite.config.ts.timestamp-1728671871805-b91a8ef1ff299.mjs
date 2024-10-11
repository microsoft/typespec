// vite.config.ts
import react from "file:///Users/timotheeguerin/dev/azsdk/typespec/node_modules/.pnpm/@vitejs+plugin-react@4.3.2_vite@5.4.8_@types+node@22.7.5_terser@5.34.1_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "file:///Users/timotheeguerin/dev/azsdk/typespec/node_modules/.pnpm/vite@5.4.8_@types+node@22.7.5_terser@5.34.1/node_modules/vite/dist/node/index.js";
import checker from "file:///Users/timotheeguerin/dev/azsdk/typespec/node_modules/.pnpm/vite-plugin-checker@0.8.0_eslint@9.12.0_jiti@2.3.3__optionator@0.9.4_typescript@5.6.3_vite@5._temklexzz7tp27mnl3wlzianvm/node_modules/vite-plugin-checker/dist/esm/main.js";
import dts from "file:///Users/timotheeguerin/dev/azsdk/typespec/node_modules/.pnpm/vite-plugin-dts@4.2.3_@types+node@22.7.5_rollup@4.24.0_typescript@5.6.3_vite@5.4.8_@types+node@22.7.5_terser@5.34.1_/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/timotheeguerin/dev/azsdk/typespec/packages/react-components/vite.config.ts";
var __dirname = dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var packageJson = JSON.parse(readFileSync(resolve(__dirname, "package.json")).toString());
var dependencies = Object.keys(packageJson.dependencies);
var externals = [...dependencies];
var vite_config_default = defineConfig({
  build: {
    target: "esnext",
    minify: false,
    chunkSizeWarningLimit: 3e3,
    lib: {
      entry: {
        index: "src/index.ts"
      },
      formats: ["es"]
    },
    rollupOptions: {
      external: externals
    }
  },
  plugins: [
    react({}),
    dts({
      logLevel: "silent"
      // checker reports the errors
    }),
    checker({
      // e.g. use TypeScript check
      typescript: true
    })
  ],
  server: {
    fs: {
      strict: false
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdGltb3RoZWVndWVyaW4vZGV2L2F6c2RrL3R5cGVzcGVjL3BhY2thZ2VzL3JlYWN0LWNvbXBvbmVudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy90aW1vdGhlZWd1ZXJpbi9kZXYvYXpzZGsvdHlwZXNwZWMvcGFja2FnZXMvcmVhY3QtY29tcG9uZW50cy92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdGltb3RoZWVndWVyaW4vZGV2L2F6c2RrL3R5cGVzcGVjL3BhY2thZ2VzL3JlYWN0LWNvbXBvbmVudHMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IGRpcm5hbWUsIHJlc29sdmUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gXCJ1cmxcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgY2hlY2tlciBmcm9tIFwidml0ZS1wbHVnaW4tY2hlY2tlclwiO1xuaW1wb3J0IGR0cyBmcm9tIFwidml0ZS1wbHVnaW4tZHRzXCI7XG5cbmNvbnN0IF9fZGlybmFtZSA9IGRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKTtcblxuY29uc3QgcGFja2FnZUpzb24gPSBKU09OLnBhcnNlKHJlYWRGaWxlU3luYyhyZXNvbHZlKF9fZGlybmFtZSwgXCJwYWNrYWdlLmpzb25cIikpLnRvU3RyaW5nKCkpO1xuY29uc3QgZGVwZW5kZW5jaWVzID0gT2JqZWN0LmtleXMocGFja2FnZUpzb24uZGVwZW5kZW5jaWVzKTtcbmNvbnN0IGV4dGVybmFscyA9IFsuLi5kZXBlbmRlbmNpZXNdO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBidWlsZDoge1xuICAgIHRhcmdldDogXCJlc25leHRcIixcbiAgICBtaW5pZnk6IGZhbHNlLFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMzAwMCxcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiB7XG4gICAgICAgIGluZGV4OiBcInNyYy9pbmRleC50c1wiLFxuICAgICAgfSxcbiAgICAgIGZvcm1hdHM6IFtcImVzXCJdLFxuICAgIH0sXG5cbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogZXh0ZXJuYWxzLFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCh7fSksXG4gICAgZHRzKHtcbiAgICAgIGxvZ0xldmVsOiBcInNpbGVudFwiLCAvLyBjaGVja2VyIHJlcG9ydHMgdGhlIGVycm9yc1xuICAgIH0pLFxuICAgIGNoZWNrZXIoe1xuICAgICAgLy8gZS5nLiB1c2UgVHlwZVNjcmlwdCBjaGVja1xuICAgICAgdHlwZXNjcmlwdDogdHJ1ZSxcbiAgICB9KSxcbiAgXSxcbiAgc2VydmVyOiB7XG4gICAgZnM6IHtcbiAgICAgIHN0cmljdDogZmFsc2UsXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF3WCxPQUFPLFdBQVc7QUFDMVksU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxTQUFTLGVBQWU7QUFDakMsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxhQUFhO0FBQ3BCLE9BQU8sU0FBUztBQU40TixJQUFNLDJDQUEyQztBQVE3UixJQUFNLFlBQVksUUFBUSxjQUFjLHdDQUFlLENBQUM7QUFFeEQsSUFBTSxjQUFjLEtBQUssTUFBTSxhQUFhLFFBQVEsV0FBVyxjQUFjLENBQUMsRUFBRSxTQUFTLENBQUM7QUFDMUYsSUFBTSxlQUFlLE9BQU8sS0FBSyxZQUFZLFlBQVk7QUFDekQsSUFBTSxZQUFZLENBQUMsR0FBRyxZQUFZO0FBRWxDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLHVCQUF1QjtBQUFBLElBQ3ZCLEtBQUs7QUFBQSxNQUNILE9BQU87QUFBQSxRQUNMLE9BQU87QUFBQSxNQUNUO0FBQUEsTUFDQSxTQUFTLENBQUMsSUFBSTtBQUFBLElBQ2hCO0FBQUEsSUFFQSxlQUFlO0FBQUEsTUFDYixVQUFVO0FBQUEsSUFDWjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU0sQ0FBQyxDQUFDO0FBQUEsSUFDUixJQUFJO0FBQUEsTUFDRixVQUFVO0FBQUE7QUFBQSxJQUNaLENBQUM7QUFBQSxJQUNELFFBQVE7QUFBQTtBQUFBLE1BRU4sWUFBWTtBQUFBLElBQ2QsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLElBQUk7QUFBQSxNQUNGLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
