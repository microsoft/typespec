import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

export const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const storageAccountName = "tsppackages";
export const pkgsContainer = "pkgs";
