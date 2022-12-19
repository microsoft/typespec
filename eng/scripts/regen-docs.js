#!/usr/bin/env node
// @ts-check
import { join } from "path";
import { generateDocs } from "../../packages/ref-doc/dist/src/index.js";
import { repoRoot } from "./helpers.js";

// Rest
await generateDocs(
  join(repoRoot, "packages/rest/lib/rest.cadl"),
  ["Cadl.Http", "Cadl.Rest", "Cadl.Rest.Resource"],
  join(repoRoot, "docs/standard-library/rest/reference")
);

// OpenAPI
await generateDocs(
  join(repoRoot, "packages/openapi/lib/main.cadl"),
  ["OpenAPI"],
  join(repoRoot, "docs/standard-library/openapi/reference")
);
