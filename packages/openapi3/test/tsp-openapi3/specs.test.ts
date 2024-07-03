import { resolvePath } from "@typespec/compiler";
import { findTestPackageRoot } from "@typespec/compiler/testing";
import { describe } from "vitest";
import { defineSpecSnaphotTests } from "./utils/spec-snapshot-testing.js";

const pkgRoot = await findTestPackageRoot(import.meta.url);
const specsRoot = resolvePath(pkgRoot, "test", "tsp-openapi3", "specs");
const rootOutputDir = resolvePath(pkgRoot, "test", "tsp-openapi3", "output");

describe("tsp-openapi3 convert", () => {
  defineSpecSnaphotTests({
    specDir: specsRoot,
    outputDir: rootOutputDir,
  });
});
