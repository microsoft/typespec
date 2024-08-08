import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { diagnoseOpenApiFor, oapiForModel, openApiFor } from "./test-host.js";

describe("openapi3: union type", () => {
  it("handles discriminated unions", async () => {
    const res = await openApiFor(
      `
      model A {
        type: "ay";
        a: string;
      }

      model B {
        type: "bee";
        b: string;
      }

      @discriminator("type")
      union AorB {
        a: A,
        b: B
      }

      op foo(x: AorB): { thing: AorB };
      `
    );

    deepStrictEqual(res.components.schemas.AorB, {
      anyOf: [
        {
          $ref: "#/components/schemas/A",
        },
        {
          $ref: "#/components/schemas/B",
        },
      ],
      discriminator: {
        propertyName: "type",
        mapping: {
          ay: "#/components/schemas/A",
          bee: "#/components/schemas/B",
        },
      },
    });
  });

  it("handles discriminated unions with enum typed fields", async () => {
    const res = await openApiFor(
      `
      enum Types {
        A;
        B: "bee";
      }
      model A {
        type: Types.A;
        a: string;
      }

      model B {
        type: Types.B;
        b: string;
      }

      @discriminator("type")
      union AorB {
        a: A,
        b: B
      }

      op foo(x: AorB): { thing: AorB };
      `
    );

    deepStrictEqual(res.components.schemas.AorB, {
      anyOf: [
        {
          $ref: "#/components/schemas/A",
        },
        {
          $ref: "#/components/schemas/B",
        },
      ],
      discriminator: {
        propertyName: "type",
        mapping: {
          A: "#/components/schemas/A",
          bee: "#/components/schemas/B",
        },
      },
    });
  });

  describe("union literals", () => {
    it("produce an enum from union of string literal", async () => {
      const res = await openApiFor(
        `
        model Pet {
          prop: "a" | "b";
        };
        `
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
        `
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
        `
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
        `
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

  it("defines nullable properties with multiple variants", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet {
        name: int32 | string | null;
      };
      `
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
    `
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

  it("handles unions of heterogenous types", async () => {
    const res = await oapiForModel(
      "X",
      `
      model C {}
      model X {
        prop: 1 | C;
        prop2: C | 1; 
      }
      `
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
      `
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

  it("handles union declarations with anonymous variants", async () => {
    const res = await openApiFor(
      `
      model A {
        type: "ay";
        a: string;
      }

      model B {
        type: "bee";
        b: string;
      }

      @discriminator("type")
      union AorB {
        A,
        B
      }

      op foo(x: AorB): { thing: AorB };
      `
    );

    deepStrictEqual(res.components.schemas.AorB, {
      anyOf: [
        {
          $ref: "#/components/schemas/A",
        },
        {
          $ref: "#/components/schemas/B",
        },
      ],
      discriminator: {
        propertyName: "type",
        mapping: {
          ay: "#/components/schemas/A",
          bee: "#/components/schemas/B",
        },
      },
    });
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
      `
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
        type: "ay";
        a: string;
        @visibility("create")
        onACreate: string;
      }

      model B {
        type: "bee";
        b: string;
        @visibility("create")
        onBCreate: string;
      }

      @discriminator("type")
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
      anyOf: [
        {
          $ref: "#/components/schemas/A",
        },
        {
          $ref: "#/components/schemas/B",
        },
      ],
      discriminator: {
        propertyName: "type",
        mapping: {
          ay: "#/components/schemas/A",
          bee: "#/components/schemas/B",
        },
      },
    });
    deepStrictEqual(res.components.schemas.AorBCreate, {
      anyOf: [
        {
          $ref: "#/components/schemas/ACreate",
        },
        {
          $ref: "#/components/schemas/BCreate",
        },
      ],
      discriminator: {
        propertyName: "type",
        mapping: {
          ay: "#/components/schemas/ACreate",
          bee: "#/components/schemas/BCreate",
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

      `
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
      `
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
      }`
    );

    strictEqual(res.schemas.Foo.description, "The possible types of things");
    strictEqual(res.schemas.Foo.anyOf.length, 2);
    for (const variant of res.schemas.Foo.anyOf) {
      strictEqual(variant.description, undefined);
    }
  });
});
