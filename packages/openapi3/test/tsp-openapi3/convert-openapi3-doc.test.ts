import { formatTypeSpec } from "@typespec/compiler";
import { strictEqual } from "node:assert";
import { describe, it } from "vitest";
import { convertOpenAPI3Document } from "../../src/index.js";

const versions = ["3.0.0", "3.1.0", "3.2.0"] as const;

describe.each(versions)("convertOpenAPI3Document v%s", (version) => {
  it("should convert an OpenAPI3 document to a formatted TypeSpec program", async () => {
    const tsp = await convertOpenAPI3Document({
      info: {
        title: "Test Service",
        version: "1.0.0",
      },
      openapi: version,
      paths: {},
      components: {
        schemas: {
          Foo: {
            type: "string",
          },
        },
      },
    });

    strictEqual(
      tsp,
      await formatTypeSpec(
        `
        import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{ title: "Test Service" })
        @info(#{ version: "1.0.0" })
        namespace TestService;

        scalar Foo extends string;
          `,
        { printWidth: 100, tabWidth: 2 },
      ),
    );
  });

  it("converts an OpenAPI 3 document with an empty schema to a valid TypeSpec representation", async () => {
    const tsp = await convertOpenAPI3Document({
      info: {
        title: "Test",
        version: "0.0.0",
      },
      openapi: version,
      paths: {},
      components: {
        schemas: {
          Foo: {},
        },
      },
    });

    strictEqual(
      tsp,
      await formatTypeSpec(
        `
        import "@typespec/http";
        import "@typespec/openapi";
        import "@typespec/openapi3";

        using Http;
        using OpenAPI;

        @service(#{
          title: "Test",
        })
        @info(#{
          version: "0.0.0",
        })
        namespace Test;

        scalar Foo;
          `,
        { printWidth: 100, tabWidth: 2 },
      ),
    );
  });

  describe("Union types with multiple defaults", () => {
    it("should select first default for union types with multiple defaults", async () => {
      const tsp = await convertOpenAPI3Document({
        openapi: version,
        info: {
          title: "(title)",
          version: "0.0.0",
        },
        tags: [],
        paths: {},
        components: {
          schemas: {
            Foo: {
              type: "object",
              required: ["bar"],
              properties: {
                bar: {
                  anyOf: [
                    {
                      type: "string",
                      default: "life",
                    },
                    {
                      type: "array",
                      items: {
                        type: "string",
                      },
                      default: ["life"],
                    },
                    {
                      type: "number",
                      default: 42,
                    },
                  ],
                },
              },
            },
          },
        },
      });

      // Should generate valid TypeSpec syntax
      strictEqual(
        tsp.includes('bar: string | string[] | numeric = "life";'),
        true,
        "Expected 'bar: string | string[] | numeric = \"life\";' but got: " + tsp,
      );

      // Should NOT generate the invalid syntax
      strictEqual(
        tsp.includes('string = "life"| string[]'),
        false,
        "Should not contain the invalid syntax from the issue. Got: " + tsp,
      );

      // Should NOT generate the invalid syntax
      strictEqual(
        tsp.includes("= 42,"),
        false,
        "Should not contain number default concatenated. Got: " + tsp,
      );
    });
  });

  describe("String escaping", () => {
    it("should escape ${...} in string literals to prevent interpolation", async () => {
      const tsp = await convertOpenAPI3Document({
        openapi: version,
        info: {
          title: "(title)",
          version: "0.0.0",
        },
        tags: [],
        paths: {},
        components: {
          schemas: {
            Foo: {
              type: "object",
              required: ["foo"],
              properties: {
                foo: {
                  type: "string",
                  title: "${asdf}",
                },
              },
            },
          },
        },
      });

      // Should escape ${...} in strings to prevent interpolation
      strictEqual(
        tsp.includes('@summary("\\${asdf}")'),
        true,
        "Expected '\\${asdf}' to be escaped but got: " + tsp,
      );

      // Should NOT contain unescaped ${...}
      strictEqual(
        tsp.includes('@summary("${asdf}")'),
        false,
        "Should not contain unescaped ${asdf}. Got: " + tsp,
      );
    });

    it("should escape multiple ${...} occurrences in string literals", async () => {
      const tsp = await convertOpenAPI3Document({
        openapi: version,
        info: {
          title: "(title)",
          version: "0.0.0",
        },
        tags: [],
        paths: {},
        components: {
          schemas: {
            Foo: {
              type: "object",
              required: ["bar"],
              properties: {
                bar: {
                  type: "string",
                  description: "Value is ${foo} and ${bar}",
                },
              },
            },
          },
        },
      });

      // Should escape all ${...} in strings
      strictEqual(
        tsp.includes("\\${foo}") && tsp.includes("\\${bar}"),
        true,
        "Expected all ${...} to be escaped but got: " + tsp,
      );
    });
  });

  if (version !== "3.0.0") {
    describe("OpenAPI 3.1 anyOf with null conversion", () => {
      it("should convert anyOf with ref + null to proper union with null", async () => {
        const tsp = await convertOpenAPI3Document({
          openapi: version,
          info: {
            title: "Test Service",
            version: "0.0.0",
          },
          paths: {},
          components: {
            schemas: {
              Bar: {
                type: "object",
                required: ["bar"],
                properties: {
                  bar: {
                    anyOf: [{ $ref: "#/components/schemas/Foo" }, { type: "null" as any }],
                  },
                },
              },
              Foo: {
                type: "object",
                required: ["foo"],
                properties: {
                  foo: {
                    type: "string",
                  },
                },
              },
            },
          },
        } as any);

        // Should contain "bar: Foo | null;" instead of "bar: Foo | unknown;"
        strictEqual(
          tsp.includes("bar: Foo | null;"),
          true,
          "Expected 'bar: Foo | null;' but got: " + tsp,
        );
        strictEqual(
          tsp.includes("bar: Foo | unknown;"),
          false,
          "Should not contain 'bar: Foo | unknown;'",
        );
      });

      it("should convert plain null type to null", async () => {
        const tsp = await convertOpenAPI3Document({
          openapi: version,
          info: {
            title: "Test Service",
            version: "0.0.0",
          },
          paths: {},
          components: {
            schemas: {
              NullOnly: {
                type: "null" as any,
              },
              Bar: {
                type: "object",
                required: ["nullProp"],
                properties: {
                  nullProp: {
                    $ref: "#/components/schemas/NullOnly",
                  },
                },
              },
            },
          },
        } as any);

        // Should contain proper null handling
        strictEqual(
          tsp.includes("scalar NullOnly extends null;"),
          true,
          "Expected 'scalar NullOnly extends null;' but got: " + tsp,
        );
      });
    });
  }
});

describe("unixtime format conversion", () => {
  it("should convert integer with unixtime format to utcDateTime with @encode decorator", async () => {
    const tsp = await convertOpenAPI3Document({
      openapi: "3.0.0",
      info: {
        title: "Test Service",
        version: "0.0.0",
      },
      paths: {},
      components: {
        schemas: {
          Foo: {
            type: "object",
            properties: {
              created: {
                type: "integer",
                format: "unixtime",
              },
            },
          },
        },
      },
    });

    // Should contain "@encode(DateTimeKnownEncoding.unixTimestamp, integer)" and "created?: utcDateTime"
    strictEqual(
      tsp.includes("@encode(DateTimeKnownEncoding.unixTimestamp, integer)"),
      true,
      "Expected '@encode(DateTimeKnownEncoding.unixTimestamp, integer)' but got: " + tsp,
    );
    strictEqual(
      tsp.includes("created?: utcDateTime"),
      true,
      "Expected 'created?: utcDateTime' but got: " + tsp,
    );
  });

  it("should keep number with unixtime format as numeric (unixTimestamp encoding only works with integer)", async () => {
    const tsp = await convertOpenAPI3Document({
      openapi: "3.0.0",
      info: {
        title: "Test Service",
        version: "0.0.0",
      },
      paths: {},
      components: {
        schemas: {
          Foo: {
            type: "object",
            properties: {
              created: {
                type: "number",
                format: "unixtime",
              },
            },
          },
        },
      },
    });

    // Number with unixtime format stays as numeric since unixTimestamp encoding requires integer
    strictEqual(
      tsp.includes("created?: numeric"),
      true,
      "Expected 'created?: numeric' but got: " + tsp,
    );
  });

  it("should keep string with unixtime format as string (unixTimestamp encoding only works with integer)", async () => {
    const tsp = await convertOpenAPI3Document({
      openapi: "3.0.0",
      info: {
        title: "Test Service",
        version: "0.0.0",
      },
      paths: {},
      components: {
        schemas: {
          Foo: {
            type: "object",
            properties: {
              created: {
                type: "string",
                format: "unixtime",
              },
            },
          },
        },
      },
    });

    // String with unixtime format stays as string since unixTimestamp encoding requires integer
    strictEqual(
      tsp.includes("created?: string"),
      true,
      "Expected 'created?: string' but got: " + tsp,
    );
  });
});
