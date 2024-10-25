import { NodeHost, joinPaths, logDiagnostics } from "@typespec/compiler";
import { generateJsApiDocs, resolveLibraryRefDocsBase } from "@typespec/tspd/ref-doc";
import {
  DocusaurusRenderer,
  renderDataTypes,
  renderDecoratorFile,
} from "@typespec/tspd/ref-doc/emitters/docusaurus";

import assert from "assert";
import { writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const diagnostics = new Map();

class CompilerDocusaurusRenderer extends DocusaurusRenderer {
  /**
   * @param {import("../../tspd/dist/src/ref-doc/types.js").RefDocEntity} type
   */
  filename(type) {
    switch (type.kind) {
      case "decorator":
        return "./built-in-decorators.md";
      case "model":
      case "enum":
      case "union":
        return "./built-in-data-types.md";
      case "operation":
      case "interface":
      default:
        return "";
    }
  }
}

// Compiler
const compilerDiag = await generateCompilerDocs();
if (compilerDiag.length) {
  diagnostics.set("@typespec/compiler", compilerDiag);
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
  const results = await resolveLibraryRefDocsBase(compilerPath, {
    namespaces: { include: ["TypeSpec"] },
  });
  assert(results, "Unexpected ref doc should have been resolved for compiler.");
  const [refDoc, diagnostics] = results;
  const renderer = new CompilerDocusaurusRenderer(refDoc as any);
  const decoratorContent = renderDecoratorFile(renderer, refDoc, { title: "Built-in Decorators" });
  assert(decoratorContent, "Unexpected decorator file shouldn't be empty for compiler.");
  await writeFile(join(outputDir, "built-in-decorators.md"), decoratorContent);
  const dataTypeContent = renderDataTypes(renderer, refDoc as any, {
    title: "Built-in Data types",
  });
  assert(dataTypeContent, "Unexpected data type file shouldn't be empty for compiler.");
  await writeFile(join(outputDir, "built-in-data-types.md"), dataTypeContent);

  await generateJsApiDocs(joinPaths(compilerPath), join(outputDir, "reference/js-api"));
  return diagnostics;
}
