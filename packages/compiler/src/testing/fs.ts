import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";
import { pathToFileURL } from "url";
import { getAnyExtensionFromPath, resolvePath } from "../core/path-utils.js";
import { createStringMap } from "../utils/misc.js";
import { createTestCompilerHost, TestHostOptions } from "./test-compiler-host.js";
import { findFilesFromPattern } from "./test-host.js";
import type { JsFile, MockFile, TestFileSystem, TypeSpecTestLibrary } from "./types.js";

export function resolveVirtualPath(path: string, ...paths: string[]) {
  // NB: We should always resolve an absolute path, and there is no absolute
  // path that works across OSes. This ensures that we can still rely on API
  // like pathToFileURL in tests.
  const rootDir = process.platform === "win32" ? "Z:/test" : "/test";
  return resolvePath(rootDir, path, ...paths);
}

/**
 * Constructor for various mock files.
 */
export const mockFile = {
  /** Define a JS file with the given named exports */
  js: (exports: Record<string, unknown>): JsFile => {
    return { kind: "js", exports };
  },
};

export function createTestFileSystem(options?: TestHostOptions): TestFileSystem {
  const virtualFs = createStringMap<string>(!!options?.caseInsensitiveFileSystem);
  const jsImports = createStringMap<Promise<any>>(!!options?.caseInsensitiveFileSystem);
  return createTestFileSystemInternal(virtualFs, jsImports, options);
}

function createTestFileSystemInternal(
  virtualFs: Map<string, string>,
  jsImports: Map<string, Record<string, any>>,
  options?: TestHostOptions,
): TestFileSystem {
  const compilerHost = createTestCompilerHost(virtualFs, jsImports, options);

  let frozen = false;
  return {
    add,
    addTypeSpecFile,
    addJsFile,
    addRealTypeSpecFile,
    addRealJsFile,
    addRealFolder,
    addTypeSpecLibrary,
    fs: virtualFs,
    compilerHost,
    freeze,
    clone,
  };

  function assertNotFrozen() {
    if (frozen) {
      throw new Error("Cannot modify the file system after it has been frozen.");
    }
  }

  function add(path: string, contents: MockFile) {
    assertNotFrozen();
    if (typeof contents === "string") {
      addRaw(path, contents);
    } else {
      addJsFile(path, contents.exports);
    }
  }

  function addRaw(path: string, contents: string) {
    assertNotFrozen();
    virtualFs.set(resolveVirtualPath(path), contents);
  }

  function addJsFile(path: string, contents: Record<string, any>) {
    assertNotFrozen();

    const key = resolveVirtualPath(path);
    virtualFs.set(key, ""); // don't need contents
    jsImports.set(key, new Promise((r) => r(contents)));
  }

  function addTypeSpecFile(path: string, contents: string) {
    assertNotFrozen();
    virtualFs.set(resolveVirtualPath(path), contents);
  }

  async function addRealTypeSpecFile(path: string, existingPath: string) {
    assertNotFrozen();

    virtualFs.set(resolveVirtualPath(path), await readFile(existingPath, "utf8"));
  }

  async function addRealFolder(folder: string, existingFolder: string) {
    assertNotFrozen();

    const entries = await readdir(existingFolder);
    for (const entry of entries) {
      const existingPath = join(existingFolder, entry);
      const virtualPath = join(folder, entry);
      const s = await stat(existingPath);
      if (s.isFile()) {
        if (existingPath.endsWith(".js")) {
          await addRealJsFile(virtualPath, existingPath);
        } else {
          await addRealTypeSpecFile(virtualPath, existingPath);
        }
      }
      if (s.isDirectory()) {
        await addRealFolder(virtualPath, existingPath);
      }
    }
  }

  async function addRealJsFile(path: string, existingPath: string) {
    assertNotFrozen();

    const key = resolveVirtualPath(path);
    const exports = await import(pathToFileURL(existingPath).href);

    virtualFs.set(key, "");
    jsImports.set(key, exports);
  }

  async function addTypeSpecLibrary(testLibrary: TypeSpecTestLibrary) {
    assertNotFrozen();

    for (const { realDir, pattern, virtualPath } of testLibrary.files) {
      const lookupDir = resolvePath(testLibrary.packageRoot, realDir);
      const entries = await findFilesFromPattern(lookupDir, pattern);
      for (const entry of entries) {
        const fileRealPath = resolvePath(lookupDir, entry);
        const fileVirtualPath = resolveVirtualPath(virtualPath, entry);
        switch (getAnyExtensionFromPath(fileRealPath)) {
          case ".tsp":
          case ".json":
            const contents = await readFile(fileRealPath, "utf-8");
            addTypeSpecFile(fileVirtualPath, contents);
            break;
          case ".js":
          case ".mjs":
            await addRealJsFile(fileVirtualPath, fileRealPath);
            break;
        }
      }
    }
  }
  function freeze() {
    frozen = true;
  }

  function clone() {
    return createTestFileSystemInternal(new Map(virtualFs), new Map(jsImports), options);
  }
}
