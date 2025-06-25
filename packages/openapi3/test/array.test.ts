import { deepStrictEqual, ok, strictEqual } from "assert";
import { it } from "vitest";
import { worksFor } from "./works-for.js";

worksFor(["3.0.0", "3.1.0"], ({ oapiForModel, openApiFor }) => {
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

  it("define named arrays with envelope names", async () => {
    const res = await openApiFor(
      `
      @service
      namespace Sample;
      namespace One {
        model PetNames is string[];
      }
      namespace Two {
        model PetNames is string[];
      }
      model Pets {
        one: One.PetNames;
        two: Two.PetNames;
      }
      `,
    );
    deepStrictEqual(res.components.schemas["One.PetNames"], {
      type: "array",
      items: { type: "string" },
    });
    deepStrictEqual(res.components.schemas["Two.PetNames"], {
      type: "array",
      items: { type: "string" },
    });
    deepStrictEqual(res.components.schemas.Pets.properties, {
      one: { $ref: "#/components/schemas/One.PetNames" },
      two: { $ref: "#/components/schemas/Two.PetNames" },
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

  it("can specify uniqueItems using @JsonSchema.uniqueItems decorator", async () => {
    const res = await oapiForModel(
      "Pets",
      `
      @JsonSchema.uniqueItems
      model Pets is Array<Pet>;
      model Pet {
        @JsonSchema.uniqueItems
        x: string[];
      }
      `,
    );

    deepStrictEqual(res.schemas.Pets, {
      type: "array",
      uniqueItems: true,
      items: { $ref: "#/components/schemas/Pet" },
    });

    deepStrictEqual(res.schemas.Pet.properties.x, {
      type: "array",
      uniqueItems: true,
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
});

worksFor(["3.0.0"], ({ oapiForModel }) => {
  it("can specify tuple defaults using tuple syntax (empty items)", async () => {
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

worksFor(["3.1.0"], ({ oapiForModel }) => {
  it("works with contains, minContains, and maxContains", async () => {
    const res = await oapiForModel(
      "Foo",
      `
      @JsonSchema.contains(string)
      @JsonSchema.minContains(1)
      @JsonSchema.maxContains(2)
      model Foo is Array<Bar>;
      model Bar {
        @JsonSchema.contains(string)
        @JsonSchema.minContains(1)
        @JsonSchema.maxContains(2)
        x: string[];
      }
      `,
    );

    deepStrictEqual(res.schemas.Foo, {
      type: "array",
      items: {
        $ref: "#/components/schemas/Bar",
      },
      contains: {
        type: "string",
      },
      minContains: 1,
      maxContains: 2,
    });

    deepStrictEqual(res.schemas.Bar.properties.x, {
      type: "array",
      items: {
        type: "string",
      },
      contains: {
        type: "string",
      },
      minContains: 1,
      maxContains: 2,
    });
  });

  it("works with prefixItems", async () => {
    const res = await oapiForModel(
      "Foo",
      `
      @JsonSchema.prefixItems([string, { x?: string }, Foo])
      model Foo is Array<Bar>;
      model Bar {
        @JsonSchema.prefixItems([string, { x?: string }, Foo])
        x: string[];
      }
      `,
    );

    deepStrictEqual(res.schemas.Foo.prefixItems, [
      { type: "string" },
      { properties: { x: { type: "string" } }, type: "object" },
      { $ref: "#/components/schemas/Foo" },
    ]);

    deepStrictEqual(res.schemas.Bar.properties.x.prefixItems, [
      { type: "string" },
      { properties: { x: { type: "string" } }, type: "object" },
      { $ref: "#/components/schemas/Foo" },
    ]);
  });

  it("can specify tuple defaults using tuple syntax (prefix items)", async () => {
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
      prefixItems: [{ type: "string" }, { type: "integer", format: "int32" }],
      default: ["bismarck", 12],
    });

    deepStrictEqual(res.schemas.Pet.properties.decimals, {
      type: "array",
      prefixItems: [{ type: "string" }, { type: "number", format: "decimal" }],
      default: ["hi", 456.7],
    });

    deepStrictEqual(res.schemas.Pet.properties.decimal128s, {
      type: "array",
      prefixItems: [{ type: "string" }, { type: "number", format: "decimal128" }],
      default: ["hi", 456.7],
    });
  });

  it("can specify tuple with constants", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet {
        names: ["bismark", 32];
      };
      `,
    );

    deepStrictEqual(res.schemas.Pet.properties.names, {
      type: "array",
      prefixItems: [
        { type: "string", enum: ["bismark"] },
        { type: "number", enum: [32] },
      ],
    });
  });
});
