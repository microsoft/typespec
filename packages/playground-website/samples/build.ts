// @ts-check
import { buildPlaygroundSamples } from "@typespec/samples";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

await buildPlaygroundSamples({
  specsDir: resolve(packageRoot, "../samples/specs"),
  outputFile: resolve(__dirname, "dist/samples.ts"),
  relativeTo: packageRoot,
  defaultEmitter: "@typespec/openapi3",
});
