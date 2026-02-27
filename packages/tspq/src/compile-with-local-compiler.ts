import { normalizePath, type Program } from "@typespec/compiler";
import { resolveModule, type ResolveModuleHost } from "@typespec/compiler/module-resolver";
import { readFile, realpath, stat } from "fs/promises";
import { dirname } from "path";
import { pathToFileURL } from "url";

export async function compileWithLocalCompiler(entrypoint: string): Promise<Program> {
  const entrypointPath = normalizePath(entrypoint);
  const compiler = await importTypeSpecCompiler(dirname(entrypointPath));
  const resolved = compiler.resolvePath(entrypointPath);
  const program = await compiler.compile(compiler.NodeHost, resolved, { noEmit: true });
  return program;
}

async function importTypeSpecCompiler(
  baseDir: string,
): Promise<typeof import("@typespec/compiler")> {
  try {
    const host: ResolveModuleHost = {
      realpath,
      readFile: async (path: string) => await readFile(path, "utf-8"),
      stat,
    };
    const resolved = await resolveModule(host, "@typespec/compiler", {
      baseDir,
      conditions: ["import"],
    });
    return await import(
      pathToFileURL(resolved.type === "module" ? resolved.mainFile : resolved.path).toString()
    );
  } catch (err: any) {
    if (err.code === "MODULE_NOT_FOUND") {
      return await import("@typespec/compiler");
    }
    throw err;
  }
}
