#!/usr/bin/env node
// @ts-check
import { generateJsApiDocs, generateLibraryDocs, resolveLibraryRefDocs } from "@typespec/ref-doc";
import { renderDecoratorFile } from "@typespec/ref-doc/emitters/docusaurus";
import assert from "assert";
import { writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

// Compiler
await generateCompilerDocs();

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
  ["TypeSpec.Versioning"],
  join(repoRoot, "docs/standard-library/versioning/reference")
);

async function generateCompilerDocs() {
  const compilerPath = join(repoRoot, "packages/compiler");
  const outputDir = join(repoRoot, "docs/standard-library");
  const refDoc = await resolveLibraryRefDocs(compilerPath, ["TypeSpec"]);
  assert(refDoc, "Unexpected ref doc should have been resolved for compiler.");
  const decoratorContent = renderDecoratorFile(refDoc, { title: "Built-in Decorators" });
  assert(decoratorContent, "Unexpected decorator file shouldn't be empty for compiler.");
  await writeFile(join(outputDir, "built-in-decorators.md"), decoratorContent);

  await generateJsApiDocs(compilerPath, join(outputDir, "js-api"));
}
