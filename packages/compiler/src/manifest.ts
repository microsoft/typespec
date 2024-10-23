let manifest;
try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  manifest = (await import("../manifest.js")).default;
} catch {
  const name = "../dist/manifest.js";
  manifest = (await import(/* @vite-ignore */ /* webpackIgnore: true */ name)).default;
}

export const typespecVersion = manifest.version;

/** @deprecated Use typespecVersion */
export const cadlVersion = typespecVersion;

/** @deprecated Use TypeSpecManifest */
export type CadlManifest = TypeSpecManifest;

export interface TypeSpecManifest {
  /**
   * Version of the tsp compiler.
   */
  version: string;

  /**
   * Full commit sha.
   */
  commit: string;

  /**
   * Number of the pull request, if the build was from a pull request.
   */
  pr?: number;
}

export const MANIFEST: TypeSpecManifest = manifest;
