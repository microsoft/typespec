#!/usr/bin/env node
// @ts-check
import { join } from "path";
import { generateLibraryDocs } from "../../packages/ref-doc/dist/src/index.js";
import { repoRoot } from "./helpers.js";

// Rest
await generateLibraryDocs(
  join(repoRoot, "packages/rest"),
  ["Cadl.Http", "Cadl.Rest", "Cadl.Rest.Resource"],
  join(repoRoot, "docs/standard-library/rest/reference")
);

// OpenAPI
await generateLibraryDocs(
  join(repoRoot, "packages/openapi"),
  ["OpenAPI"],
  join(repoRoot, "docs/standard-library/openapi/reference")
);
