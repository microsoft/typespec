import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { it } from "vitest";
import { diagnoseOpenApiFor, openApiFor } from "./test-host.js";

it("emit diagnostic if tagName is not a string", async () => {
  const diagnostics = await diagnoseOpenApiFor(
    `
      @tagMetadata(123)
      namespace PetStore{};
      `,
  );

  expectDiagnostics(diagnostics, {
    code: "invalid-argument",
  });
});

it("emit diagnostic if description is not a string", async () => {
  const diagnostics = await diagnoseOpenApiFor(
    `
      @tagMetadata("tagName", { description: 123, })
      namespace PetStore{};
      `,
  );

  expectDiagnostics(diagnostics, {
    code: "invalid-argument",
  });
});

it("set the additional information with @tagMetadata decorator", async () => {
  const res = await openApiFor(
    `
      @service
      @tagMetadata(
        "pet",
        {
          description: "Pets operations",
          externalDocs: {
            url: "https://example.com",
            description: "More info.",
          },
        }
      )
      namespace PetStore {
        @tag("pet")
        op NamespaceOperation(): string;
      }
      `,
  );
  deepStrictEqual(res.paths["/"].get.tags, ["pet"]);
  deepStrictEqual(res.tags, [
    {
      name: "pet",
      description: "Pets operations",
      externalDocs: {
        description: "More info.",
        url: "https://example.com",
      },
    },
  ]);
});
