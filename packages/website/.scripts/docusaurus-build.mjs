#!/usr/bin/env node
// @ts-check

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { run } from "../../../eng/scripts/helpers.js";

loadDotenv();

if (process.env.TYPESPEC_SKIP_DOCUSAURUS_BUILD?.toLowerCase() === "true") {
  console.log("Skipping docusaurus build: TYPESPEC_SKIP_DOCUSAURUS_BUILD=true");
  process.exit(0);
}

run("docusaurus", ["build"]);

function loadDotenv() {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const dotenvPath = path.resolve(dirname, "../../../.env");
  dotenv.config({
    path: dotenvPath,
  });
}
