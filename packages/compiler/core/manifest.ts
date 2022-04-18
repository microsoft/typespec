// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import manifest from "../manifest.js";

export const cadlVersion = manifest.version;

export const MANIFEST = {
  version: manifest.version,
  commit: manifest.commit,
};
