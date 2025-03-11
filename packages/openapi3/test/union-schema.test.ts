import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { worksFor } from "./works-for.js";

worksFor(["3.0.0", "3.1.0"], ({ diagnoseOpenApiFor, oapiForModel, openApiFor }) => {
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

    describe("null and another single variant produce allOf except for scalars", () => {
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

      it("throws diagnostics for null enum definitions", async () => {
        const diagnostics = await diagnoseOpenApiFor(`union Pet {null}`);

        expectDiagnostics(diagnostics, {
          code: "@typespec/openapi3/union-null",
          message: "Cannot have a union containing only null types.",
        });
      });
    });

    describe("null and another single scalar produce inline schema", () => {
      it("should keep original type", async () => {
        const openApi = await openApiFor(`
        scalar Str extends string;
        model Test {a: Str | null}
      `);
        expect(openApi.components.schemas.Test.properties.a).toEqual({
          type: "string",
          nullable: true,
        });
      });

      it("should carry constraints on union", async () => {
        const openApi = await openApiFor(`
        scalar Num extends int32;
        @minValue(1)
        @maxValue(2)
        union u { Num, null }
      `);
        expect(openApi.components.schemas.u).toEqual({
          minimum: 1,
          maximum: 2,
          type: "integer",
          format: "int32",
          nullable: true,
        });
      });

      it("should carry all constraints on union and its members", async () => {
        const openApi = await openApiFor(`
        @minValue(3)
        scalar Num extends int32;
        @minValue(2)
        union u { Num, null }
      `);
        expect(openApi.components.schemas.u).toEqual({
          allOf: [
            {
              minimum: 3,
              type: "integer",
              format: "int32",
              nullable: true,
            },
          ],
          minimum: 2,
        });
      });

      it("should carry metadata on union members", async () => {
        const openApi = await openApiFor(`
        /** this is my str */
        scalar Str1 extends string;
        scalar Str2 extends Str1;
        model Test {a: Str2 | null}
      `);
        expect(openApi.components.schemas.Str1).toEqual({
          description: "this is my str",
          type: "string",
        });
        expect(openApi.components.schemas.Str2).toEqual({
          description: "this is my str",
          type: "string",
        });
        expect(openApi.components.schemas.Test.properties.a).toEqual({
          description: "this is my str",
          type: "string",
          nullable: true,
        });
      });

      it("should carry metadata on union declaration and its members", async () => {
        const openApi = await openApiFor(`
        /** this is my str */
        scalar Str1 extends string;
        scalar Str2 extends Str1;
        /** this is my union */
        union Test {Str2, null}
      `);
        expect(openApi.components.schemas.Str1).toEqual({
          description: "this is my str",
          type: "string",
        });
        expect(openApi.components.schemas.Str2).toEqual({
          description: "this is my str",
          type: "string",
        });
        expect(openApi.components.schemas.Test.description).toBeDefined();
        expect(openApi.components.schemas.Test.description).toBe("this is my union");
      });
    });

    describe("null and another multiple scalars produce inline schemas", () => {
      it("should keep original types", async () => {
        const openApi = await openApiFor(`
        scalar Str extends string;
        scalar Num extends int32;
        model Test {a: Str | Num | null}
      `);
        expect(openApi.components.schemas.Test.properties.a).toEqual({
          anyOf: [
            {
              type: "string",
              nullable: true,
            },
            {
              type: "integer",
              format: "int32",
              nullable: true,
            },
          ],
        });
      });

      it("should carry constraints on union declaration and its members", async () => {
        const openApi = await openApiFor(`
        @minValue(2)
        scalar Num extends int32;
        @maxLength(33)
        scalar Str extends string;
        @minValue(1)
        @maxLength(100)
        union u { Num, Str, null }
      `);
        expect(openApi.components.schemas.u).toEqual({
          anyOf: [
            {
              minimum: 2,
              type: "integer",
              format: "int32",
              nullable: true,
            },
            {
              maxLength: 33,
              type: "string",
              nullable: true,
            },
          ],
          minimum: 1,
          maxLength: 100,
        });
      });

      it("should carry constraints on anonymous union and its members", async () => {
        const openApi = await openApiFor(`
        @minValue(2)
        scalar Num extends int32;
        @maxLength(33)
        scalar Str extends string;
        model Test { 
          @minValue(1)
          @maxLength(100)
          a: Num | Str | null
        }
      `);
        expect(openApi.components.schemas.Test.properties.a).toEqual({
          anyOf: [
            {
              minimum: 2,
              type: "integer",
              format: "int32",
              nullable: true,
            },
            {
              maxLength: 33,
              type: "string",
              nullable: true,
            },
          ],
          minimum: 1,
          maxLength: 100,
        });
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
