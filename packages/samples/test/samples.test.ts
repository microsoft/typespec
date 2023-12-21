import { resolvePath } from "@typespec/compiler";
import { findTestPackageRoot } from "@typespec/compiler/testing";
import { describe } from "vitest";
import { defineSampleSnaphotTests } from "../src/sample-snapshot-testing.js";

const excludedSamples = [
  // fails compilation by design to demo language server
  "local-typespec",
];

const pkgRoot = await findTestPackageRoot(import.meta.url);
const samplesRoot = resolvePath(pkgRoot, "specs");
const rootOutputDir = resolvePath(pkgRoot, "test/output");

describe("TypeSpec Samples", () => {
  defineSampleSnaphotTests({
    sampleDir: samplesRoot,
    outputDir: rootOutputDir,
    exclude: excludedSamples,
  });
});
