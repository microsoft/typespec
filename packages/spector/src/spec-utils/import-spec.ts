import { type ResolveModuleHost, resolveModule } from "@typespec/compiler/module-resolver";
import { readFile, realpath, stat } from "fs/promises";
import { pathToFileURL } from "url";

export async function importTypeSpec(
  baseDir: string,
): Promise<typeof import("@typespec/compiler")> {
  return importTypeSpecLibrary("@typespec/compiler", baseDir);
}
export async function importSpecExpect(
  baseDir: string,
): Promise<typeof import("@typespec/spector")> {
  return importTypeSpecLibrary("@typespec/spector", baseDir);
}
export async function importTypeSpecRest(
  baseDir: string,
): Promise<typeof import("@typespec/rest")> {
  return importTypeSpecLibrary("@typespec/rest", baseDir);
}

export async function importTypeSpecHttp(
  baseDir: string,
): Promise<typeof import("@typespec/http")> {
  return importTypeSpecLibrary("@typespec/http", baseDir);
}

export async function importTypeSpecLibrary(name: string, baseDir: string): Promise<any> {
  try {
    const host: ResolveModuleHost = {
      realpath,
      readFile: async (path: string) => await readFile(path, "utf-8"),
      stat,
    };
    const resolved = await resolveModule(host, name, {
      baseDir,
      conditions: ["import"],
    });
    return import(
      pathToFileURL(resolved.type === "module" ? resolved.mainFile : resolved.path).toString()
    );
  } catch (err: any) {
    if (err.code === "MODULE_NOT_FOUND") {
      // Resolution from cwd failed: use current package.
      return import(name);
    } else {
      throw err;
    }
  }
}
