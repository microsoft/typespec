import { resolvePath } from "@typespec/compiler";
import { findTestPackageRoot } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { defineSpecSnaphotTests, openApiFor } from "./utils/spec-snapshot-testing.js";

const pkgRoot = await findTestPackageRoot(import.meta.url);
const specsRoot = resolvePath(pkgRoot, "node_modules", "@typespec", "http-specs", "specs");
const rootOutputDir = resolvePath(pkgRoot, "test", "http-specs", "output");
const config = {
  specDir: specsRoot,
  outputDir: rootOutputDir,
  emit: ["@typespec/openapi3"],
};

describe("http-specs convert", () => {
  defineSpecSnaphotTests(config);
});

describe("http-specs cases", () => {
  it("authentication/api-key", async () => {
    const currRoot = resolvePath(specsRoot, "authentication/api-key");
    const host = await openApiFor(
      config,
      {
        name: "authentication/api-key",
        fullPath: currRoot,
      },
      rootOutputDir,
    );
    expect(host.outputs.size).toBe(1);
    for (const [snapshotPath, content] of host.outputs.entries()) {
      const res = JSON.parse(content);
      const getThing = res.paths["/authentication/api-key/invalid"].get;
      strictEqual(getThing.operationId, "invalid");
    }
  });
});
