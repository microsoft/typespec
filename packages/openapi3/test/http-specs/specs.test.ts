import { resolvePath } from "@typespec/compiler";
import { findTestPackageRoot } from "@typespec/compiler/testing";
import { describe } from "vitest";
import { defineSpecSnaphotTests } from "./utils/spec-snapshot-testing.js";

const pkgRoot = await findTestPackageRoot(import.meta.url);
const specsRoot = resolvePath(pkgRoot, "node_modules", "@typespec", "http-specs", "specs");
const rootOutputDir = resolvePath(pkgRoot, "test", "http-specs", "output");

describe("http-specs convert", () => {
  defineSpecSnaphotTests({
    specDir: specsRoot,
    outputDir: rootOutputDir,
  });
});
