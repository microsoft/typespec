import { readFile, realpath, stat } from "fs/promises";
import { pathToFileURL } from "url";
import { ResolveModuleHost, resolveModule } from "./module-resolver.js";

export async function importTypeSpec(
  baseDir: string,
): Promise<typeof import("@typespec/compiler")> {
  return importTypeSpecLibrary("@typespec/compiler", baseDir);
}
export async function importSpecExpect(
  baseDir: string,
): Promise<typeof import("@typespec/spec-lib")> {
  return importTypeSpecLibrary("@typespec/spec-lib", baseDir);
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
    });
    return import(pathToFileURL(resolved).toString());
  } catch (err: any) {
    if (err.code === "MODULE_NOT_FOUND") {
      // Resolution from cwd failed: use current package.
      return import(name);
    } else {
      throw err;
    }
  }
}
