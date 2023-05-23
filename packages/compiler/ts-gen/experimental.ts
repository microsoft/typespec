import { readFile } from "fs/promises";
import { createDiagnosticCollector } from "../core/diagnostics.js";
import { NodePackage } from "../core/module-resolver.js";
import { NodeHost } from "../core/node-host.js";
import { joinPaths, resolvePath } from "../core/path-utils.js";
import { compile } from "../core/program.js";
import { generateDecoratorTSSignature } from "./decorator-gen.js";

async function generateDecoratorTSSignatureForLibrary(libraryPath: string, namespaces: string[]) {
  const diagnostics = createDiagnosticCollector();
  const pkgJson = await readPackageJson(libraryPath);
  if (!pkgJson.tspMain) {
    throw new Error("Must have a tspMain with decorator declaration.");
  }

  const main = resolvePath(libraryPath, pkgJson.tspMain);
  const program = await compile(NodeHost, main, {
    parseOptions: { comments: true, docs: true },
  });
  const result = generateDecoratorTSSignature(program, namespaces);

  return diagnostics.wrap(result);
}

async function readPackageJson(libraryPath: string): Promise<NodePackage> {
  const buffer = await readFile(joinPaths(libraryPath, "package.json"));
  return JSON.parse(buffer.toString());
}

const data = await generateDecoratorTSSignatureForLibrary(".", ["OpenAPI"]);
console.log("data\n");
console.log(data[0]);
