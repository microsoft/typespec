import { renderAsync, type Children } from "@alloy-js/core";
import {
  emitFile,
  joinPaths,
  Program,
  resolveCompilerOptions,
  resolvePath,
  type EmitContext,
} from "@typespec/compiler";
import type { CSharpServiceEmitterOptions } from "./lib.js";

/**
 * Custom write function that respects the overwrite option.
 * Files in the "generated/" directory are always written.
 * Other files (scaffolding, mocks, project files) are only written if they don't exist or overwrite is true.
 */
export async function writeOutputWithOverwrite(
  program: Program,
  rootComponent: Children,
  emitterOutputDir: string,
  overwrite: boolean,
): Promise<void> {
  const tree = await renderAsync(rootComponent);
  await writeOutputDir(program, tree, emitterOutputDir, overwrite);
}

async function writeOutputDir(
  program: Program,
  dir: { contents: any[] },
  emitterOutputDir: string,
  overwrite: boolean,
): Promise<void> {
  for (const sub of dir.contents) {
    if ("contents" in sub) {
      if (Array.isArray(sub.contents)) {
        await writeOutputDir(program, sub, emitterOutputDir, overwrite);
      } else {
        const filePath = joinPaths(emitterOutputDir, sub.path);
        // Files in "generated/" are always written; others respect overwrite option
        const isGenerated = sub.path.includes("generated/") || sub.path.startsWith("generated");
        if (isGenerated || overwrite || !(await fileExists(program, filePath))) {
          await emitFile(program, {
            content: sub.contents,
            path: filePath,
          });
        }
      }
    }
  }
}

async function fileExists(program: Program, path: string): Promise<boolean> {
  try {
    await program.host.stat(path);
    return true;
  } catch {
    return false;
  }
}

function normalizeSlashes(p: string): string {
  return p.replaceAll("\\", "/");
}

export async function resolveOpenApiPath(
  context: EmitContext<CSharpServiceEmitterOptions>,
): Promise<string | undefined> {
  const root = context.program.projectRoot;
  try {
    const [resolvedOptions] = await resolveCompilerOptions(context.program.host, {
      cwd: root,
      entrypoint: resolvePath(root, "main.tsp"),
    });
    const oaiOptions =
      resolvedOptions.options && Object.keys(resolvedOptions.options).includes("@typespec/openapi3")
        ? resolvedOptions.options["@typespec/openapi3"]
        : undefined;

    const emitted =
      resolvedOptions.emit !== undefined && resolvedOptions.emit.includes("@typespec/openapi3");
    const outputDir: string | undefined = oaiOptions?.["emitter-output-dir"];
    const fileName: string | undefined = oaiOptions?.["output-file"] as any;

    // Use emitterOutputDir resolved as absolute path
    const projectDir = resolvePath(root, context.emitterOutputDir);

    if (outputDir) {
      const openApiFullPath = resolvePath(outputDir, fileName || "openapi.yaml");
      const pathModule = await import("path");
      return normalizeSlashes(pathModule.relative(projectDir, openApiFullPath));
    }
    if (emitted) {
      const baseDir = context.program.compilerOptions.outputDir || resolvePath(root, "tsp-output");
      const openApiFullPath = resolvePath(
        baseDir,
        "@typespec",
        "openapi3",
        fileName || "openapi.yaml",
      );
      const pathModule = await import("path");
      return normalizeSlashes(pathModule.relative(projectDir, openApiFullPath));
    }
  } catch {
    // Config resolution failed, fall through
  }
  return undefined;
}
