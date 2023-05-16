#!/usr/bin/env node
// @ts-check
import { NodeHost, logDiagnostics } from "@typespec/compiler";
import {
  generateJsApiDocs,
  generateLibraryDocs,
  resolveLibraryRefDocsBase,
} from "@typespec/ref-doc";
import { renderDecoratorFile } from "@typespec/ref-doc/emitters/docusaurus";
import assert from "assert";
import { writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const diagnostics = new Map();

// Compiler
const compilerDiag = await generateCompilerDocs();
if (compilerDiag.length) {
  diagnostics.set("@typespec/compiler", compilerDiag);
}

// Http
const httpDiag = await generateLibraryDocs(
  join(repoRoot, "packages/http"),
  ["TypeSpec.Http"],
  join(repoRoot, "docs/standard-library/http/reference")
);
if (httpDiag.length) {
  diagnostics.set("@typespec/http", httpDiag);
}

// Rest
const restDiag = await generateLibraryDocs(
  join(repoRoot, "packages/rest"),
  ["TypeSpec.Rest", "TypeSpec.Rest.Resource"],
  join(repoRoot, "docs/standard-library/rest/reference")
);
if (restDiag.length) {
  diagnostics.set("@typespec/rest", restDiag);
}

// OpenAPI
const openapiDiag = await generateLibraryDocs(
  join(repoRoot, "packages/openapi"),
  ["OpenAPI"],
  join(repoRoot, "docs/standard-library/openapi/reference")
);
if (openapiDiag.length) {
  diagnostics.set("@typespec/openapi", openapiDiag);
}

// OpenAPI3
const openapi3Diag = await generateLibraryDocs(
  join(repoRoot, "packages/openapi3"),
  ["OpenAPI"],
  join(repoRoot, "docs/standard-library/openapi3/reference"),
  true
);
if (openapi3Diag.length) {
  diagnostics.set("@typespec/openapi3", openapi3Diag);
}

// Protobuf
const protobufDiag = await generateLibraryDocs(
  join(repoRoot, "packages/protobuf"),
  ["TypeSpec.Protobuf"],
  join(repoRoot, "docs/standard-library/protobuf/reference")
);
if (protobufDiag.length) {
  diagnostics.set("@typespec/protobuf", protobufDiag);
}

// Versioning
const versioningDiag = await generateLibraryDocs(
  join(repoRoot, "packages/versioning"),
  ["TypeSpec.Versioning"],
  join(repoRoot, "docs/standard-library/versioning/reference")
);
if (versioningDiag.length) {
  diagnostics.set("@typespec/versioning", versioningDiag);
}

let exitCode = 0;
// Log the diagnostics
for (const pkg of diagnostics.keys()) {
  console.log(`\nIssues in ${pkg}:`);
  const diags = diagnostics.get(pkg);
  logDiagnostics(diags, NodeHost.logSink);
  exitCode = 1;
}
process.exit(exitCode);

async function generateCompilerDocs() {
  const compilerPath = join(repoRoot, "packages/compiler");
  const outputDir = join(repoRoot, "docs/standard-library");
  const results = await resolveLibraryRefDocsBase(compilerPath, ["TypeSpec"]);
  assert(results, "Unexpected ref doc should have been resolved for compiler.");
  const [refDoc, diagnostics] = results;
  const decoratorContent = renderDecoratorFile(refDoc, { title: "Built-in Decorators" });
  assert(decoratorContent, "Unexpected decorator file shouldn't be empty for compiler.");
  await writeFile(join(outputDir, "built-in-decorators.md"), decoratorContent);

  await generateJsApiDocs(compilerPath, join(outputDir, "reference/js-api"));
  return diagnostics;
}
