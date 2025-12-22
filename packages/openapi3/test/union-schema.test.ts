import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { supportedVersions, worksFor } from "./works-for.js";

worksFor(supportedVersions, ({ diagnoseOpenApiFor, oapiForModel, openApiFor }) => {
  describe("discriminated unions", () => {
    it("use object envelope", async () => {
      const res = await openApiFor(
        `
        model A {
          a: string;
        }
  
        model B {
          b: string;
        }
  
        @discriminated
        union AorB {
          a: A,
          b: B
        }
        `,
      );

      deepStrictEqual(res.components.schemas.AorB, {
        type: "object",
        oneOf: [{ $ref: "#/components/schemas/AorBA" }, { $ref: "#/components/schemas/AorBB" }],
        discriminator: {
          propertyName: "kind",
          mapping: {
            a: "#/components/schemas/AorBA",
            b: "#/components/schemas/AorBB",
          },
        },
      });

      deepStrictEqual(res.components.schemas.AorBA, {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["a"] },
          value: { $ref: "#/components/schemas/A" },
        },
        required: ["kind", "value"],
      });
      deepStrictEqual(res.components.schemas.AorBB, {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["b"] },
          value: { $ref: "#/components/schemas/B" },
        },
        required: ["kind", "value"],
      });
    });

    it("envelope none", async () => {
      const res = await openApiFor(
        `
        model A {
          a: string;
        }
  
        model B {
          b: string;
        }
  
        @discriminated(#{envelope: "none"})
        union AorB {
          a: A,
          b: B
        }
        `,
      );

      deepStrictEqual(res.components.schemas.AorB, {
        type: "object",
        oneOf: [{ $ref: "#/components/schemas/A" }, { $ref: "#/components/schemas/B" }],
        discriminator: {
          propertyName: "kind",
          mapping: {
            a: "#/components/schemas/A",
            b: "#/components/schemas/B",
          },
        },
      });
    });

    it("apply name suffixes to synthetic envelope types", async () => {
      const res = await openApiFor(
        `
        model A {
          a: string;
          @visibility(Lifecycle.Read)
          ro: string;
        }
  
        model B {
          b: string;
          @visibility(Lifecycle.Create)
          co: string;
        }
  
        @discriminated
        union U {
          a: A,
          b: B,
        }

        @put op update(@body data: U): U;
        `,
      );

      // Union schemas
      deepStrictEqual(res.components.schemas.U, {
        type: "object",
        oneOf: [{ $ref: "#/components/schemas/UA" }, { $ref: "#/components/schemas/UB" }],
        discriminator: {
          propertyName: "kind",
          mapping: {
            a: "#/components/schemas/UA",
            b: "#/components/schemas/UB",
          },
        },
      });
      deepStrictEqual(res.components.schemas["UA"], {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["a"] },
          value: { $ref: "#/components/schemas/A" },
        },
        required: ["kind", "value"],
      });
      deepStrictEqual(res.components.schemas["UB"], {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["b"] },
          value: { $ref: "#/components/schemas/B" },
        },
        required: ["kind", "value"],
      });

      deepStrictEqual(res.components.schemas["UCreateOrUpdate"], {
        type: "object",
        oneOf: [
          { $ref: "#/components/schemas/UA" },
          { $ref: "#/components/schemas/UBCreateOrUpdate" },
        ],
        discriminator: {
          propertyName: "kind",
          mapping: {
            a: "#/components/schemas/UA",
            b: "#/components/schemas/UBCreateOrUpdate",
          },
        },
      });
      deepStrictEqual(res.components.schemas["UBCreateOrUpdate"], {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["b"] },
          value: { $ref: "#/components/schemas/BCreateOrUpdate" },
        },
        required: ["kind", "value"],
      });

      // Model schemas
      deepStrictEqual(res.components.schemas["A"], {
        type: "object",
        properties: {
          a: { type: "string" },
          ro: { type: "string", readOnly: true },
        },
        required: ["a", "ro"],
      });
      deepStrictEqual(res.components.schemas["B"], {
        type: "object",
        properties: {
          b: { type: "string" },
        },
        required: ["b"],
      });
      deepStrictEqual(res.components.schemas["BCreateOrUpdate"], {
        type: "object",
        properties: {
          b: { type: "string" },
          co: { type: "string" },
        },
        required: ["b", "co"],
      });

      // Routes
      deepStrictEqual(res.paths["/"].put.requestBody.content["application/json"].schema, {
        $ref: "#/components/schemas/UCreateOrUpdate",
      });
      deepStrictEqual(res.paths["/"].put.responses["200"].content["application/json"].schema, {
        $ref: "#/components/schemas/U",
      });
    });

    it("default variant with envelope: none (all versions)", async () => {
      const res = await openApiFor(
        `
        @discriminated(#{discriminatorPropertyName: "taxonomic_family", envelope: "none"})
        union Animal {
          Dog,
          felidae: Cat,
          muscidae: Ferret
        }

        model Dog {
          taxonomic_family: "canidae";
        }

        model Cat {
          taxonomic_family: "felidae";
        }

        model Ferret {
          taxonomic_family: "muscidae";
        }

        op read(): { @body body: Animal };
        `,
      );

      // Dog should be in oneOf even though it's the default variant
      ok(res.components.schemas.Animal.oneOf, "expected oneOf in Animal schema");
      deepStrictEqual(res.components.schemas.Animal.oneOf, [
        { $ref: "#/components/schemas/Cat" },
        { $ref: "#/components/schemas/Ferret" },
        { $ref: "#/components/schemas/Dog" },
      ]);

      // For versions < 3.2, canidae should be in the mapping
      ok(res.components.schemas.Animal.discriminator, "expected discriminator");
      deepStrictEqual(res.components.schemas.Animal.discriminator.propertyName, "taxonomic_family");

      // For versions 3.0 and 3.1, canidae should be in the mapping
      if (res.openapi === "3.0.0" || res.openapi === "3.1.0") {
        deepStrictEqual(res.components.schemas.Animal.discriminator.mapping, {
          felidae: "#/components/schemas/Cat",
          muscidae: "#/components/schemas/Ferret",
          canidae: "#/components/schemas/Dog",
        });
      } else {
        // For version 3.2.0, canidae should NOT be in mapping
        deepStrictEqual(res.components.schemas.Animal.discriminator.mapping, {
          felidae: "#/components/schemas/Cat",
          muscidae: "#/components/schemas/Ferret",
        });
        // Instead, it should be in defaultMapping
        deepStrictEqual(
          res.components.schemas.Animal.discriminator.defaultMapping,
          "#/components/schemas/Dog",
        );
      }
    });
  });

  describe("union literals", () => {
    it("produce an enum from union of string literal", async () => {
      const res = await openApiFor(
        `
        model Pet {
          prop: "a" | "b";
        };
        `,
      );
      deepStrictEqual(res.components.schemas.Pet.properties.prop, {
        type: "string",
        enum: ["a", "b"],
      });
    });
    it("produce an enum from union of numeric literal", async () => {
      const res = await openApiFor(
        `
        model Pet {
          prop: 0 | 1;
        };
        `,
      );
      deepStrictEqual(res.components.schemas.Pet.properties.prop, {
        type: "number",
        enum: [0, 1],
      });
    });

    // Regression test for https://github.com/microsoft/typespec/issues/3087
    it("string literals union with same variants don't conflict", async () => {
      const res = await openApiFor(
        `
        model Pet {
          prop1: "a" | "b";
          prop2: "a" | "b";
        }
        `,
      );
      deepStrictEqual(res.components.schemas.Pet.properties.prop1, {
        type: "string",
        enum: ["a", "b"],
      });
      deepStrictEqual(res.components.schemas.Pet.properties.prop2, {
        type: "string",
        enum: ["a", "b"],
      });
    });
    // Regression test for https://github.com/microsoft/typespec/issues/3087
    it("numeric literals union with same variants don't conflict", async () => {
      const res = await openApiFor(
        `
        model Pet {
          prop1: 0 | 1;
          prop2: 0 | 1;
        }
        `,
      );
      deepStrictEqual(res.components.schemas.Pet.properties.prop1, {
        type: "number",
        enum: [0, 1],
      });
      deepStrictEqual(res.components.schemas.Pet.properties.prop2, {
        type: "number",
        enum: [0, 1],
      });
    });
  });

  it("handles unions of heterogenous types", async () => {
    const res = await oapiForModel(
      "X",
      `
      model C {}
      model X {
        prop: 1 | C;
        prop2: C | 1; 
      }
      `,
    );
    ok(res.isRef);
    deepStrictEqual(res.schemas.X.properties.prop.anyOf, [
      {
        type: "number",
        enum: [1],
      },
      {
        $ref: "#/components/schemas/C",
      },
    ]);
    deepStrictEqual(res.schemas.X.properties.prop2.anyOf, [
      {
        $ref: "#/components/schemas/C",
      },
      {
        type: "number",
        enum: [1],
      },
    ]);
  });

  it("handles unions of different primitive types", async () => {
    const res = await oapiForModel(
      "X",
      `
      model X {
        prop: 1 | "string"
      }
      `,
    );
    ok(res.isRef);
    deepStrictEqual(res.schemas.X.properties.prop.anyOf, [
      {
        type: "number",
        enum: [1],
      },
      {
        type: "string",
        enum: ["string"],
      },
    ]);
  });

  it("handles enum unions", async () => {
    const res = await oapiForModel(
      "X",
      `
      enum A {
        a: 1
      }
      
      enum B {
        b: 2
      }
      model X {
        prop: A | B
      }
      `,
    );
    ok(res.isRef);
    deepStrictEqual(res.schemas.X.properties.prop.anyOf, [
      {
        $ref: "#/components/schemas/A",
      },
      {
        $ref: "#/components/schemas/B",
      },
    ]);
  });

  it("handles discriminated union mapping with multiple visibilities", async () => {
    const res = await openApiFor(`
      model A {
        a: string;
        @visibility(Lifecycle.Create)
        onACreate: string;
      }

      model B {
        b: string;
        @visibility(Lifecycle.Create)
        onBCreate: string;
      }

      @discriminated(#{envelope: "none"})
      union AorB {
        a: A,
        b: B
      }

      model Data {
        thing: AorB
      }

      @get
      op getFoo(): Data;
      @post
      op postFoo(@body data: Data): Data;
    `);

    deepStrictEqual(res.components.schemas.AorB, {
      oneOf: [
        {
          $ref: "#/components/schemas/A",
        },
        {
          $ref: "#/components/schemas/B",
        },
      ],
      type: "object",
      discriminator: {
        propertyName: "kind",
        mapping: {
          a: "#/components/schemas/A",
          b: "#/components/schemas/B",
        },
      },
    });
    deepStrictEqual(res.components.schemas.AorBCreate, {
      oneOf: [
        {
          $ref: "#/components/schemas/ACreate",
        },
        {
          $ref: "#/components/schemas/BCreate",
        },
      ],
      type: "object",
      discriminator: {
        propertyName: "kind",
        mapping: {
          a: "#/components/schemas/ACreate",
          b: "#/components/schemas/BCreate",
        },
      },
    });
  });

  it("handles unions defined in a namespace", async () => {
    const res = await openApiFor(`
      namespace Foo {
        model A {
          foo: string;
        }
      }

      namespace Bar {
        model A {
          bar: string;
        }
      }

      namespace Baz {
        union A {
          foo: Foo.A,
          bar: Bar.A
        }
      }

      @get
      op getFoo(data: Baz.A): {};
    `);

    deepStrictEqual(res.components.schemas["Foo.A"], {
      properties: {
        foo: {
          type: "string",
        },
      },
      required: ["foo"],
      type: "object",
    });

    deepStrictEqual(res.components.schemas["Bar.A"], {
      properties: {
        bar: {
          type: "string",
        },
      },
      required: ["bar"],
      type: "object",
    });

    deepStrictEqual(res.components.schemas["Baz.A"], {
      anyOf: [
        {
          $ref: "#/components/schemas/Foo.A",
        },
        {
          $ref: "#/components/schemas/Bar.A",
        },
      ],
    });
  });

  it("throws diagnostics for empty enum definitions", async () => {
    const diagnostics = await diagnoseOpenApiFor(`union Pet {}`);

    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/empty-union",
      message:
        "Empty unions are not supported for OpenAPI v3 - enums must have at least one value.",
    });
  });

  it("supports description on unions that reduce to enums", async () => {
    const res = await oapiForModel(
      "Foo",
      `
      @doc("FooUnion")
      union Foo {
        "a";
        "b";
      }

      `,
    );
    strictEqual(res.schemas.Foo.description, "FooUnion");
  });

  it("supports summary on unions and union variants", async () => {
    const res = await oapiForModel(
      "Foo",
      `
      @summary("FooUnion")
      union Foo {
        int32;

        Bar;
      }

      @summary("BarUnion")
      union Bar {
        string;
      }
      `,
    );
    strictEqual(res.schemas.Foo.title, "FooUnion");
    strictEqual(res.schemas.Bar.title, "BarUnion");
  });

  it("does not duplicate top-level description on union members", async () => {
    const res = await oapiForModel(
      "Foo",
      `
      @doc("The possible types of things")
      union Foo {
        string,

        bar: "bar",
        buzz: "buzz",
      }`,
    );

    strictEqual(res.schemas.Foo.description, "The possible types of things");
    strictEqual(res.schemas.Foo.anyOf.length, 2);
    for (const variant of res.schemas.Foo.anyOf) {
      strictEqual(variant.description, undefined);
    }
  });
});

worksFor(["3.0.0"], ({ diagnoseOpenApiFor, oapiForModel, openApiFor }) => {
  describe("openapi 3.0.0 union with null", () => {
    it("defines nullable properties with multiple variants", async () => {
      const res = await oapiForModel(
        "Pet",
        `
        model Pet {
          name: int32 | string | null;
        };
        `,
      );
      ok(res.isRef);
      ok(res.schemas.Pet.properties.name.nullable);
      deepStrictEqual(res.schemas.Pet.properties.name.anyOf, [
        {
          type: "integer",
          format: "int32",
        },
        {
          type: "string",
        },
      ]);
    });

    it("defines enums with a nullable variant", async () => {
      const res = await oapiForModel(
        "Pet",
        `
        model Pet {
          type: "cat" | "dog" | null;
        };
        `,
      );
      ok(res.isRef);
      deepStrictEqual(res.schemas.Pet, {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["cat", "dog"],
            nullable: true,
          },
        },
        required: ["type"],
      });
    });

    it("type property should always be set when nullable property is present", async () => {
      const openApi = await openApiFor(`
      scalar MyStr extends string;
      model Foo {};
      model A {
        x: MyStr |Foo| null;
      }
      `);
      deepStrictEqual(openApi.components.schemas.A.properties, {
        x: {
          anyOf: [
            {
              type: "string",
              allOf: [{ $ref: "#/components/schemas/MyStr" }],
              nullable: true,
            },
            {
              type: "object",
              allOf: [{ $ref: "#/components/schemas/Foo" }],
              nullable: true,
            },
          ],
        },
      });
    });

    it("scalar type property should always be set when nullable property is present", async () => {
      const openApi = await openApiFor(`
      model Foo {};
      model A {
        x: Foo |string| null;
      }
      `);
      deepStrictEqual(openApi.components.schemas.A.properties, {
        x: {
          anyOf: [
            {
              type: "object",
              allOf: [{ $ref: "#/components/schemas/Foo" }],
              nullable: true,
            },
            {
              type: "string",
              nullable: true,
            },
          ],
        },
      });
    });

    describe("scalar type property that extends std scalar should always be set as corresponding JSON type when nullable property is present", () => {
      it.each([
        ["bytes", "string"],
        ["numeric", "number"],
        ["integer", "integer"],
        ["int8", "integer"],
        ["int16", "integer"],
        ["int32", "integer"],
        ["int64", "integer"],
        ["safeint", "integer"],
        ["uint8", "integer"],
        ["uint16", "integer"],
        ["uint32", "integer"],
        ["uint64", "integer"],
        ["float", "number"],
        ["float32", "number"],
        ["float64", "number"],
        ["decimal", "number"],
        ["decimal128", "number"],
        ["string", "string"],
        ["boolean", "boolean"],
        ["plainDate", "string"],
        ["utcDateTime", "string"],
        ["offsetDateTime", "string"],
        ["plainTime", "string"],
        ["duration", "string"],
        ["url", "string"],
      ])("%s", async (scalarDeclaration: string, expectedType: string) => {
        const openApi = await openApiFor(`
      scalar StdScalar extends ${scalarDeclaration};
      model A {
        x: StdScalar | null;
      }
      `);
        expect(openApi.components.schemas.A.properties.x.type).toEqual(expectedType);
      });
    });

    describe("null and another single variant produce allOf", () => {
      it.each([
        ["model", "model Other {}"],
        ["enum", "enum Other {a, b}"],
      ])("%s variant", async (_, code) => {
        const openApi = await openApiFor(`
      union Test { Other, null }
      ${code}
      `);

        expect(openApi.components.schemas.Test).toMatchObject({
          allOf: [{ $ref: "#/components/schemas/Other" }],
          nullable: true,
        });
      });
    });

    it("throws diagnostics for null enum definitions", async () => {
      const diagnostics = await diagnoseOpenApiFor(`union Pet {null}`);

      expectDiagnostics(diagnostics, {
        code: "@typespec/openapi3/union-null",
        message: "Cannot have a union containing only null types.",
      });
    });
  });

  describe("union templates", () => {
    it("can be referenced from a property", async () => {
      const res = await openApiFor(
        `
        union U<T> { "a", T }
        model Pet {
          prop: U<"b">;
        };
        `,
      );
      expect(res.components.schemas.Pet.properties.prop).toEqual({
        type: "string",
        enum: ["a", "b"],
      });
    });
    it("can be referenced in another union", async () => {
      const res = await openApiFor(
        `
        union U<T> { "a", T }
        union A {string, U<"b"> }
        `,
      );
      expect(res.components.schemas.A).toEqual({
        anyOf: [{ type: "string" }, { type: "string", enum: ["a", "b"] }],
      });
    });
    it("can be used in operation response", async () => {
      const res = await openApiFor(
        `
        union U<T> { "a", T }
        op test(): U<"b">;
        `,
      );
      expect(res.paths["/"].get.responses["200"].content["text/plain"].schema).toEqual({
        anyOf: [
          { type: "string", enum: ["a"] },
          { type: "string", enum: ["b"] },
        ],
      });
    });
  });
});

worksFor(["3.1.0"], ({ oapiForModel, openApiFor }) => {
  describe("openapi 3.1.0 union with null", () => {
    it("defines nullable properties with multiple variants", async () => {
      const res = await oapiForModel(
        "Pet",
        `
      model Pet {
        name: int32 | string | null;
      };
      `,
      );
      ok(res.isRef);
      deepStrictEqual(res.schemas.Pet.properties.name.anyOf, [
        {
          type: "integer",
          format: "int32",
        },
        {
          type: "string",
        },
        {
          type: "null",
        },
      ]);
    });

    it("defines enums with a nullable variant", async () => {
      const res = await oapiForModel(
        "Pet",
        `
      model Pet {
        type: "cat" | "dog" | null;
      };
    `,
      );
      ok(res.isRef);
      deepStrictEqual(res.schemas.Pet, {
        type: "object",
        properties: {
          type: {
            anyOf: [
              {
                type: "string",
                enum: ["cat", "dog"],
              },
              {
                type: "null",
              },
            ],
          },
        },
        required: ["type"],
      });
    });

    it("supports refs and nullable property present", async () => {
      const openApi = await openApiFor(`
      scalar MyStr extends string;
      model Foo {};
      model A {
        x: MyStr | Foo | null;
      }
      `);
      deepStrictEqual(openApi.components.schemas.A.properties, {
        x: {
          anyOf: [
            {
              $ref: "#/components/schemas/MyStr",
            },
            {
              $ref: "#/components/schemas/Foo",
            },
            {
              type: "null",
            },
          ],
        },
      });
    });

    describe("null and another single variant produce anyOf", () => {
      it.each([
        ["model", "model Other {}"],
        ["enum", "enum Other {a, b}"],
      ])("%s variant", async (_, code) => {
        const openApi = await openApiFor(`
        union Test { Other, null }
        ${code}
        `);

        expect(openApi.components.schemas.Test).toMatchObject({
          anyOf: [{ $ref: "#/components/schemas/Other" }, { type: "null" }],
        });
      });
    });

    it("supports null enum definitions", async () => {
      const openApi = await openApiFor(`union Pet {null}`);

      deepStrictEqual(openApi.components.schemas.Pet, {
        type: "null",
      });
    });
  });
});

// Test OpenAPI 3.2.0-specific features
import { OpenAPISpecHelpers } from "./works-for.js";

describe("openapi3: discriminated union defaultMapping (3.2.0)", () => {
  const { openApiFor } = OpenAPISpecHelpers["3.2.0"];

  it("default variant uses defaultMapping in OpenAPI 3.2.0", async () => {
    const res = await openApiFor(
      `
      @discriminated(#{discriminatorPropertyName: "taxonomic_family", envelope: "none"})
      union Animal {
        Dog,
        felidae: Cat,
        muscidae: Ferret
      }

      model Dog {
        taxonomic_family: "canidae";
      }

      model Cat {
        taxonomic_family: "felidae";
      }

      model Ferret {
        taxonomic_family: "muscidae";
      }

      op read(): { @body body: Animal };
      `,
    );

    // Dog should be in oneOf
    ok(res.components.schemas.Animal.oneOf, "expected oneOf in Animal schema");
    deepStrictEqual(res.components.schemas.Animal.oneOf, [
      { $ref: "#/components/schemas/Cat" },
      { $ref: "#/components/schemas/Ferret" },
      { $ref: "#/components/schemas/Dog" },
    ]);

    // In OpenAPI 3.2, defaultMapping should be used instead of putting canidae in mapping
    ok(res.components.schemas.Animal.discriminator, "expected discriminator");
    deepStrictEqual(res.components.schemas.Animal.discriminator, {
      propertyName: "taxonomic_family",
      defaultMapping: "#/components/schemas/Dog",
      mapping: {
        felidae: "#/components/schemas/Cat",
        muscidae: "#/components/schemas/Ferret",
      },
    });
  });

  it("default variant without discriminator property uses defaultMapping", async () => {
    const res = await openApiFor(
      `
      @discriminated(#{discriminatorPropertyName: "kind", envelope: "none"})
      union Pet {
        DefaultPet,
        cat: Cat,
        dog: Dog
      }

      model DefaultPet {
        name: string;
      }

      model Cat {
        kind: "cat";
        meow: int32;
      }

      model Dog {
        kind: "dog";
        bark: string;
      }

      op read(): { @body body: Pet };
      `,
    );

    // DefaultPet should be in oneOf
    ok(res.components.schemas.Pet.oneOf, "expected oneOf in Pet schema");
    deepStrictEqual(res.components.schemas.Pet.oneOf, [
      { $ref: "#/components/schemas/Cat" },
      { $ref: "#/components/schemas/Dog" },
      { $ref: "#/components/schemas/DefaultPet" },
    ]);

    // In OpenAPI 3.2, defaultMapping should point to DefaultPet
    ok(res.components.schemas.Pet.discriminator, "expected discriminator");
    deepStrictEqual(res.components.schemas.Pet.discriminator, {
      propertyName: "kind",
      defaultMapping: "#/components/schemas/DefaultPet",
      mapping: {
        cat: "#/components/schemas/Cat",
        dog: "#/components/schemas/Dog",
      },
    });
  });
});
