import { resolvePath } from "@typespec/compiler";
import { findTestPackageRoot } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { worksFor } from "./../works-for.js";
import { defineSpecTests } from "./utils/spec-snapshot-testing.js";
global.fetch = fetch;

const pkgRoot = await findTestPackageRoot(import.meta.url);
const specsRoot = resolvePath(pkgRoot, "node_modules", "@typespec", "http-specs", "specs");
const rootOutputDir = resolvePath(pkgRoot, "test", "http-specs", "output");

describe("http-specs convert", () => {
  defineSpecTests({
    specDir: specsRoot,
    outputDir: rootOutputDir,
    exclude: ["parameters/collection-format", "payload/xml", "routes"],
  });
});

describe("http-specs cases", () => {
  const options = {
    method: "GET", // 或者 'POST', 'PUT', 'DELETE' 等
    headers: {
      "Content-Type": "application/json",
      "x-ms-api-key": "valid-key",
    },
  };
  const BASE_PATH = "http://localhost:3000";

  worksFor(["3.0.0", "3.1.0"], ({ openApiForFile }) => {
    describe("AuthApiKeyClient Rest Client", () => {
      it("should return 204 when the apiKey is valid", async () => {
        const curr = {
          name: "authentication/api-key",
          fullPath: resolvePath(specsRoot, "authentication/api-key"),
        };
        const results = await openApiForFile(curr);
        const res = Object.values(results)[0] as any;
        const getThing = res.paths["/authentication/api-key/valid"].get;
        ok(getThing.responses["204"]);
        await fetch(BASE_PATH + `/authentication/api-key/valid`, options);
      });

      it("should return 403 when the apiKey is invalid", async () => {
        const curr = {
          name: "authentication/api-key",
          fullPath: resolvePath(specsRoot, "authentication/api-key"),
        };
        const results = await openApiForFile(curr);
        const res = Object.values(results)[0] as any;
        const getThing = res.paths["/authentication/api-key/invalid"].get;
        deepStrictEqual(getThing.responses["403"].content["application/json"].schema, {
          $ref: "#/components/schemas/InvalidAuth",
        });
      });
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
