import { readdir } from "fs/promises";
import { dirname } from "path";
import { join, resolve } from "path/posix";
import { fileURLToPath } from "url";

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templateDir = "templates";

function isEnoentError(e: unknown): e is { code: "ENOENT" } {
  return typeof e === "object" && e !== null && "code" in e;
}

async function readFilesInDirRecursively(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (isEnoentError(e)) {
      return [];
    } else {
      throw new Error(`Failed to read dir "${dir}"\n Error: ${e}`);
    }
  }
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      for (const file of await readFilesInDirRecursively(resolve(dir, entry.name))) {
        files.push(join(entry.name, file));
      }
    } else {
      files.push(entry.name);
    }
  }
  return files;
}

export function localFile(templateName: string, path: string): any {
  const destination = path.endsWith(".mu") ? path.slice(0, -3) : path;
  return { path: join(templateName, path), destination };
}

export async function localDir(templateName: string): Promise<any[]> {
  const files = await readFilesInDirRecursively(resolve(templateDir, templateName));
  return files.map((f) => localFile(templateName, f));
}
