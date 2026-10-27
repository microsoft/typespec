import { resolvePath } from "@typespec/compiler";
import { findTestPackageRoot } from "@typespec/compiler/testing";
import {} from "vitest";
import { defineSampleSnaphotTests } from "../src/sample-snapshot-testing.js";

const excludedSamples = [
  // fails compilation by design to demo language server
  "local-typespec",
  // The GraphQL emitter's Alloy output is validated in its package; the playground compiles this sample.
  "emitters/graphql",
];

const pkgRoot = await findTestPackageRoot(import.meta.url);
const samplesRoot = resolvePath(pkgRoot, "specs");
const rootOutputDir = resolvePath(pkgRoot, "test/output");

defineSampleSnaphotTests({
  sampleDir: samplesRoot,
  outputDir: rootOutputDir,
  exclude: excludedSamples,
});
