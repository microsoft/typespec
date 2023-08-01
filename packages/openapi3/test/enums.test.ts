import { expectDiagnostics } from "@typespec/compiler/testing";
import { diagnoseOpenApiFor } from "./test-host.js";

describe("openapi3: models", () => {
  it("throws diagnostics for empty enum definitions", async () => {
    const diagnostics = await diagnoseOpenApiFor(`enum PetType {}`);

    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/empty-enum",
      message: "Empty enums are not supported for OpenAPI v3 - enums must have at least one value.",
    });
  });

  it("throws diagnostics for enum with different types", async () => {
    const diagnostics = await diagnoseOpenApiFor(`enum PetType {asString: "dog", asNumber: 1}`);

    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/enum-unique-type",
      message: "Enums are not supported unless all options are literals of the same type.",
    });
  });
});
