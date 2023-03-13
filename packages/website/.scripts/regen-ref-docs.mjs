#!/usr/bin/env node
// @ts-check
import { generateLibraryDocs } from "@typespec/ref-doc";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

// Rest
await generateLibraryDocs(
  join(repoRoot, "packages/compiler"),
  ["TypeSpec"],
  join(repoRoot, "docs/compiler/reference")
);

// Http
await generateLibraryDocs(
  join(repoRoot, "packages/http"),
  ["TypeSpec.Http"],
  join(repoRoot, "docs/standard-library/http/reference")
);

// Rest
await generateLibraryDocs(
  join(repoRoot, "packages/rest"),
  ["TypeSpec.Rest", "TypeSpec.Rest.Resource"],
  join(repoRoot, "docs/standard-library/rest/reference")
);

// OpenAPI
await generateLibraryDocs(
  join(repoRoot, "packages/openapi"),
  ["OpenAPI"],
  join(repoRoot, "docs/standard-library/openapi/reference")
);

// Versioning
await generateLibraryDocs(
  join(repoRoot, "packages/versioning"),
  ["Versioning"],
  join(repoRoot, "docs/standard-library/versioning/reference")
);
