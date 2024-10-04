import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { oapiForModel, openApiFor } from "./test-host.js";

describe("openapi3: Array", () => {
  it("defines array inline", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet { names: string[] };
      `,
    );

    ok(res.isRef);
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.Pet.properties.names, {
      type: "array",
      items: { type: "string" },
    });
  });

  it("keeps array inline in circular reference with extra properties", async () => {
    const res = await openApiFor(
      `
      model Root {
        value: Parent[];
      }

      model Parent {
        @OpenAPI.extension("x-someFieldAttr", true)
        children?: Child[];
      }

      model Child {
        @OpenAPI.extension("x-someFieldAttr", true)
        parents?: Parent[];
      }
      `,
    );

    deepStrictEqual(res.components.schemas.Parent.properties.children, {
      type: "array",
      items: { $ref: "#/components/schemas/Child" },
      "x-someFieldAttr": true,
    });
    deepStrictEqual(res.components.schemas.Child.properties.parents, {
      type: "array",
      items: { $ref: "#/components/schemas/Parent" },
      "x-someFieldAttr": true,
    });
  });

  it("define a named array using model is", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model PetNames is string[] {}
      model Pet { names: PetNames };
      `,
    );

    ok(res.isRef);
    ok(res.schemas.PetNames, "expected definition named myArray");
    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.PetNames, {
      type: "array",
      items: { type: "string" },
    });
  });

  it("named array applies doc", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      @doc("This is a doc for PetNames")
      model PetNames is string[] {}
      model Pet { names: PetNames };
      `,
    );
    deepStrictEqual(res.schemas.PetNames.description, "This is a doc for PetNames");
  });

  it("can specify minItems using @minItems decorator", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet {
        @minItems(1)
        names: string[]
      };
      `,
    );

    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.Pet.properties.names, {
      type: "array",
      minItems: 1,
      items: { type: "string" },
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
      `,
    );

    ok(res.schemas.Pet, "expected definition named Pet");
    deepStrictEqual(res.schemas.Pet.properties.names, {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
    });
  });

  it("can specify minItems using @minItems decorator (on array model)", async () => {
    const res = await oapiForModel(
      "Names",
      `
      @minItems(1)
      model Names is string[];
      `,
    );

    deepStrictEqual(res.schemas.Names, {
      type: "array",
      minItems: 1,
      items: { type: "string" },
    });
  });

  it("can specify maxItems using @maxItems decorator  (on array model)", async () => {
    const res = await oapiForModel(
      "Names",
      `
      @maxItems(3)
      model Names is string[];
      `,
    );

    deepStrictEqual(res.schemas.Names, {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
    });
  });

  it("can specify array defaults using tuple syntax", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet {
        names: string[] = #["bismarck"];
        decimals: decimal[] = #[123, 456.7];
        decimal128s: decimal128[] = #[123, 456.7];
      };
      `,
    );

    deepStrictEqual(res.schemas.Pet.properties.names, {
      type: "array",
      items: { type: "string" },
      default: ["bismarck"],
    });

    deepStrictEqual(res.schemas.Pet.properties.decimals, {
      type: "array",
      items: { type: "number", format: "decimal" },
      default: [123, 456.7],
    });

    deepStrictEqual(res.schemas.Pet.properties.decimal128s, {
      type: "array",
      items: { type: "number", format: "decimal128" },
      default: [123, 456.7],
    });
  });

  it("can specify array defaults using tuple syntax (LEGACY)", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet {
        #suppress "deprecated" "for testing"
        names: string[] = ["bismarck"];
        #suppress "deprecated" "for testing"
        decimals: decimal[] = [123, 456.7];
        #suppress "deprecated" "for testing"
        decimal128s: decimal128[] = [123, 456.7];
      };
      `,
    );

    deepStrictEqual(res.schemas.Pet.properties.names, {
      type: "array",
      items: { type: "string" },
      default: ["bismarck"],
    });

    deepStrictEqual(res.schemas.Pet.properties.decimals, {
      type: "array",
      items: { type: "number", format: "decimal" },
      default: [123, 456.7],
    });

    deepStrictEqual(res.schemas.Pet.properties.decimal128s, {
      type: "array",
      items: { type: "number", format: "decimal128" },
      default: [123, 456.7],
    });
  });

  it("supports summary", async () => {
    const res = await oapiForModel(
      "Foo",
      `
      @summary("FooArray")
      model Foo is string[];
      `,
    );

    strictEqual(res.schemas.Foo.title, "FooArray");
  });

  it("can specify tuple defaults using tuple syntax", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet {
        names: [string, int32] = #["bismarck", 12];
        decimals: [string, decimal] = #["hi", 456.7];
        decimal128s: [string, decimal128] = #["hi", 456.7];
      };
      `,
    );

    deepStrictEqual(res.schemas.Pet.properties.names, {
      type: "array",
      items: {},
      default: ["bismarck", 12],
    });

    deepStrictEqual(res.schemas.Pet.properties.decimals, {
      type: "array",
      items: {},
      default: ["hi", 456.7],
    });

    deepStrictEqual(res.schemas.Pet.properties.decimal128s, {
      type: "array",
      items: {},
      default: ["hi", 456.7],
    });
  });
});
