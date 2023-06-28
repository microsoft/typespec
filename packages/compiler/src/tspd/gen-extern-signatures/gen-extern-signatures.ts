import prettier from "prettier";
import {
  CompilerHost,
  Decorator,
  Diagnostic,
  NodePackage,
  Program,
  compile,
  createDiagnosticCollector,
  getLocationContext,
  joinPaths,
  navigateProgram,
  resolvePath,
} from "../../core/index.js";
import { generateSignatureTests, generateSignatures } from "./decorators-signatures.js";
import { DecoratorSignature } from "./types.js";

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

  const outDir = resolvePath(libraryPath, "definitions");
  await host.mkdirp(outDir);

  const files = await generateExternDecorators(program, pkgJson.name, prettierConfig ?? undefined);
  for (const [name, content] of Object.entries(files)) {
    await host.writeFile(resolvePath(outDir, name), content);
  }
  return diagnostics.diagnostics;
}

async function readPackageJson(host: CompilerHost, libraryPath: string): Promise<NodePackage> {
  const file = await host.readFile(joinPaths(libraryPath, "package.json"));
  return JSON.parse(file.text);
}

export async function generateExternDecorators(
  program: Program,
  packageName: string,
  prettierConfig?: prettier.Options
): Promise<Record<string, string>> {
  const decorators: DecoratorSignature[] = [];

  navigateProgram(program, {
    decorator(dec) {
      if (getLocationContext(program, dec).type !== "project") {
        return;
      }
      decorators.push(resolveDecoratorSignature(dec));
    },
  });

  function format(value: string) {
    try {
      const formatted = prettier.format(value, {
        ...prettierConfig,
        parser: "typescript",
      });
      return formatted;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error formatting", e);
      return value;
    }
  }

  return {
    "decorators.ts": format(generateSignatures(program, decorators)),
    "decorators.test.ts": format(
      generateSignatureTests(packageName, "./decorators.js", decorators)
    ),
  };
}

function resolveDecoratorSignature(decorator: Decorator): DecoratorSignature {
  return {
    decorator,
    name: decorator.name,
    jsName: "$" + decorator.name.slice(1),
    typeName: decorator.name[1].toUpperCase() + decorator.name.slice(2) + "Decorator",
  };
}
