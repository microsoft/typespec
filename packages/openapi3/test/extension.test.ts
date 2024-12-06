import { ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";

import { expectDiagnostics } from "@typespec/compiler/testing";
import { diagnoseOpenApiFor, oapiForModel, openApiFor } from "./test-host.js";
const extensionKeysForObject: string[] = ["minProperties", "maxProperties"];

const extensionKeysForModelProperties: [string, any, string][] = [
  ["uniqueItems", true, "string[]"],
  ["multipleOf", 1, "integer"],
];
describe("inline adds an extension to a parameter", () => {
  it.each(extensionKeysForModelProperties)("%s", async (key, value, targetType) => {
    const oapi = await openApiFor(
      `
      op get(
        @path
        @extension("${key}", ${value})
        petId: ${targetType};
      ): void;
      `,
    );
    strictEqual(oapi.paths["/{petId}"].get.parameters[0]["schema"][key], value);
    strictEqual(oapi.paths["/{petId}"].get.parameters[0][key], undefined);
  });
});

describe("adds an extension to a parameter", () => {
  it.each(extensionKeysForModelProperties)("%s", async (key, value, targetType) => {
    const oapi = await openApiFor(
      `
      model Pet {
      name: string;
      }
      model PetId {
        @path
        @extension("${key}", ${value})
        petId: ${targetType};
      }
      @route("/Pets")
      @get()
      op get(... PetId): Pet;
      `,
    );
    ok(oapi.paths["/Pets/{petId}"].get);
    strictEqual(
      oapi.paths["/Pets/{petId}"].get.parameters[0]["$ref"],
      "#/components/parameters/PetId",
    );
    strictEqual(oapi.components.parameters.PetId.name, "petId");
    strictEqual(oapi.components.parameters.PetId.schema[key], value);
    strictEqual(oapi.components.parameters.PetId[key], undefined);
  });

  it.each(extensionKeysForObject)("%s", async (key) => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      @extension("minProperties", 1)
      model Pet {
        @path
        path: string;
      }
      op get(...Pet): void;
      `,
    );
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/openapi3/minmaxProperties-invalid-model",
      },
    ]);
  });
});

describe("adds an extension", () => {
  it.each(extensionKeysForModelProperties)("%s to a model prop", async (key, value, targetType) => {
    const res = await oapiForModel(
      "Foo",
      `model Foo {
        @extension("${key}", ${value})
        x: ${targetType};
      };`,
    );

    expect(res.schemas.Foo).toMatchObject({
      required: ["x"],
      properties: {
        x: { [key]: value },
      },
    });
  });

  it.each(extensionKeysForObject)("%s to a model", async (key) => {
    const res = await oapiForModel(
      "Foo",
      `
      @extension("${key}", 1)
      model Foo {        
        x: string;
      };`,
    );

    expect(res.schemas.Foo).toMatchObject({
      required: ["x"],
      [key]: 1,
    });
  });

  it("apply multipleOf extension on scalar", async () => {
    const res = await oapiForModel(
      "a",
      `
        @extension("multipleOf", 1)
        scalar a extends integer;`,
    );

    expect(res.schemas.a).toMatchObject({
      multipleOf: 1,
    });
  });
});
