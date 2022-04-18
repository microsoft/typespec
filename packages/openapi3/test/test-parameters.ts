import { deepStrictEqual, strictEqual } from "assert";
import { openApiFor } from "./test-host.js";

describe("openapi3: parameters", () => {
  it("create a query param", async () => {
    const res = await openApiFor(
      `
      op test(@query arg1: string): void;
      `
    );
    strictEqual(res.paths["/"].get.parameters[0].in, "query");
    strictEqual(res.paths["/"].get.parameters[0].name, "arg1");
    deepStrictEqual(res.paths["/"].get.parameters[0].schema, { type: "string" });
  });

  // Regression test for https://github.com/microsoft/cadl/issues/414
  it("@doc set the description on the parameter not its schema", async () => {
    const res = await openApiFor(
      `
      op test(@query @doc("mydoc") arg1: string): void;
      `
    );
    strictEqual(res.paths["/"].get.parameters[0].description, "mydoc");
    strictEqual(res.paths["/"].get.parameters[0].schema.description, undefined);
  });
});
