import { resolvePath } from "@typespec/compiler";
import { findTestPackageRoot } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { exec, execSync } from "child_process";
import { afterAll, beforeAll, describe, it } from "vitest";
import { worksFor } from "./../works-for.js";
import {
  checkServe,
  defineSpecTests,
  markCoverage,
  validataDataWithSchema,
} from "./utils/spec-snapshot-testing.js";

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
      beforeAll(async () => {
        exec("pnpm spector-serve", { cwd: pkgRoot });
        await checkServe();
      });

      afterAll(() => {
        execSync("pnpm spector-stop", { stdio: "inherit", cwd: pkgRoot });
      });

      it("should return 204 when the apiKey is valid", async () => {
        const curr = {
          name: "authentication/api-key",
          fullPath: resolvePath(specsRoot, "authentication/api-key"),
        };
        const results = await openApiForFile(curr);
        const res = Object.values(results)[0] as any;
        const getThing = res.paths["/authentication/api-key/valid"].get;

        const response = await markCoverage(`/authentication/api-key/valid`, {
          method: "GET",
          headers: {
            "x-ms-api-key": "valid-key",
          },
        });
        if (response) {
          strictEqual(response?.status, 204);
          ok(getThing.responses["204"]);
        }
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
        const invalidAuthSchemas = res.components.schemas;

        const response = await markCoverage(`/authentication/api-key/invalid`, {
          method: "GET",
          headers: {
            "x-ms-api-key": "invalid-key",
          },
        });
        if (response) {
          strictEqual(response.status, 403);
          strictEqual(response.body.error, "invalid-api-key");
          await validataDataWithSchema(response.body, invalidAuthSchemas);
        }
      });
    });

    it("versioning added v1", async () => {
      const curr = {
        name: "versioning/added",
        fullPath: resolvePath(specsRoot, "versioning/added"),
      };
      const results = await openApiForFile(curr);
      const v1 = Object.values(results)[0] as any;
      strictEqual(v1.info.version, "v1");

      const modelV1Schemas = v1.components.schemas;
      const response = await markCoverage(`/versioning/added/api-version:v1/v1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "header-v2": "bar",
        },
        body: JSON.stringify({
          prop: "foo",
          enumProp: "enumMemberV2",
          unionProp: 10,
        }),
      });
      if (response) {
        strictEqual(response.status, 200);
        strictEqual(response.body.prop, "foo");
        strictEqual(response.body.enumProp, "enumMemberV2");
        strictEqual(response.body.unionProp, 10);
        await validataDataWithSchema(response.body, modelV1Schemas);
      }
    });

    it("versioning added v2", async () => {
      const curr = {
        name: "versioning/added",
        fullPath: resolvePath(specsRoot, "versioning/added"),
      };
      const results = await openApiForFile(curr);

      const v2 = Object.values(results)[1] as any;
      strictEqual(v2.info.version, "v2");
      const modelV2Schemas = v2.components.schemas;
      const v2Response = await markCoverage(`/versioning/added/api-version:v2/v2`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prop: "foo",
          enumProp: "enumMember",
          unionProp: "bar",
        }),
      });
      if (v2Response) {
        strictEqual(v2Response.status, 200);
        strictEqual(v2Response.body.prop, "foo");
        strictEqual(v2Response.body.enumProp, "enumMember");
        strictEqual(v2Response.body.unionProp, "bar");
        await validataDataWithSchema(v2Response.body, modelV2Schemas);
      }
    });
  });
});
