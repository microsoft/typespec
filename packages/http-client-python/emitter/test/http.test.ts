import type { SdkHeaderParameter } from "@azure-tools/typespec-client-generator-core";
import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { getEtagRole } from "../src/http.js";

function createHeaderParameter(optional: boolean): SdkHeaderParameter {
  return {
    name: "ifMatch",
    serializedName: "If-Match",
    optional,
  } as SdkHeaderParameter;
}

describe("typespec-python: HTTP parameters", () => {
  it("only promotes optional If-Match headers to the conditional convenience API", () => {
    strictEqual(getEtagRole(createHeaderParameter(true)), "ifMatch");
    strictEqual(getEtagRole(createHeaderParameter(false)), undefined);
  });
});
