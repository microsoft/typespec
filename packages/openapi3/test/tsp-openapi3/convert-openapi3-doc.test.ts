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

    it("should escape ${...} in extension property values with nested objects", async () => {
      const tsp = await convertOpenAPI3Document({
        openapi: version,
        info: {
          title: "(title)",
          version: "0.0.0",
        },
        tags: [],
        paths: {
          "/foo": {
            post: {
              "x-oaiMeta": {
                javascript: `import fs from "fs";\nconst ref = \`data:audio/wav;base64,\${speakerRef}\`;`,
              },
              responses: {
                "200": {
                  description: "Success",
                },
              },
            },
          },
        },
      } as any);

      // Should escape ${...} in nested extension object string values
      strictEqual(
        tsp.includes("\\${speakerRef}"),
        true,
        "Expected '\\${speakerRef}' to be escaped in extension property but got: " + tsp,
      );

      // Should NOT contain unescaped ${...}
      strictEqual(
        tsp.includes("${speakerRef}") && !tsp.includes("\\${speakerRef}"),
        false,
        "Should not contain unescaped ${speakerRef} in extension property. Got: " + tsp,
      );
    });

    it("should escape ${...} in strings that contain other characters", async () => {
      const tsp = await convertOpenAPI3Document({
        openapi: version,
        info: {
          title: "(title)",
          version: "0.0.0",
        },
        tags: [],
        paths: {
          "/test": {
            get: {
              "x-example": "prefix${foo}suffix",
              "x-nested": {
                field: "data:audio/wav;base64,${speakerRef}",
              },
              responses: {
                "200": {
                  description: "Success",
                },
              },
            },
          },
        },
      } as any);

      // Should escape ${...} even when surrounded by other characters
      strictEqual(
        tsp.includes("\\${foo}") && tsp.includes("\\${speakerRef}"),
        true,
        "Expected all ${...} to be escaped in extension properties but got: " + tsp,
      );
    });

    it("should escape ${...} in extension arrays containing strings", async () => {
      const tsp = await convertOpenAPI3Document({
        openapi: version,
        info: {
          title: "(title)",
          version: "0.0.0",
        },
        tags: [],
        paths: {
          "/array": {
            post: {
              "x-array-prop": ["value1", "${item}", "prefix${var}suffix"],
              responses: {
                "200": {
                  description: "Success",
                },
              },
            },
          },
        },
      } as any);

      // Should escape ${...} in array elements
      strictEqual(
        tsp.includes("\\${item}") && tsp.includes("\\${var}"),
        true,
        "Expected ${...} to be escaped in extension array elements but got: " + tsp,
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

  it("should convert anyOf with integer unixtime and null to utcDateTime | null with @encode decorator", async () => {
    const tsp = await convertOpenAPI3Document({
      openapi: "3.1.0",
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
              finished_at: {
                anyOf: [
                  {
                    type: "integer",
                    format: "unixtime",
                  },
                  {
                    type: "null",
                  },
                ],
              },
            },
          },
        },
      },
    });

    // Should contain "@encode(DateTimeKnownEncoding.unixTimestamp, integer)" and "finished_at?: utcDateTime | null"
    strictEqual(
      tsp.includes("@encode(DateTimeKnownEncoding.unixTimestamp, integer)"),
      true,
      "Expected '@encode(DateTimeKnownEncoding.unixTimestamp, integer)' but got: " + tsp,
    );
    strictEqual(
      tsp.includes("finished_at?: utcDateTime | null"),
      true,
      "Expected 'finished_at?: utcDateTime | null' but got: " + tsp,
    );
  });

  it("should convert oneOf with integer unixtime and null to utcDateTime | null with @encode decorator", async () => {
    const tsp = await convertOpenAPI3Document({
      openapi: "3.1.0",
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
              started_at: {
                oneOf: [
                  {
                    type: "integer",
                    format: "unixtime",
                  },
                  {
                    type: "null",
                  },
                ],
              },
            },
          },
        },
      },
    });

    // Should contain "@encode(DateTimeKnownEncoding.unixTimestamp, integer)" and "@oneOf" and "started_at?: utcDateTime | null"
    strictEqual(
      tsp.includes("@encode(DateTimeKnownEncoding.unixTimestamp, integer)"),
      true,
      "Expected '@encode(DateTimeKnownEncoding.unixTimestamp, integer)' but got: " + tsp,
    );
    strictEqual(tsp.includes("@oneOf"), true, "Expected '@oneOf' but got: " + tsp);
    strictEqual(
      tsp.includes("started_at?: utcDateTime | null"),
      true,
      "Expected 'started_at?: utcDateTime | null' but got: " + tsp,
    );
  });
});

describe.each(versions)("Extension with JSON-like string values v%s", (version) => {
  it("should treat JSON-like string in extension property as an escaped string literal", async () => {
    const tsp = await convertOpenAPI3Document({
      openapi: version,
      info: {
        title: "Test Service",
        version: "1.0.0",
      },
      paths: {},
      components: {
        schemas: {
          GraderPython: {
            type: "object",
            "x-oaiMeta": {
              name: "Python Grader",
              group: "graders",
              example: `{
  "type": "python",
  "name": "Example python grader",
  "image_tag": "2025-05-08",
  "source": """
def grade(sample: dict, item: dict) -> float:
    \\"""
    Returns 1.0 if \`output_text\` equals \`label\`, otherwise 0.0.
    \\"""
    output = sample.get("output_text")
    label = item.get("label")
    return 1.0 if output == label else 0.0
""",
}`,
              examples: {
                request: {
                  curl: 'curl "https://api.openai.com/v1/assistants?order=desc&limit=20" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer $OPENAI_API_KEY" \\\n  -H "OpenAI-Beta: assistants=v2"\n',
                },
                response:
                  '{\n  "output": [\n    {\n      "content": [\n        {\n          "text": "The file seems to relate to contoso\\u2019s annual performance."\n        }\n      ]\n    }\n  ]\n',
              },
            },
          },
        },
      },
    } as any);

    // the example should escape the literal syntax contained withing the string value
    strictEqual(
      tsp.includes('source": \\"""'),
      true,
      "Expected 'example' to be an escaped string literal with newlines represented as \\n, but got: " +
        tsp,
    );

    // The triple quote should NOT be escaped twice
    strictEqual(
      tsp.includes('\\\\"""'),
      false,
      "Expected triple-quoted strings to not be escaped twice, but got: " + tsp,
    );

    // Terminal backslashes are escaped once
    strictEqual(
      tsp.includes('-H "Content-Type: application/json" \\\\\n'),
      true,
      "Expected terminal backslashes to be escaped once, but got: " + tsp,
    );

    // Unicode sequences are preserved
    strictEqual(
      tsp.includes("\\\\u2019s"),
      true,
      "Expected unicode sequences to be preserved, but got: " + tsp,
    );

    // Should use triple-quoted strings for object literal values
    strictEqual(
      tsp.includes('example: """'),
      true,
      "Should use triple-quoted strings in object literals as they can break with nested quotes. Got: " +
        tsp,
    );

    // Should NOT have nested object structure
    strictEqual(
      tsp.includes("example: #{"),
      false,
      "Should not parse JSON string as object literal. Got: " + tsp,
    );
  });

  it("should convert deprecated property to #deprecated directive", async () => {
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
            properties: {
              bar: {
                type: "string",
                deprecated: true,
              },
            },
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

        @service(#{
          title: "(title)",
        })
        @info(#{
          version: "0.0.0",
        })
        namespace title;

        model Foo {
          #deprecated "deprecated"
          bar?: string;
        }
        `,
        { printWidth: 100, tabWidth: 2 },
      ),
    );
  });

  it("should convert deprecated property with description", async () => {
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
            properties: {
              bar: {
                type: "string",
                description: "This field is deprecated",
                deprecated: true,
              },
            },
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

        @service(#{
          title: "(title)",
        })
        @info(#{
          version: "0.0.0",
        })
        namespace title;

        model Foo {
          /** This field is deprecated */
          #deprecated "deprecated"
          bar?: string;
        }
        `,
        { printWidth: 100, tabWidth: 2 },
      ),
    );
  });

  it("should convert deprecated model to #deprecated directive", async () => {
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
            deprecated: true,
            properties: {
              bar: {
                type: "string",
              },
            },
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

        @service(#{
          title: "(title)",
        })
        @info(#{
          version: "0.0.0",
        })
        namespace title;

        #deprecated "deprecated"
        model Foo {
          bar?: string;
        }
        `,
        { printWidth: 100, tabWidth: 2 },
      ),
    );
  });

  it("should convert deprecated scalar to #deprecated directive", async () => {
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
            type: "string",
            deprecated: true,
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

        @service(#{
          title: "(title)",
        })
        @info(#{
          version: "0.0.0",
        })
        namespace title;

        #deprecated "deprecated"
        scalar Foo extends string;
        `,
        { printWidth: 100, tabWidth: 2 },
      ),
    );
  });
});
