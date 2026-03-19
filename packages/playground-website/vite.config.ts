import { definePlaygroundViteConfig } from "@typespec/playground/vite";
import { execSync } from "child_process";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";
import { TypeSpecPlaygroundConfig } from "./src/config.js";

function getCommit() {
  return execSync("git rev-parse HEAD").toString().trim();
}

function getPrNumber() {
  // Set by Azure DevOps.
  return process.env["SYSTEM_PULLREQUEST_PULLREQUESTNUMBER"];
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const useLocalLibraries = env["VITE_USE_LOCAL_LIBRARIES"] === "true";
  const config = definePlaygroundViteConfig({
    ...TypeSpecPlaygroundConfig,
    links: {
      documentationUrl: "https://typespec.io",
    },
    skipBundleLibraries: !useLocalLibraries,
  });

  config.build!.outDir = "dist/web";

  config.plugins!.push(
    visualizer({
      filename: "temp/stats.html",
    }) as any,
  );

  const prNumber = getPrNumber();
  if (prNumber) {
    config.define = {
      __PR__: JSON.stringify(prNumber),
      __COMMIT_HASH__: JSON.stringify(getCommit()),
    };
  }
  return config;
});
