import { resolvePath } from "@typespec/compiler";
import { findTestPackageRoot } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { worksFor } from "./../works-for.js";
import { defineSpecTests } from "./utils/spec-snapshot-testing.js";

const pkgRoot = await findTestPackageRoot(import.meta.url);
const specsRoot = resolvePath(pkgRoot, "node_modules", "@typespec", "http-specs", "specs");

describe("http-specs convert", () => {
  defineSpecTests({
    specDir: specsRoot,
    exclude: ["parameters/collection-format", "payload/xml", "routes"],
  });
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

    it("versioning/added", async () => {
      const curr = {
        name: "versioning/added",
        fullPath: resolvePath(specsRoot, "versioning/added"),
      };
      const results = await openApiForFile(curr);
      const v1 = Object.values(results)[0] as any;
      strictEqual(v1.info.version, "v1");

      const v2 = Object.values(results)[1] as any;
      strictEqual(v2.info.version, "v2");
    });
  });
});
