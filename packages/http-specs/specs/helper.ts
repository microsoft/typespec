import { resolvePath } from "@typespec/compiler";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const root = resolvePath(fileURLToPath(import.meta.url), "../../../");

export const pngFile = readFileSync(resolvePath(root, "assets/image.png"));
export const jpgFile = readFileSync(resolvePath(root, "assets/image.jpg"));
