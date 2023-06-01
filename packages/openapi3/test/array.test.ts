import { deepStrictEqual, ok } from "assert";
import { oapiForModel } from "./test-host.js";

describe("openapi3: Array", () => {
  it("defines array inline", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet { names: string[] };
      `
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.Pet.properties.names, {
      type: "array",
      items: { type: "string" },
      "x-typespec-name": "string[]",
    });
  });

  it("define a named array using model is", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model PetNames is string[] {}
      model Pet { names: PetNames };
      `
    );

    ok(res.isRef);
    ok(res.schemas.PetNames, "expected definition named myArray");
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.PetNames, {
      type: "array",
      items: { type: "string" },
    });
  });

  it("can specify minItems using @minItems decorator", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet {
        @minItems(1)
        names: string[]
      };
      `
    );

    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.Pet.properties.names, {
      type: "array",
      minItems: 1,
      items: { type: "string" },
      "x-typespec-name": "string[]",
    });
  });

  it("can specify maxItems using @maxItems decorator", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet {
        @maxItems(3)
        names: string[]
      };
      `
    );

    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.Pet.properties.names, {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
      "x-typespec-name": "string[]",
    });
  });

  it("can specify array defaults using tuple syntax", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet {
        names: string[] = ["bismarck"];
        decimals: decimal[] = [123, 456.7];
        decimal128s: decimal128[] = [123, 456.7];
      };
      `
    );

    deepStrictEqual(res.schemas.Pet.properties.names, {
      type: "array",
      items: { type: "string" },
      "x-typespec-name": "string[]",
      default: ["bismarck"],
    });

    deepStrictEqual(res.schemas.Pet.properties.decimals, {
      type: "array",
      items: { type: "number", format: "decimal" },
      "x-typespec-name": "decimal[]",
      default: [123, 456.7],
    });

    deepStrictEqual(res.schemas.Pet.properties.decimal128s, {
      type: "array",
      items: { type: "number", format: "decimal128" },
      "x-typespec-name": "decimal128[]",
      default: [123, 456.7],
    });
  });

  it("can specify tuple defaults using tuple syntax", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet {
        names: [string, int32] = ["bismarck", 12];
        decimals: [string, decimal] = ["hi", 456.7];
        decimal128s: [string, decimal128] = ["hi", 456.7];
      };
      `
    );

    deepStrictEqual(res.schemas.Pet.properties.names, {
      type: "array",
      items: {},
      "x-typespec-name": "[string, int32]",
      default: ["bismarck", 12],
    });

    deepStrictEqual(res.schemas.Pet.properties.decimals, {
      type: "array",
      items: {},
      "x-typespec-name": "[string, decimal]",
      default: ["hi", 456.7],
    });

    deepStrictEqual(res.schemas.Pet.properties.decimal128s, {
      type: "array",
      items: {},
      "x-typespec-name": "[string, decimal128]",
      default: ["hi", 456.7],
    });
  });
});
