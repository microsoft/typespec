import { writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import lang from "./typespec-monarch.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
await writeFile(resolve(root, "out", "typespec-monarch.json"), JSON.stringify(lang, null, 2));
