import { assert, describe, expect, it } from "vitest";
import { tspForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

describe("converts top-level parameters", () => {
  (["query", "header", "path"] as const).forEach((location) => {
    it(`Supports location: ${location}`, async () => {
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
    const serviceNamespace = await tspForOpenAPI3({
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
    expect(foo).toMatchObject({
      optional: true,
      type: { kind: "Scalar", name: "string" },
    });
    expect(foo?.decorators.find((d) => d.definition?.name === "@query")).toBeTruthy();
    const docDecorator = foo?.decorators.find((d) => d.decorator?.name === "$docFromComment");
    expect(docDecorator?.args[1]).toMatchObject({ jsValue: "Docs for foo" });
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
});
