#!/usr/bin/env node
// @ts-check

import { runOrExit } from "@typespec/internal-build-utils";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

loadDotenv();

if (process.env.TYPESPEC_SKIP_DOCUSAURUS_BUILD?.toLowerCase() === "true") {
  console.log("Skipping docusaurus build: TYPESPEC_SKIP_DOCUSAURUS_BUILD=true");
  process.exit(0);
}

await runOrExit("docusaurus", ["build"], {
  env: {
    ...process.env,
    USE_SIMPLE_CSS_MINIFIER: "true",
  },
});

function loadDotenv() {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const searchPaths = ["../../../.env", "../../../../.env"];
  for (const searchPath of searchPaths) {
    const dotenvPath = path.resolve(dirname, searchPath);
    console.log(`Searching dotEnvPath: ${dotenvPath}`);
    const result = dotenv.config({
      path: dotenvPath,
    });
    if (result.parsed !== undefined) {
      console.log(`Loaded dotenv: ${dotenvPath}`);
      return;
    }
  }
}
