#!/usr/bin/env node
// @ts-check

import { run } from "../../../eng/scripts/helpers.js";

if (process.env.TYPESPEC_SKIP_DOCUSAURUS_BUILD?.toLowerCase() === "true") {
  console.log("Skipping docusaurus build: TYPESPEC_SKIP_DOCUSAURUS_BUILD=true");
  process.exit(0);
}

run("docusaurus", ["build"]);
