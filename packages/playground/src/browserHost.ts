import {
  CompilerHost,
  createSourceFile,
  decorators,
  resolvePath,
  service,
} from "@cadl-lang/compiler";
import * as openapi from "@cadl-lang/openapi";
import * as openapi3 from "@cadl-lang/openapi3";
import { http, internalDecorators, resource, rest, route } from "@cadl-lang/rest";
import * as versioning from "@cadl-lang/versioning";
import cadlContentsString from "../dist-dev/cadlContents.json?raw";

const cadlContents: Record<string, string> = JSON.parse(cadlContentsString);

export interface BrowserHost extends CompilerHost {
  unlink(path: string): Promise<void>;
}

export function resolveVirtualPath(path: string, ...paths: string[]) {
  return resolvePath("/test", path, ...paths);
}

export async function createBrowserHost(): Promise<BrowserHost> {
  const virtualFs = new Map<string, string>();
  const jsImports = new Map<string, Promise<any>>();
  addJsImport("/test/.cadl/dist/lib/decorators.js", decorators);
  addJsImport("/test/.cadl/dist/lib/service.js", service);
  addJsImport("/test/node_modules/@cadl-lang/rest/dist/src/rest.js", rest);
  addJsImport("/test/node_modules/@cadl-lang/rest/dist/src/route.js", route);
  addJsImport("/test/node_modules/@cadl-lang/rest/dist/src/http.js", http);
  addJsImport(
    "/test/node_modules/@cadl-lang/rest/dist/src/internal-decorators.js",
    internalDecorators
  );
  addJsImport("/test/node_modules/@cadl-lang/rest/dist/src/resource.js", resource);
  addJsImport("/test/node_modules/@cadl-lang/openapi/dist/src/index.js", openapi);
  addJsImport("/test/node_modules/@cadl-lang/openapi3/dist/src/index.js", openapi3);
  addJsImport("/test/node_modules/@cadl-lang/versioning/dist/src/versioning.js", versioning);

  for (const [key, value] of Object.entries(cadlContents)) {
    virtualFs.set(key, value);
  }
  function addJsImport(path: string, value: any) {
    virtualFs.set(path, "");
    jsImports.set(path, value);
  }
  return {
    async readUrl(url: string) {
      const contents = virtualFs.get(url);
      if (contents === undefined) {
        const e = new Error(`File ${url} not found.`);
        (e as any).code = "ENOENT";
        throw e;
      }
      return createSourceFile(contents, url);
    },
    async readFile(path: string) {
      path = resolveVirtualPath(path);
      const contents = virtualFs.get(path);
      if (contents === undefined) {
        const e = new Error(`File ${path} not found.`);
        (e as any).code = "ENOENT";
        throw e;
      }
      return createSourceFile(contents, path);
    },

    async writeFile(path: string, content: string) {
      path = resolveVirtualPath(path);
      virtualFs.set(path, content);
    },

    async readDir(path: string) {
      path = resolveVirtualPath(path);
      return [...virtualFs.keys()]
        .filter((x) => x.startsWith(`${path}/`))
        .map((x) => x.replace(`${path}/`, ""));
    },

    async removeDir(path: string) {
      path = resolveVirtualPath(path);

      for (const key of virtualFs.keys()) {
        if (key.startsWith(`${path}/`)) {
          virtualFs.delete(key);
        }
      }
    },

    getLibDirs() {
      return [resolveVirtualPath(".cadl/lib")];
    },

    getExecutionRoot() {
      return resolveVirtualPath(".cadl");
    },

    async getJsImport(path) {
      path = resolveVirtualPath(path);
      const module = await jsImports.get(path);
      if (module === undefined) {
        const e = new Error(`Module ${path} not found`);
        (e as any).code = "MODULE_NOT_FOUND";
        throw e;
      }
      return module;
    },

    async stat(path: string) {
      path = resolveVirtualPath(path);

      if (virtualFs.has(path)) {
        return {
          isDirectory() {
            return false;
          },
          isFile() {
            return true;
          },
        };
      }

      for (const fsPath of virtualFs.keys()) {
        if (fsPath.startsWith(path) && fsPath !== path) {
          return {
            isDirectory() {
              return true;
            },
            isFile() {
              return false;
            },
          };
        }
      }
      const e = new Error(`File ${path} not found.`);
      (e as any).code = "ENOENT";
      throw e;
    },

    // symlinks not supported in test-host
    async realpath(path) {
      return path;
    },

    async unlink(path) {
      path = resolveVirtualPath(path);
      virtualFs.delete(path);
    },

    logSink: console,
    mkdirp: async (path: string) => path,
    fileURLToPath(path) {
      return path.replace("inmemory:/", "");
    },
    pathToFileURL(path) {
      return "inmemory:/" + resolveVirtualPath(path);
    },
  };
}
