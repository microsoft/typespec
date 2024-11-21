import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";

import { oapiForModel, openApiFor } from "./test-host.js";

const extensionKeys = ["minProperties", "maxProperties", "uniqueItems", "multipleOf"];
describe("inline adds an extension to a parameter", () => {
  it.each(extensionKeys)("%s", async (key) => {
    const oapi = await openApiFor(
      `
      op get(
        @path
        @extension("${key}", "foobaz")
        petId: string;
      ): void;
      `,
    );
    strictEqual(oapi.paths["/{petId}"].get.parameters[0]["schema"][key], "foobaz");
    strictEqual(oapi.paths["/{petId}"].get.parameters[0][key], undefined);
  });
});

describe("adds an extension to a parameter", () => {
  it.each(extensionKeys)("%s", async (key) => {
    const oapi = await openApiFor(
      `
      model Pet {
      name: string;
      }
      model PetId {
        @path
        @extension("${key}", "foobaz")
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
    strictEqual(oapi.components.parameters.PetId.schema[key], "foobaz");
    strictEqual(oapi.components.parameters.PetId[key], undefined);
  });
});

describe("adds an extension to a model", () => {
  it.each(extensionKeys)("%s", async (key) => {
    const res = await oapiForModel(
      "Foo",
      `model Foo {
        @extension("${key}", "foobaz")
        x: int32;
      };`,
    );

    expect(res.schemas.Foo).toMatchObject({
      required: ["x"],
      properties: {
        x: { [key]: "foobaz" },
      },
    });
  });
});

describe("adds an extension to a scalar", () => {
  it.each(extensionKeys)("%s", async (key) => {
    const res = await oapiForModel(
      "Pet",
      `@extension("${key}", "my-value")
      scalar Pet extends string;`,
    );

    deepStrictEqual(res.schemas.Pet, {
      type: "string",
      [key]: "my-value",
    });
  });
});
