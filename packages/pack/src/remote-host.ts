import {
  createSourceFile,
  getAnyExtensionFromPath,
  getSourceFileKindFromExt,
  type CompilerHost,
  type SourceFile,
} from "@typespec/compiler";

export class NotUrlError extends Error {}
export function createRemoteHost(base?: CompilerHost): CompilerHost {
  return {
    getSourceFileKind: getSourceFileKindFromExt,
    getExecutionRoot() {
      return "/";
    },
    getLibDirs() {
      return [];
    },
    getJsImport: async (path: string) => {
      return {};
    },
    fileURLToPath: (path) => path,
    pathToFileURL: (path) => path,
    logSink: { log: () => {} },
    readUrl: async (url: string) => {
      const response = await fetch(url, { redirect: "follow" });
      const text = await response.text();
      return createSourceFile(text, response.url);
    },
    writeFile: async (path: string, content: string) => {},
    rm: async (path: string, options: { recursive?: boolean }) => {},
    readDir: async (): Promise<string[]> => [],
    mkdirp: async (path: string) => path,
    ...base,
    stat: async (pathOrUrl: string) => {
      if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
        const res = await fetch(pathOrUrl);

        return {
          isFile: () => res.status === 200,
          isDirectory: () => getAnyExtensionFromPath(pathOrUrl) === "",
        };
      } else if (base) {
        return base.stat(pathOrUrl);
      } else {
        throw new NotUrlError(pathOrUrl);
      }
    },
    readFile: async (pathOrUrl: string): Promise<SourceFile> => {
      if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
        const res = await fetch(pathOrUrl);
        return createSourceFile(await res.text(), pathOrUrl);
      } else if (base) {
        return base.readFile(pathOrUrl);
      } else {
        throw new NotUrlError(pathOrUrl);
      }
    },
    realpath: async (pathOrUrl: string): Promise<string> => {
      if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
        return pathOrUrl;
      } else if (base) {
        return base.realpath(pathOrUrl);
      } else {
        throw new NotUrlError(pathOrUrl);
      }
    },
  };
}
