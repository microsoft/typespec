import { deepStrictEqual, ok } from "assert";
import { it } from "vitest";
import { openapisFor } from "./test-host.js";
import { supportedVersions, worksFor } from "./works-for.js";

worksFor(supportedVersions, ({ oapiForModel }) => {
  it("defines record inline", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet { foodScores: Record<int32> };
      `,
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.Pet.properties.foodScores, {
      type: "object",
      additionalProperties: { type: "integer", format: "int32" },
    });
  });

  it("defines models extended from primitives", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model FoodScores is Record<int32> {}
      model Pet { foodScores: FoodScores };
      `,
    );

    ok(res.isRef);
    ok(res.schemas.FoodScores, "expected definition named myArray");
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.FoodScores, {
      type: "object",
      additionalProperties: { type: "integer", format: "int32" },
    });
  });

  it(`specify additionalProperties when "...Record<T>"`, async () => {
    const res = await oapiForModel(
      "Person",
      `
      model Person {age: int32, ...Record<string>}
      `,
    );

    deepStrictEqual(res.schemas.Person, {
      type: "object",
      properties: { age: { type: "integer", format: "int32" } },
      additionalProperties: { type: "string" },
      required: ["age"],
    });
  });

  it(`specify additionalProperties of anyOf when multiple "...Record<T>"`, async () => {
    const res = await oapiForModel(
      "Person",
      `
      model Person {age: int32, ...Record<string>, ...Record<boolean>}
      `,
    );

    deepStrictEqual(res.schemas.Person, {
      type: "object",
      properties: { age: { type: "integer", format: "int32" } },
      additionalProperties: { anyOf: [{ type: "string" }, { type: "boolean" }] },
      required: ["age"],
    });
  });
});

// A dictionary whose value type is not `never`, on a model that does not extend another model, is
// the same schema in every spec version, so the 3.0 output is an oracle for the 3.1 one. The two
// exclusions are real: a model that composes is deliberately different, and `Record<never>` routes
// through the sealing branch, which keeps the composition aware keyword in 3.1. Both are asserted
// below so the oracle's preconditions are pinned rather than assumed.
it("emits the same dictionary schema for 3.0 and 3.1 when the model does not compose", async () => {
  const outputs = await openapisFor(
    `
    model Labels is Record<string>;
    model Holder { labels: Labels; inline: Record<unknown>; }
    @route("/h") @post op h(@body body: Holder): Holder;
    `,
    { "openapi-versions": ["3.0.0", "3.1.0"] },
  );

  const v30 = outputs["3.0.0/openapi.json"];
  const v31 = outputs["3.1.0/openapi.json"];
  ok(v30 && v31, "expected a document for each spec version");

  deepStrictEqual(v31.components!.schemas!.Labels, v30.components!.schemas!.Labels);
  deepStrictEqual(v31.components!.schemas!.Holder, v30.components!.schemas!.Holder);
  deepStrictEqual(v31.components!.schemas!.Labels, {
    type: "object",
    additionalProperties: { type: "string" },
  });
});

it("still differs between 3.0 and 3.1 when the model composes", async () => {
  const outputs = await openapisFor(
    `
    model Base { id: int32; }
    model Dict extends Base { ...Record<string>; }
    @route("/d") @post op d(@body body: Dict): Dict;
    `,
    { "openapi-versions": ["3.0.0", "3.1.0"] },
  );

  deepStrictEqual(outputs["3.0.0/openapi.json"].components!.schemas!.Dict, {
    type: "object",
    additionalProperties: { type: "string" },
    allOf: [{ $ref: "#/components/schemas/Base" }],
  });
  deepStrictEqual(outputs["3.1.0/openapi.json"].components!.schemas!.Dict, {
    type: "object",
    unevaluatedProperties: { type: "string" },
    allOf: [{ $ref: "#/components/schemas/Base" }],
  });
});

it("still differs between 3.0 and 3.1 for Record<never>, which seals rather than describing a map", async () => {
  const outputs = await openapisFor(
    `
    model Holder { empty: Record<never>; }
    @route("/h") @post op h(@body body: Holder): Holder;
    `,
    { "openapi-versions": ["3.0.0", "3.1.0"] },
  );

  deepStrictEqual(outputs["3.0.0/openapi.json"].components!.schemas!.Holder!.properties!.empty, {
    type: "object",
    additionalProperties: { not: {} },
  });
  deepStrictEqual(outputs["3.1.0/openapi.json"].components!.schemas!.Holder!.properties!.empty, {
    type: "object",
    unevaluatedProperties: { not: {} },
  });
});
