import { readFile } from "fs/promises";
import prettier from "prettier";
import { createDiagnosticCollector, logDiagnostics } from "../core/diagnostics.js";
import { NodePackage } from "../core/module-resolver.js";
import { NodeHost } from "../core/node-host.js";
import { joinPaths, resolvePath } from "../core/path-utils.js";
import { compile } from "../core/program.js";
import { CompilerHost, DiagnosticResult } from "../index.js";
import { generateDecoratorTSSignature } from "./decorator-gen.js";

async function generateDecoratorTSSignatureForLibrary(
  host: CompilerHost,
  libraryPath: string
): Promise<DiagnosticResult<string>> {
  const diagnostics = createDiagnosticCollector();
  const pkgJson = await readPackageJson(libraryPath);
  if (!pkgJson.tspMain) {
    throw new Error("Must have a tspMain with decorator declaration.");
  }

  const main = resolvePath(libraryPath, pkgJson.tspMain);
  const program = await compile(host, main, {
    parseOptions: { comments: true, docs: true },
  });
  const prettierConfig = await prettier.resolveConfig(libraryPath);

  const result = generateDecoratorTSSignature(program, prettierConfig ?? undefined);

  return diagnostics.wrap(result);
}

async function readPackageJson(libraryPath: string): Promise<NodePackage> {
  const buffer = await readFile(joinPaths(libraryPath, "package.json"));
  return JSON.parse(buffer.toString());
}

async function main() {
  const args = process.argv.slice(2);
  const root = args[0];
  if (root === undefined) {
    throw new Error("Must pass positional argument with library entrypoint");
  }
  const resolvedRoot = resolvePath(process.cwd(), root);

  const host = NodeHost;
  const [content, diagnostics] = await generateDecoratorTSSignatureForLibrary(host, resolvedRoot);
  if (diagnostics.length === 0) {
    await host.mkdirp(resolvePath(resolvedRoot, "definitions"));
    await host.writeFile(resolvePath(resolvedRoot, "definitions/decorators.ts"), content);
  } else {
    logDiagnostics(diagnostics, host.logSink);
  }
}

await main();
