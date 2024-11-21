import { ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";

import { oapiForModel, openApiFor } from "./test-host.js";

const extensionKeys: [string, any][] = [
  ["minProperties", 1],
  ["maxProperties", 1],
  ["uniqueItems", true],
  ["multipleOf", 1],
];
describe("inline adds an extension to a parameter", () => {
  it.each(extensionKeys)("%s", async (key, value) => {
    const oapi = await openApiFor(
      `
      op get(
        @path
        @extension("${key}", ${value})
        petId: string;
      ): void;
      `,
    );
    strictEqual(oapi.paths["/{petId}"].get.parameters[0]["schema"][key], value);
    strictEqual(oapi.paths["/{petId}"].get.parameters[0][key], undefined);
  });
});

describe("adds an extension to a parameter", () => {
  it.each(extensionKeys)("%s", async (key, value) => {
    const oapi = await openApiFor(
      `
      model Pet {
      name: string;
      }
      model PetId {
        @path
        @extension("${key}", ${value})
        petId: string;
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
});

describe("adds an extension to a model", () => {
  it.each(extensionKeys)("%s", async (key, value) => {
    const res = await oapiForModel(
      "Foo",
      `model Foo {
        @extension("${key}", ${value})
        x: int32;
      };`,
    );

    expect(res.schemas.Foo).toMatchObject({
      required: ["x"],
      properties: {
        x: { [key]: value },
      },
    });
  });
});
