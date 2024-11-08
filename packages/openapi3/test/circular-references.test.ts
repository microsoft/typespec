import { deepStrictEqual } from "assert";
import { it } from "vitest";
import { worksFor } from "./works-for.js";

worksFor(["3.0.0", "3.1.0"], ({ oapiForModel }) => {
  it("can reference itself via a property", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet { parent?: Pet };
      `,
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
      `,
    );

    deepStrictEqual(res.schemas.Pet, {
      type: "object",
      properties: {
        parents: { type: "array", items: { $ref: "#/components/schemas/Pet" } },
      },
    });
  });

  it("can reference itself via a union property", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet { parents?: string | Pet };
      `,
    );

    deepStrictEqual(res.schemas.Pet, {
      type: "object",
      properties: {
        parents: { anyOf: [{ type: "string" }, { $ref: "#/components/schemas/Pet" }] },
      },
    });
  });
});
