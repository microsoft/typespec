#!/usr/bin/env node
// @ts-check
import { generateLibraryDocs } from "@cadl-lang/ref-doc";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

// Rest
await generateLibraryDocs(
  join(repoRoot, "packages/compiler"),
  ["Cadl"],
  join(repoRoot, "docs/compiler/reference")
);

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
