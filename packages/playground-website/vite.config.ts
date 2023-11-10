import { definePlaygroundViteConfig } from "@typespec/playground/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";
import { TypeSpecPlaygroundConfig } from "./src/index.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const useLocalLibraries = env["VITE_USE_LOCAL_LIBRARIES"] === "true";
  const config = definePlaygroundViteConfig({
    ...TypeSpecPlaygroundConfig,
    links: {
      githubIssueUrl: `https://github.com/microsoft/typespec/issues/new`,
      documentationUrl: "https://microsoft.github.io/typespec",
    },
    skipBundleLibraries: !useLocalLibraries,
  });

  config.plugins!.push(
    visualizer({
      filename: "temp/stats.html",
    }) as any
  );
  return config;
});
