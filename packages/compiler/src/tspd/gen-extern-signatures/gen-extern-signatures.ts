import prettier from "prettier";
import {
  CompilerHost,
  Diagnostic,
  NodePackage,
  compile,
  createDiagnosticCollector,
  joinPaths,
  resolvePath,
} from "../../core/index.js";
import { generateDecoratorTSSignaturesFile } from "./decorators-signatures.js";

export async function generateExternSignatures(
  host: CompilerHost,
  libraryPath: string
): Promise<readonly Diagnostic[]> {
  const diagnostics = createDiagnosticCollector();
  const pkgJson = await readPackageJson(host, libraryPath);
  if (!pkgJson.tspMain) {
    throw new Error("Must have a tspMain with decorator declaration.");
  }

  const main = resolvePath(libraryPath, pkgJson.tspMain);
  const program = await compile(host, main, {
    parseOptions: { comments: true, docs: true },
  });
  const prettierConfig = await prettier.resolveConfig(libraryPath);

  const content = generateDecoratorTSSignaturesFile(program, prettierConfig ?? undefined);

  if (diagnostics.diagnostics.length === 0) {
    await host.mkdirp(resolvePath(libraryPath, "definitions"));
    await host.writeFile(resolvePath(libraryPath, "definitions/decorators.ts"), content);
  }
  return diagnostics.diagnostics;
}

async function readPackageJson(host: CompilerHost, libraryPath: string): Promise<NodePackage> {
  const file = await host.readFile(joinPaths(libraryPath, "package.json"));
  return JSON.parse(file.text);
}
