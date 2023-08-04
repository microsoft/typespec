import { resolvePath } from "@typespec/compiler";
import { fileURLToPath } from "url";
import { defineSampleSnaphotTests } from "../src/sample-snapshot-testing.js";

const excludedSamples = [
  // fails compilation by design to demo language server
  "local-typespec",
];

const pkgRoot = resolvePath(fileURLToPath(import.meta.url), "../../..");
const samplesRoot = resolvePath(pkgRoot, "specs");
const rootOutputDir = resolvePath(pkgRoot, "test/output");

describe("TypeSpec Samples", () => {
  defineSampleSnaphotTests({
    sampleDir: samplesRoot,
    outputDir: rootOutputDir,
    exclude: excludedSamples,
  });
});
