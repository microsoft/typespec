import { deepStrictEqual, ok } from "assert";
import { describe, it } from "vitest";
import { OpenAPI3EmitterOptions } from "../src/lib.js";
import { supportedVersions, worksFor } from "./works-for.js";

worksFor(supportedVersions, ({ oapiForModel, objectSchemaIndexer }) => {
  describe("extends Record<T>", () => {
    it(`doesn't set ${objectSchemaIndexer} on model itself`, async () => {
      const res = await oapiForModel("Pet", `model Pet extends Record<unknown> {};`);
      deepStrictEqual(res.schemas.Pet[objectSchemaIndexer], undefined);
    });

    it("links to an allOf of the Record<unknown> schema", async () => {
      const res = await oapiForModel("Pet", `model Pet extends Record<unknown> {};`);
      deepStrictEqual(res.schemas.Pet.allOf, [{ type: "object", [objectSchemaIndexer]: {} }]);
    });

    it("include model properties", async () => {
      const res = await oapiForModel("Pet", `model Pet extends Record<unknown> { name: string };`);
      deepStrictEqual(res.schemas.Pet.properties, {
        name: { type: "string" },
      });
    });
  });

  describe("is Record<T>", () => {
    it(`set ${objectSchemaIndexer} on model itself`, async () => {
      const res = await oapiForModel("Pet", `model Pet is Record<unknown> {};`);
      deepStrictEqual(res.schemas.Pet[objectSchemaIndexer], {});
    });

    it("set additional properties type", async () => {
      const res = await oapiForModel("Pet", `model Pet is Record<string> {};`);
      deepStrictEqual(res.schemas.Pet[objectSchemaIndexer], {
        type: "string",
      });
    });

    it("include model properties", async () => {
      const res = await oapiForModel("Pet", `model Pet is Record<unknown> { name: string };`);
      deepStrictEqual(res.schemas.Pet.properties, {
        name: { type: "string" },
      });
    });
  });

  describe("referencing Record<T>", () => {
    it(`add ${objectSchemaIndexer} inline for property of type Record<unknown>`, async () => {
      const res = await oapiForModel(
        "Pet",
        `
        model Pet { details: Record<unknown> };
        `,
      );

      ok(res.isRef);
      ok(res.schemas.Pet, "expected definition named Pet");
      deepStrictEqual(res.schemas.Pet.properties.details, {
        type: "object",
        [objectSchemaIndexer]: {},
      });
    });

    it(`add ${objectSchemaIndexer} inline for property of type Record<never>`, async () => {
      const res = await oapiForModel(
        "Pet",
        `
        model Pet { empty: Record<never> };
        `,
      );

      ok(res.isRef);
      ok(res.schemas.Pet, "expected definition named Pet");
      deepStrictEqual(res.schemas.Pet.properties.empty, {
        type: "object",
        [objectSchemaIndexer]: { not: {} },
      });
    });
  });

  describe("spreading Record<T>", () => {
    it(`add ${objectSchemaIndexer} of type Record<unknown>`, async () => {
      const res = await oapiForModel(
        "Pet",
        `
        model Pet { ...Record<unknown> };
        `,
      );

      ok(res.isRef);
      ok(res.schemas.Pet, "expected definition named Pet");
      deepStrictEqual(res.schemas.Pet[objectSchemaIndexer], {});
    });

    it(`add ${objectSchemaIndexer} of type Record<never> as "{ not: {} }"`, async () => {
      const res = await oapiForModel(
        "Pet",
        `
        model Pet { name: string, ...Record<never> };
        `,
      );

      ok(res.isRef);
      ok(res.schemas.Pet, "expected definition named Pet");
      deepStrictEqual(res.schemas.Pet, {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } },
        [objectSchemaIndexer]: { not: {} },
      });
    });
  });

  it(`set ${objectSchemaIndexer} if model extends Record with leaf type`, async () => {
    const res = await oapiForModel(
      "Pet",
      `
      @doc("value")
      scalar Value;
      model Pet is Record<Value> {};
      `,
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.Pet[objectSchemaIndexer], {
      $ref: "#/components/schemas/Value",
    });
  });
});

worksFor(["3.0.0"], ({ oapiForModel }) => {
  describe("additionalProperties: { not: {} }", () => {
    it("copies properties from base models", async () => {
      const res = await oapiForModel(
        "Spinner",
        `
        model Entity { id: string; };
        model Widget extends Entity { kind: string; name: string; };
        model Spinner extends Widget { kind: "spinner"; cycles: int8; ...Record<never>; }
      `,
      );
      deepStrictEqual(res.schemas.Spinner, {
        type: "object",
        allOf: [{ $ref: "#/components/schemas/Widget" }],
        required: ["kind", "cycles"],
        properties: {
          kind: { type: "string", enum: ["spinner"] },
          cycles: { type: "integer", format: "int8" },
          name: {},
          id: {},
        },
        additionalProperties: { not: {} },
      });
    });
  });
});

worksFor(["3.1.0"], ({ oapiForModel }) => {
  describe("unevaluatedProperties: { not: {} }", () => {
    it("does not copy properties from base models", async () => {
      const res = await oapiForModel(
        "Spinner",
        `
        model Entity { id: string; };
        model Widget extends Entity { kind: string; name: string; };
        model Spinner extends Widget { kind: "spinner"; cycles: int8; ...Record<never>; }
      `,
      );
      deepStrictEqual(res.schemas.Spinner, {
        type: "object",
        allOf: [{ $ref: "#/components/schemas/Widget" }],
        required: ["kind", "cycles"],
        properties: {
          kind: { type: "string", enum: ["spinner"] },
          cycles: { type: "integer", format: "int8" },
        },
        unevaluatedProperties: { not: {} },
      });
    });
  });
});

worksFor(supportedVersions, ({ oapiForModel: baseOapiForMopdel, objectSchemaIndexer }) => {
  const oapiForModel = async (name: string, model: string, options?: OpenAPI3EmitterOptions) => {
    return baseOapiForMopdel(name, model, { ...options, "seal-object-schemas": true });
  };

  describe("seal-object-schemas enabled", () => {
    it("seals object schemas", async () => {
      const res = await oapiForModel("Pet", `model Pet { name: string; };`);
      deepStrictEqual(res.schemas.Pet, {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } },
        [objectSchemaIndexer]: { not: {} },
      });
    });

    it(`does not seal object schemas that already have ${objectSchemaIndexer} set`, async () => {
      const res = await oapiForModel("Pet", `model Pet { name: string; ...Record<string>; };`);
      deepStrictEqual(res.schemas.Pet, {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } },
        [objectSchemaIndexer]: { type: "string" },
      });
    });

    it("does not seal object schemas that have derived schemas", async () => {
      const res = await oapiForModel(
        "Spinner",
        `
        model Entity { id: string; };
        model Widget extends Entity { kind: string; name: string; };
        model Spinner extends Widget { kind: "spinner"; cycles: int8; }
      `,
      );

      // Should not constrain additional properties
      deepStrictEqual(res.schemas.Entity[objectSchemaIndexer], undefined);

      // Should not constrain additional properties
      deepStrictEqual(res.schemas.Widget[objectSchemaIndexer], undefined);

      // SHOULD constrain additional properties
      deepStrictEqual(res.schemas.Spinner[objectSchemaIndexer], { not: {} });
    });
  });
});
