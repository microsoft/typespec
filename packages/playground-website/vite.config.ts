import { definePlaygroundViteConfig } from "@typespec/playground/vite";
import { execSync } from "child_process";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";
import { TypeSpecPlaygroundConfig } from "./src/index.js";

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

  const prNumber = getPrNumber();
  if (prNumber) {
    config.define = {
      __PR__: JSON.stringify(prNumber),
      __COMMIT_HASH__: JSON.stringify(getCommit()),
    };
  }
  return config;
});
