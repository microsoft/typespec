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

// Rest
await generateLibraryDocs(
  join(repoRoot, "packages/rest"),
  ["TypeSpec.Http", "TypeSpec.Rest", "TypeSpec.Rest.Resource"],
  join(repoRoot, "docs/standard-library/rest/reference")
);

// OpenAPI
await generateLibraryDocs(
  join(repoRoot, "packages/openapi"),
  ["OpenAPI"],
  join(repoRoot, "docs/standard-library/openapi/reference")
);

await generateLibraryDocs(
  join(repoRoot, "packages/protobuf"),
  ["Cadl.Protobuf"],
  join(repoRoot, "docs/standard-library/protobuf/reference")
);
