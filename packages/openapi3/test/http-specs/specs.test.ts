import { resolvePath } from "@typespec/compiler";
import { findTestPackageRoot } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { worksFor } from "./../works-for.js";
import { defineSpecTests, markCoverage } from "./utils/spec-snapshot-testing.js";

const pkgRoot = await findTestPackageRoot(import.meta.url);
const specsRoot = resolvePath(pkgRoot, "node_modules", "@typespec", "http-specs", "specs");
const rootOutputDir = resolvePath(pkgRoot, "test", "http-specs", "output");

describe.skip("http-specs convert", () => {
  defineSpecTests({
    specDir: specsRoot,
    outputDir: rootOutputDir,
    exclude: ["parameters/collection-format", "payload/xml", "routes"],
  });
});

describe("http-specs cases", () => {
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
        await markCoverage(`/authentication/api-key/valid`, {
          method: "GET",
          headers: {
            "x-ms-api-key": "valid-key",
          }
        });
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
        await markCoverage(`/authentication/api-key/invalid`, {
          method: "GET",
          headers: {
            "x-ms-api-key": "invalid-key",
          },
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
      await markCoverage(`/versioning/added/api-version:v1/v1`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          "header-v2": "bar"
        },
        body: JSON.stringify({
          prop: "foo",
          enumProp: "enumMemberV2",
          unionProp: 10
        })
      });

      const v2 = Object.values(results)[1] as any;
      strictEqual(v2.info.version, "v2");
      await markCoverage(`/versioning/added/api-version:v2/v2`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prop: "foo",
          enumProp: "enumMember",
          unionProp: "bar"
        })
      });
    });
  });
});
