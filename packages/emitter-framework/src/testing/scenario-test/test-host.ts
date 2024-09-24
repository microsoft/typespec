import { CompilerOptions, Diagnostic } from "@typespec/compiler";
import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  TestHostConfig,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";
import { RestTestLibrary } from "@typespec/rest/testing";
import { join, relative } from "path";

export interface EmittedFile {
  path: string;
  content: string;
}

async function createEmitterTestRunner(
  testLibrary: TypeSpecTestLibrary,
  options: {
    testHostConfig?: TestHostConfig;
    autoImports?: string[];
    autoUsings?: string[];
    compilerOptions?: CompilerOptions;
  } = {}
) {
  const libraries = options.testHostConfig?.libraries ?? [
    testLibrary,
    HttpTestLibrary,
    RestTestLibrary,
  ];
  const host = await createTestHost({ libraries });

  return createTestWrapper(host, {
    autoImports: options.autoImports ?? ["@typespec/http", "@typespec/rest"],
    autoUsings: options.autoUsings ?? ["TypeSpec.Http", "TypeSpec.Rest"],
    compilerOptions: options.compilerOptions ?? {
      noEmit: false,
      emit: [testLibrary.name],
    },
  });
}

export async function emitWithDiagnostics(
  testLibrary: TypeSpecTestLibrary,
  emitterOutputDir: string,
  code: string
): Promise<[EmittedFile[], readonly Diagnostic[]]> {
  const runner = await createEmitterTestRunner(testLibrary);
  await runner.compileAndDiagnose(code, {
    outputDir: "tsp-output",
  });
  const result = await readFilesRecursively(emitterOutputDir, emitterOutputDir, runner);
  return [result, runner.program.diagnostics];
}

async function readFilesRecursively(
  currentDir: string,
  emitterOutputDir: string,
  runner: BasicTestRunner
): Promise<EmittedFile[]> {
  const entries = await runner.program.host.readDir(currentDir);
  const result: EmittedFile[] = [];

  for (const entry of entries) {
    const fullPath = join(currentDir, entry);
    const stat = await runner.program.host.stat(fullPath);

    if (stat.isDirectory()) {
      // Recursively read files in the directory
      const nestedFiles = await readFilesRecursively(fullPath, emitterOutputDir, runner);
      result.push(...nestedFiles);
    } else if (stat.isFile()) {
      // Read the file
      // Read the file and store it with a relative path
      const relativePath = relative(emitterOutputDir, fullPath);
      const fileContent = await runner.program.host.readFile(fullPath);
      result.push({ path: relativePath, content: fileContent.text });
    }
  }

  return result;
}
