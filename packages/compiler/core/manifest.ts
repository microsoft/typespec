// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import manifest from "../manifest.js";

export const typespecVersion = manifest.version;

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
