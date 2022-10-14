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
      "x-cadl-name": "string[]",
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
      "x-cadl-name": "string[]",
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
      "x-cadl-name": "string[]",
    });
  });
});
