import { resolvePath } from "../src/index.js";
import { InitTemplate } from "../src/init/init-template.js";
import { MANIFEST } from "../src/manifest.js";

import { readdir } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";

const templateDir = resolvePath(dirname(fileURLToPath(import.meta.url)), "..", "..", "templates");

function localFile(templateName: string, path: string) {
  return { path: resolvePath(templateDir, templateName, path), destination: path };
}

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
      for (const file of await readFilesInDirRecursively(resolvePath(dir, entry.name))) {
        files.push(resolvePath(entry.name, file));
      }
    } else {
      files.push(entry.name);
    }
  }
  return files;
}

async function localDir(templateName: string) {
  const files = await readFilesInDirRecursively(resolvePath(templateDir, templateName));
  return files.map((f) => localFile(templateName, f));
}

export const builtInTemplates: Record<string, InitTemplate> = {
  empty: {
    title: "Empty project",
    description: "Create an empty project.",
    libraries: [],
    compilerVersion: MANIFEST.version,
  },
  rest: {
    title: "Generic Rest API",
    description: "Create a project representing a generic Rest API",
    compilerVersion: MANIFEST.version,
    libraries: ["@typespec/http", "@typespec/rest", "@typespec/openapi3"],
    config: {
      emit: ["@typespec/openapi3"],
    },
  },
  "emitter-ts": {
    title: "TypeSpec Emitter (With TypeScript)",
    description: "Create a new package that will be emitting typespec",
    compilerVersion: MANIFEST.version,
    libraries: [],
    config: undefined,
    files: await localDir("emitter-ts"),
  },
};
