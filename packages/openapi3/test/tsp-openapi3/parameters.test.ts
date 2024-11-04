import { getDocData, Numeric } from "@typespec/compiler";
import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { ok } from "assert";
import { assert, describe, expect, it } from "vitest";
import { expectDecorators } from "./utils/expect.js";
import { compileForOpenAPI3, tspForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

describe("converts top-level parameters", () => {
  it.each(["query", "header", "path"] as const)(`Supports location: %s`, async (location) => {
    const serviceNamespace = await tspForOpenAPI3({
      parameters: {
        Foo: {
          name: "foo",
          in: location,
          required: true,
          schema: {
            type: "string",
          },
        },
      },
    });

    const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
    assert(parametersNamespace, "Parameters namespace not found");

    const models = parametersNamespace.models;

    /* model Foo { @<location> foo: string, } */
    const Foo = models.get("Foo");
    assert(Foo, "Foo model not found");
    expect(Foo.properties.size).toBe(1);
    expect(Foo.properties.get("foo")).toMatchObject({
      optional: false,
      type: { kind: "Scalar", name: "string" },
      decorators: [{ definition: { name: `@${location}` } }],
    });
  });

  it(`Supports string schema constraints`, async () => {
    const serviceNamespace = await tspForOpenAPI3({
      parameters: {
        Foo: {
          name: "foo",
          in: "query",
          required: true,
          schema: {
            type: "string",
            minLength: 3,
            maxLength: 10,
            pattern: "^[a-z]+$",
            format: "UUID",
          },
        },
      },
    });

    const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
    assert(parametersNamespace, "Parameters namespace not found");

    const models = parametersNamespace.models;

    /* model Foo { @query @format("UUID") @pattern("^[a-z]+$") @maxLength(10) @minLength(3) foo: string, } */
    const Foo = models.get("Foo");
    assert(Foo, "Foo model not found");
    expect(Foo.properties.size).toBe(1);
    expect(Foo.properties.get("foo")).toMatchObject({
      optional: false,
      type: { kind: "Scalar", name: "string" },
      decorators: [
        { definition: { name: "@query" } },
        { definition: { name: "@format" }, args: [{ jsValue: "UUID" }] },
        { definition: { name: "@pattern" }, args: [{ jsValue: "^[a-z]+$" }] },
        { definition: { name: "@maxLength" }, args: [{ jsValue: Numeric("10") }] },
        { definition: { name: "@minLength" }, args: [{ jsValue: Numeric("3") }] },
      ],
    });
  });

  it(`Supports numeric schema constraints`, async () => {
    const serviceNamespace = await tspForOpenAPI3({
      parameters: {
        Foo: {
          name: "foo",
          in: "query",
          required: true,
          schema: {
            type: "integer",
            minimum: 3,
            maximum: 10,
            format: "int32",
          },
        },
      },
    });

    const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
    assert(parametersNamespace, "Parameters namespace not found");

    const models = parametersNamespace.models;

    /* model Foo { @query @maxValue(10) @minValue(3) foo: string, } */
    const Foo = models.get("Foo");
    assert(Foo, "Foo model not found");
    expect(Foo.properties.size).toBe(1);
    expect(Foo.properties.get("foo")).toMatchObject({
      optional: false,
      type: { kind: "Scalar", name: "int32" },
      decorators: [
        { definition: { name: "@query" } },
        { definition: { name: "@maxValue" }, args: [{ jsValue: Numeric("10") }] },
        { definition: { name: "@minValue" }, args: [{ jsValue: Numeric("3") }] },
      ],
    });
  });

  it("supports optionality", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      parameters: {
        RequiredFoo: {
          name: "foo",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
        },
        OptionalFoo: {
          name: "foo",
          in: "query",
          schema: {
            type: "string",
          },
        },
      },
    });

    const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
    assert(parametersNamespace, "Parameters namespace not found");

    const models = parametersNamespace.models;

    /* model RequiredFoo { @query foo: string, } */
    const RequiredFoo = models.get("RequiredFoo");
    assert(RequiredFoo, "RequiredFoo model not found");
    expect(RequiredFoo.properties.size).toBe(1);
    expect(RequiredFoo.properties.get("foo")).toMatchObject({
      optional: false,
      type: { kind: "Scalar", name: "string" },
      decorators: [{ definition: { name: "@query" } }],
    });

    /* model OptionalFoo { @query foo?: string, } */
    const OptionalFoo = models.get("OptionalFoo");
    assert(OptionalFoo, "RequiredFoo model not found");
    expect(OptionalFoo.properties.size).toBe(1);
    expect(OptionalFoo.properties.get("foo")).toMatchObject({
      optional: true,
      type: { kind: "Scalar", name: "string" },
      decorators: [{ definition: { name: "@query" } }],
    });
  });

  it("supports doc generation", async () => {
    const {
      namespace: serviceNamespace,
      diagnostics,
      program,
    } = await compileForOpenAPI3({
      parameters: {
        Foo: {
          name: "foo",
          in: "query",
          description: "Docs for foo",
          schema: {
            type: "string",
          },
        },
      },
    });

    expectDiagnosticEmpty(diagnostics);

    const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
    assert(parametersNamespace, "Parameters namespace not found");

    const models = parametersNamespace.models;

    /*
    model Foo {
      // Docs for foo
      @query foo?: string,
    }
    Note: actual doc comment uses jsdoc syntax
    */
    const Foo = models.get("Foo");
    assert(Foo, "Foo model not found");
    expect(Foo.properties.size).toBe(1);
    const foo = Foo.properties.get("foo");
    ok(foo);
    expect(foo).toMatchObject({
      optional: true,
      type: { kind: "Scalar", name: "string" },
    });
    ok(foo);
    expectDecorators(foo.decorators, [{ name: "query" }], { strict: false });
    const docData = getDocData(program, foo);
    expect(docData).toMatchObject({ source: "comment", value: "Docs for foo" });
  });

  it("supports referenced schemas", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
        Foo: {
          type: "string",
        },
      },
      parameters: {
        Foo: {
          name: "foo",
          in: "query",
          schema: {
            $ref: "#/components/schemas/Foo",
          } as any,
        },
      },
    });
    const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
    assert(parametersNamespace, "Parameters namespace not found");

    const models = parametersNamespace.models;

    /* model Foo { @query foo?: TestService.Foo, } */
    const Foo = models.get("Foo");
    assert(Foo, "Foo model not found");
    expect(Foo.properties.size).toBe(1);
    expect(Foo.properties.get("foo")).toMatchObject({
      optional: true,
      decorators: [{ definition: { name: "@query" } }],
    });
    expect(Foo.properties.get("foo")?.type).toBe(serviceNamespace.scalars.get("Foo"));
  });

  it("supports title", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      parameters: {
        Foo: {
          name: "foo",
          in: "query",
          schema: {
            type: "string",
            title: "Foo Title",
          },
        },
      },
    });

    const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
    assert(parametersNamespace, "Parameters namespace not found");

    const models = parametersNamespace.models;

    /* model Foo { @query @summary("Foo Title") foo?: string, } */
    const Foo = models.get("Foo");
    assert(Foo, "Foo model not found");
    expect(Foo.properties.size).toBe(1);
    expect(Foo.properties.get("foo")).toMatchObject({
      optional: true,
      type: { kind: "Scalar", name: "string" },
    });
    expectDecorators(Foo.properties.get("foo")!.decorators, [
      { name: "query" },
      { name: "summary", args: ["Foo Title"] },
    ]);
  });

  it.each(["model", "interface", "namespace", "hyphen-name"])(
    `escapes invalid names: %s`,
    async (reservedKeyword) => {
      const serviceNamespace = await tspForOpenAPI3({
        parameters: {
          [reservedKeyword]: {
            name: reservedKeyword,
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
          },
        },
      });

      const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
      assert(parametersNamespace, "Parameters namespace not found");

      const models = parametersNamespace.models;

      /* model `{reservedKeyWord}` { @query `{reservedKeyword}`: string, } */
      const escapedModel = models.get(reservedKeyword);
      assert(escapedModel, "escapedModel model not found");
      expect(escapedModel.properties.size).toBe(1);
      expect(escapedModel.properties.get(reservedKeyword)).toMatchObject({
        optional: false,
        type: { kind: "Scalar", name: "string" },
        decorators: [{ definition: { name: "@query" } }],
      });
    },
  );
});

describe("header", () => {
  it(`sets no args if style is not set`, async () => {
    const serviceNamespace = await tspForOpenAPI3({
      parameters: {
        Foo: {
          name: "foo",
          in: "header",
          schema: {
            type: "string",
          },
        },
      },
    });

    const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
    assert(parametersNamespace, "Parameters namespace not found");

    const models = parametersNamespace.models;

    /* model Foo { @header foo: string, } */
    const Foo = models.get("Foo");
    assert(Foo, "Foo model not found");
    expect(Foo.properties.size).toBe(1);
    const fooProperty = Foo.properties.get("foo");
    assert(fooProperty, "foo property not found");
    expectDecorators(fooProperty.decorators, [{ name: "header" }]);
  });

  it(`sets format to 'simple' when style is set to 'simple'`, async () => {
    const serviceNamespace = await tspForOpenAPI3({
      parameters: {
        Foo: {
          name: "foo",
          in: "header",
          schema: {
            type: "array",
            items: {
              type: "string",
            },
          },
          style: "simple",
        },
      },
    });

    const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
    assert(parametersNamespace, "Parameters namespace not found");

    const models = parametersNamespace.models;

    /* model Foo { @header({ format: "simple" }) foo: string[], } */
    const Foo = models.get("Foo");
    assert(Foo, "Foo model not found");
    expect(Foo.properties.size).toBe(1);
    const fooProperty = Foo.properties.get("foo");
    assert(fooProperty, "foo property not found");
    expectDecorators(fooProperty.decorators, [{ name: "header", args: [{ format: "simple" }] }]);
  });
});

describe("query", () => {
  it(`sets explode: true for default OpenAPI 3 parameter`, async () => {
    const serviceNamespace = await tspForOpenAPI3({
      parameters: {
        Foo: {
          name: "foo",
          in: "query",
          required: true,
          schema: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
    });

    const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
    assert(parametersNamespace, "Parameters namespace not found");

    const models = parametersNamespace.models;

    /* model Foo { @query(#{ explode: true }) foo: string[], } */
    const Foo = models.get("Foo");
    assert(Foo, "Foo model not found");
    expect(Foo.properties.size).toBe(1);
    const fooProperty = Foo.properties.get("foo");
    assert(fooProperty, "foo property not found");
    expectDecorators(fooProperty.decorators, [{ name: "query", args: [{ explode: true }] }]);
  });

  describe("explicit explode: false", () => {
    const explode = false;
    it.each(["", "form"])("sets no args when style: %s", async (style) => {
      const serviceNamespace = await tspForOpenAPI3({
        parameters: {
          Foo: {
            name: "foo",
            in: "query",
            schema: {
              type: "array",
              items: {
                type: "string",
              },
            },
            style: style as any,
            explode,
          },
        },
      });

      const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
      assert(parametersNamespace, "Parameters namespace not found");

      const models = parametersNamespace.models;

      /* model Foo { @query foo: string[], } */
      const Foo = models.get("Foo");
      assert(Foo, "Foo model not found");
      expect(Foo.properties.size).toBe(1);
      const fooProperty = Foo.properties.get("foo");
      assert(fooProperty, "foo property not found");
      expectDecorators(fooProperty.decorators, [{ name: "query" }]);
    });

    it.each([
      { style: "spaceDelimited", format: "ssv" },
      { style: "pipeDelimited", format: "pipes" },
    ])("sets explode and format args when style: $style", async ({ style, format }) => {
      const { namespace: serviceNamespace, diagnostics } = await compileForOpenAPI3({
        parameters: {
          Foo: {
            name: "foo",
            in: "query",
            schema: {
              type: "array",
              items: {
                type: "string",
              },
            },
            style: style as any,
            explode,
          },
        },
      });

      // Expect a deprecated warning due to the use of format in the query args
      expectDiagnostics(diagnostics, [{ code: "deprecated" }]);

      const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
      assert(parametersNamespace, "Parameters namespace not found");

      const models = parametersNamespace.models;

      /* model Foo { @query(#{explode: false, format: $format}) foo: string[], } */
      const Foo = models.get("Foo");
      assert(Foo, "Foo model not found");
      expect(Foo.properties.size).toBe(1);
      const fooProperty = Foo.properties.get("foo");
      assert(fooProperty, "foo property not found");
      expectDecorators(fooProperty.decorators, [{ name: "query", args: [{ explode, format }] }]);
    });
  });

  describe("explicit explode: true", () => {
    const explode = true;
    it.each(["", "form"])("sets only explode in query args", async (style) => {
      const serviceNamespace = await tspForOpenAPI3({
        parameters: {
          Foo: {
            name: "foo",
            in: "query",
            schema: {
              type: "array",
              items: {
                type: "string",
              },
            },
            style: style as any,
            explode,
          },
        },
      });

      const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
      assert(parametersNamespace, "Parameters namespace not found");

      const models = parametersNamespace.models;

      /* model Foo { @query(#{explode: true}) foo: string[], } */
      const Foo = models.get("Foo");
      assert(Foo, "Foo model not found");
      expect(Foo.properties.size).toBe(1);
      const fooProperty = Foo.properties.get("foo");
      assert(fooProperty, "foo property not found");
      expectDecorators(fooProperty.decorators, [{ name: "query", args: [{ explode }] }]);
    });

    it.each([
      { style: "spaceDelimited", format: "ssv" },
      { style: "pipeDelimited", format: "pipes" },
    ])("sets explode and format args when style: $style", async ({ style, format }) => {
      const { namespace: serviceNamespace, diagnostics } = await compileForOpenAPI3({
        parameters: {
          Foo: {
            name: "foo",
            in: "query",
            schema: {
              type: "array",
              items: {
                type: "string",
              },
            },
            style: style as any,
            explode,
          },
        },
      });

      // Expect a deprecated warning due to the use of format in the query args
      expectDiagnostics(diagnostics, [{ code: "deprecated" }]);

      const parametersNamespace = serviceNamespace.namespaces.get("Parameters");
      assert(parametersNamespace, "Parameters namespace not found");

      const models = parametersNamespace.models;

      /* model Foo { @query(#{explode: false, format: $format}) foo: string[], } */
      const Foo = models.get("Foo");
      assert(Foo, "Foo model not found");
      expect(Foo.properties.size).toBe(1);
      const fooProperty = Foo.properties.get("foo");
      assert(fooProperty, "foo property not found");
      expectDecorators(fooProperty.decorators, [
        { name: "query", args: [{ explode: true, format }] },
      ]);
    });
  });
});
