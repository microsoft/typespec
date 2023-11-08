import { definePlaygroundViteConfig } from "@typespec/playground/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const useLocalLibraries = env["VITE_USE_LOCAL_LIBRARIES"] === "true";
  const config = definePlaygroundViteConfig({
    defaultEmitter: "@typespec/openapi3",
    libraries: [
      "@typespec/compiler",
      "@typespec/http",
      "@typespec/rest",
      "@typespec/openapi",
      "@typespec/versioning",
      "@typespec/openapi3",
      "@typespec/json-schema",
      "@typespec/protobuf",
    ],
    enableSwaggerUI: true,
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
