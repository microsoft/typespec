import {
  createSourceFile,
  getAnyExtensionFromPath,
  getSourceFileKindFromExt,
  type CompilerHost,
} from "@typespec/compiler";

export class NotUrlError extends Error {}
export function createRemoteHost(base?: CompilerHost): CompilerHost {
  return {
    getSourceFileKind: getSourceFileKindFromExt,
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
    readFile: async (pathOrUrl: string) => {
      if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
        const res = await fetch(pathOrUrl);
        return createSourceFile(await res.text(), pathOrUrl);
      } else if (base) {
        return base.stat(pathOrUrl);
      } else {
        throw new NotUrlError(pathOrUrl);
      }
    },
    realpath: async (pathOrUrl: string) => {
      if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
        return pathOrUrl;
      } else if (base) {
        return base.stat(pathOrUrl);
      } else {
        throw new NotUrlError(pathOrUrl);
      }
    },
  } as any;
}
