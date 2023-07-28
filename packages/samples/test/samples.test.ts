import { resolvePath } from "@typespec/compiler";
import { fileURLToPath } from "url";
import { defineSampleSnaphotTests } from "../src/sample-snapshot-testing.js";

const excludedSamples = [
  // fails compilation by design to demo language server
  "local-typespec",

  // no actual samples in these dirs
  "node_modules",
  "dist",
  "scratch",
  "scripts",
  "test",
  ".rush",
];

const samplesRoot = resolvePath(fileURLToPath(import.meta.url), "../../..");
const rootOutputDir = resolvePath(samplesRoot, "test/output");

describe("TypeSpec Samples", () => {
  defineSampleSnaphotTests({
    sampleDir: samplesRoot,
    outputDir: rootOutputDir,
    exclude: excludedSamples,
  });
});
