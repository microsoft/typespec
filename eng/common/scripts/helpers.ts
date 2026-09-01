import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

export const repoRoot: string = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
