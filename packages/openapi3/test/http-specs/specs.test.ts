import { resolvePath } from "@typespec/compiler";
import { findTestPackageRoot } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { worksFor } from "./../works-for.js";
import { defineSpecSnaphotTests } from "./utils/spec-snapshot-testing.js";

const pkgRoot = await findTestPackageRoot(import.meta.url);
const specsRoot = resolvePath(pkgRoot, "node_modules", "@typespec", "http-specs", "specs");
const config = {
  specDir: specsRoot,
};

describe("http-specs convert", () => {
  defineSpecSnaphotTests(config);
});

describe("http-specs cases", () => {
  worksFor(["3.0.0", "3.1.0"], ({ openApiForFile }) => {
    it("authentication/api-key", async () => {
      const curr = {
        name: "authentication/api-key",
        fullPath: resolvePath(specsRoot, "authentication/api-key"),
      };
      const results = await openApiForFile(curr);
      const res = Object.values(results)[0] as any;
      const getThing = res.paths["/authentication/api-key/invalid"].get;
      strictEqual(getThing.operationId, "invalid");
    });
  });
});
