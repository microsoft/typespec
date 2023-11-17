import { deepStrictEqual } from "assert";
import { oapiForModel } from "./test-host.js";

describe("openapi3: circular reference", () => {
  it("can reference itself via a property", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet { parent?: Pet };
      `
    );

    deepStrictEqual(res.schemas.Pet, {
      type: "object",
      properties: {
        parent: { $ref: "#/components/schemas/Pet" },
      },
    });
  });

  it("can reference itself via an array property", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet { parents?: Pet[] };
      `
    );

    deepStrictEqual(res.schemas.Pet, {
      type: "object",
      properties: {
        parents: { type: "array", items: { $ref: "#/components/schemas/Pet" } },
      },
    });
  });
});
