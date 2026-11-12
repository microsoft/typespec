import { deepStrictEqual, ok } from "assert";
import { describe, it } from "vitest";
import type { OpenAPI3EmitterOptions } from "../src/lib.js";
import { supportedVersions, worksFor } from "./works-for.js";

worksFor(supportedVersions, ({ oapiForModel, objectSchemaIndexer }) => {
  describe("extends Record<T>", () => {
    it(`doesn't set ${objectSchemaIndexer} on model itself`, async () => {
      const res = await oapiForModel("Pet", `model Pet extends Record<unknown> {};`);
      deepStrictEqual(res.schemas.Pet[objectSchemaIndexer], undefined);
    });

    it("links to an allOf of the Record<unknown> schema", async () => {
      const res = await oapiForModel("Pet", `model Pet extends Record<unknown> {};`);
      deepStrictEqual(res.schemas.Pet.allOf, [{ type: "object", additionalProperties: {} }]);
    });

    it("include model properties", async () => {
      const res = await oapiForModel("Pet", `model Pet extends Record<unknown> { name: string };`);
      deepStrictEqual(res.schemas.Pet.properties, {
        name: { type: "string" },
      });
    });
  });

  describe("is Record<T>", () => {
    it("set additionalProperties on model itself", async () => {
      const res = await oapiForModel("Pet", `model Pet is Record<unknown> {};`);
      deepStrictEqual(res.schemas.Pet.additionalProperties, {});
    });

    it("set additional properties type", async () => {
      const res = await oapiForModel("Pet", `model Pet is Record<string> {};`);
      deepStrictEqual(res.schemas.Pet.additionalProperties, {
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
    it("add additionalProperties inline for property of type Record<unknown>", async () => {
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
        additionalProperties: {},
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
    it("add additionalProperties of type Record<unknown>", async () => {
      const res = await oapiForModel(
        "Pet",
        `
        model Pet { ...Record<unknown> };
        `,
      );

      ok(res.isRef);
      ok(res.schemas.Pet, "expected definition named Pet");
      deepStrictEqual(res.schemas.Pet.additionalProperties, {});
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

  it("set additionalProperties if model extends Record with leaf type", async () => {
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
    deepStrictEqual(res.schemas.Pet.additionalProperties, {
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

    it("does not seal object schemas that already have additionalProperties set", async () => {
      const res = await oapiForModel("Pet", `model Pet { name: string; ...Record<string>; };`);
      deepStrictEqual(res.schemas.Pet, {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } },
        additionalProperties: { type: "string" },
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

worksFor(["3.1.0", "3.2.0"], ({ oapiForModel }) => {
  describe("which indexer keyword is used", () => {
    it("uses additionalProperties for a declared indexer", async () => {
      const res = await oapiForModel("Pet", `model Pet { details: Record<string> };`);
      deepStrictEqual(res.schemas.Pet.properties.details, {
        type: "object",
        additionalProperties: { type: "string" },
      });
    });

    it("uses unevaluatedProperties for a declared indexer on a model with a base model", async () => {
      const res = await oapiForModel(
        "Dict",
        `
        model Base { id: int32; }
        model Dict extends Base { ...Record<string>; }
        `,
      );
      deepStrictEqual(res.schemas.Dict, {
        type: "object",
        unevaluatedProperties: { type: "string" },
        allOf: [{ $ref: "#/components/schemas/Base" }],
      });
    });

    it("uses additionalProperties for a declared indexer that other models extend", async () => {
      const res = await oapiForModel(
        "Sub",
        `
        model Dict { ...Record<string>; }
        model Sub extends Dict { extra: string; }
        `,
      );
      deepStrictEqual(res.schemas.Dict, {
        type: "object",
        additionalProperties: { type: "string" },
      });
    });

    it("uses unevaluatedProperties to seal a model", async () => {
      const res = await oapiForModel("Pet", `model Pet { name: string; };`, {
        "seal-object-schemas": true,
      });
      deepStrictEqual(res.schemas.Pet, {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } },
        unevaluatedProperties: { not: {} },
      });
    });

    it("uses unevaluatedProperties to seal a model that has a base model", async () => {
      const res = await oapiForModel(
        "Leaf",
        `
        model Base { id: string; }
        model Leaf extends Base { name: string; }
        `,
        { "seal-object-schemas": true },
      );
      deepStrictEqual(res.schemas.Leaf, {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } },
        unevaluatedProperties: { not: {} },
        allOf: [{ $ref: "#/components/schemas/Base" }],
      });
    });

    it("keeps unevaluatedProperties for a Record<never> property, which seals", async () => {
      const res = await oapiForModel("Pet", `model Pet { empty: Record<never> };`);
      deepStrictEqual(res.schemas.Pet.properties.empty, {
        type: "object",
        unevaluatedProperties: { not: {} },
      });
    });

    it("uses unevaluatedProperties at every level of an inheritance chain that declares an indexer", async () => {
      const res = await oapiForModel(
        "C",
        `
        model A { ...Record<string>; }
        model B extends A { b: string; ...Record<string>; }
        model C extends B { c: string; }
        `,
      );
      // Only `A` is free of a base model, so only `A` uses additionalProperties.
      deepStrictEqual(res.schemas.A, {
        type: "object",
        additionalProperties: { type: "string" },
      });
      deepStrictEqual(res.schemas.B.unevaluatedProperties, { type: "string" });
      deepStrictEqual(res.schemas.B.allOf, [{ $ref: "#/components/schemas/A" }]);
    });
  });
});

worksFor(["3.1.0", "3.2.0"], ({ oapiForModel }) => {
  describe("shapes the indexer keyword must not reach", () => {
    it("applies to the item of an array of dictionaries, not to the array", async () => {
      const res = await oapiForModel("Pet", `model Pet { tags: Record<string>[]; };`);
      deepStrictEqual(res.schemas.Pet.properties.tags, {
        type: "array",
        items: { type: "object", additionalProperties: { type: "string" } },
      });
    });

    it("applies at every level of a nested dictionary", async () => {
      const res = await oapiForModel("Pet", `model Pet { nested: Record<Record<string>>; };`);
      deepStrictEqual(res.schemas.Pet.properties.nested, {
        type: "object",
        additionalProperties: {
          type: "object",
          additionalProperties: { type: "string" },
        },
      });
    });
  });
});

worksFor(["3.1.0", "3.2.0"], ({ oapiForModel }) => {
  // `attachExtensions` writes arbitrary keys onto the schema after `applyModelIndexer` has run, so
  // an `@extension` that injects an in-place applicator is invisible to the keyword decision. The
  // `x-` prefix convention is documented for `@extension` but not enforced, so this is reachable.
  // Pinned rather than guarded: the emitter cannot see the injected applicator from where the
  // decision is made, and the same escape hatch has always behaved this way in OpenAPI 3.0.
  it("does not account for an in-place applicator injected by @extension", async () => {
    const res = await oapiForModel(
      "Dict",
      `
      @extension("allOf", #[#{ type: "object", properties: #{ flag: #{ type: "boolean" } } }])
      model Dict { ...Record<string>; }
      `,
    );
    deepStrictEqual(res.schemas.Dict.additionalProperties, { type: "string" });
    deepStrictEqual(res.schemas.Dict.allOf, [
      { type: "object", properties: { flag: { type: "boolean" } } },
    ]);
  });
});
