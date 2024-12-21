import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, strictEqual } from "assert";
import { it } from "vitest";
import { worksFor } from "./works-for.js";

worksFor(["3.0.0", "3.1.0"], ({ diagnoseOpenApiFor, oapiForModel }) => {
  it("throws diagnostics for empty enum definitions", async () => {
    const diagnostics = await diagnoseOpenApiFor(`enum PetType {}`);

    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/empty-enum",
      message: "Empty enums are not supported for OpenAPI v3 - enums must have at least one value.",
    });
  });

  it("supports summary on enums", async () => {
    const res = await oapiForModel(
      "Foo",
      `
      @summary("FooEnum")
      enum Foo {
        y: 0;
      };
      `,
    );
    strictEqual(res.schemas.Foo.title, "FooEnum");
  });
});

worksFor(["3.0.0"], ({ diagnoseOpenApiFor }) => {
  it("throws diagnostics for enum with different types", async () => {
    const diagnostics = await diagnoseOpenApiFor(`enum PetType {asString: "dog", asNumber: 1}`);

    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/enum-unique-type",
      message: "Enums are not supported unless all options are literals of the same type.",
    });
  });
});

worksFor(["3.1.0"], ({ oapiForModel }) => {
  it("supports enum with different types", async () => {
    const res = await oapiForModel("PetType", `enum PetType {asString: "dog", asNumber: 1}`);

    deepStrictEqual(res.schemas.PetType, {
      type: ["string", "number"],
      enum: ["dog", 1],
    });
  });
});
