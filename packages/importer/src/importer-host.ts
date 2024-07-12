import { createSourceFile, NodeHost, type CompilerHost } from "@typespec/compiler";

/**
 * Special host that tries to load data from additional locations
 */
export const ImporterHost: CompilerHost = {
  ...NodeHost,
  stat: async (pathOrUrl) => {
    console.log("State", pathOrUrl);
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
      const res = await fetch(pathOrUrl);
      console.log("Res", res);

      return {
        isFile: () => res.status === 200,
        isDirectory: () => false,
      };
    }
    return NodeHost.stat(pathOrUrl);
  },
  readFile: async (pathOrUrl) => {
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
      const res = await fetch(pathOrUrl);
      return createSourceFile(await res.text(), pathOrUrl);
    }
    return NodeHost.readFile(pathOrUrl);
  },
};
