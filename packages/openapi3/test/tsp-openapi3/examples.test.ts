import { describe, expect, it, vi } from "vitest";
import { generateDecorators } from "../../src/cli/actions/convert/generators/generate-decorators.js";
import { createContext } from "../../src/cli/actions/convert/utils/context.js";
import { getDecoratorsForSchema } from "../../src/cli/actions/convert/utils/decorators.js";
import { convertOpenAPI3Document } from "../../src/index.js";
import type { OpenAPIDocument3_2, OpenAPISchema3_2 } from "../../src/types.js";
import { ApiTester } from "../test-host.js";

async function emitOpenAPI(code: string) {
  const { outputs } = await ApiTester.emit("@typespec/openapi3").compile(code, {
    compilerOptions: {
      options: {
        "@typespec/openapi3": {
          "openapi-versions": ["3.2.0"],
          "output-file": "openapi.json",
        },
      },
    },
  });
  return JSON.parse(outputs["openapi.json"]);
}

function documentFor(schema: OpenAPISchema3_2): OpenAPIDocument3_2 {
  return {
    openapi: "3.2.0",
    info: { title: "Pets", version: "1" },
    paths: {},
    components: { schemas: { Pet: schema } },
  };
}

function examplesForSchema(schema: any, document: any) {
  if ("$ref" in schema) {
    const name = schema.$ref.split("/").at(-1);
    return document.components.schemas[name].examples;
  }
  return schema.examples;
}

describe("import schema patterns", () => {
  it.each([String.raw`^\d+$`, String.raw`^\\\w+"` + "${value}$"])(
    "round-trips pattern %s on scalars and properties",
    async (pattern) => {
      const input = documentFor({});
      input.components = {
        schemas: {
          Pet: { type: "string", pattern },
          Container: { type: "object", properties: { value: { type: "string", pattern } } },
        },
      };
      const code = await convertOpenAPI3Document(input);
      const output = await emitOpenAPI(code);
      expect(output.components.schemas.Pet.pattern).toEqual(pattern);
      expect(output.components.schemas.Container.properties.value.pattern).toEqual(pattern);
    },
  );
});

describe("import schema examples", () => {
  it.each([
    { type: "string", defaultValue: "ok" },
    { type: "boolean", defaultValue: false },
  ] as const)(
    "keeps a $type default on the request body rather than its hoisted scalar",
    async ({ type, defaultValue }) => {
      const input = documentFor({});
      input.paths = {
        "/pets": {
          post: {
            operationId: "createPet",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: { type, default: defaultValue, examples: [defaultValue] },
                },
              },
            },
            responses: { "204": { description: "No content" } },
          },
        },
      };

      const code = await convertOpenAPI3Document(input);
      const output = await emitOpenAPI(code);
      expect(code).toContain(`@body body: __OpenAPIExampleBody0 = ${JSON.stringify(defaultValue)}`);
      const schema = output.paths["/pets"].post.requestBody.content["application/json"].schema;
      expect(examplesForSchema(schema, output)).toEqual([defaultValue]);
    },
  );

  it("round-trips examples on unconstrained components and inline bodies", async () => {
    const examples = ["pet", { name: "Fluffy" }, null];
    const input = documentFor({ examples });
    input.paths = {
      "/pets": {
        post: {
          operationId: "createPet",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { examples } } },
          },
          responses: { "204": { description: "No content" } },
        },
      },
    };

    const output = await emitOpenAPI(await convertOpenAPI3Document(input));
    expect(output.components.schemas.Pet.examples).toEqual(examples);
    const schema = output.paths["/pets"].post.requestBody.content["application/json"].schema;
    expect(examplesForSchema(schema, output)).toEqual(examples);
  });

  it("round-trips enum examples on a property nested inside an array and a union", async () => {
    const input = documentFor({
      type: "array",
      items: {
        anyOf: [
          {
            type: "object",
            properties: { color: { $ref: "#/components/schemas/Color", examples: ["red"] } },
          },
          { type: "string" },
        ],
      },
    });
    input.components!.schemas!.Color = { type: "string", enum: ["red", "blue"] };

    const output = await emitOpenAPI(await convertOpenAPI3Document(input));
    expect(output.components.schemas.Pet.items.anyOf[0].properties.color.examples).toEqual(["red"]);
  });

  it("round-trips examples that use an inherited formatted indexer", async () => {
    const examples = [{ when: "2026-11-20" }];
    const input = documentFor({ allOf: [{ $ref: "#/components/schemas/Base" }], examples });
    input.components!.schemas!.Base = {
      type: "object",
      additionalProperties: { type: "string", format: "date" },
    };

    const output = await emitOpenAPI(await convertOpenAPI3Document(input));
    expect(output.components.schemas.Pet.examples).toEqual(examples);
    expect(output.components.schemas.Pet.additionalProperties).toMatchObject({
      type: "string",
      format: "date",
    });
  });

  it("round-trips an open object example with undeclared properties", async () => {
    const examples = [{ name: "Fluffy" }];
    const input = documentFor({ type: "object", examples });

    const output = await emitOpenAPI(await convertOpenAPI3Document(input));
    expect(output.components.schemas.Pet.examples).toEqual(examples);
    expect(output.components.schemas.Pet.additionalProperties).toEqual({});
  });

  it("creates example decorators in reverse order without mutating the input", () => {
    const schema: OpenAPISchema3_2 = {
      type: "object",
      examples: [{ name: "Fluffy" }, { name: "Spot" }, { name: "Buddy" }],
    };
    expect(generateDecorators(getDecoratorsForSchema(schema))).toEqual([
      '@example(#{name: "Buddy"})',
      '@example(#{name: "Spot"})',
      '@example(#{name: "Fluffy"})',
    ]);
    expect(schema.examples).toEqual([{ name: "Fluffy" }, { name: "Spot" }, { name: "Buddy" }]);
  });

  it("preserves duplicate examples", () => {
    expect(
      generateDecorators(getDecoratorsForSchema({ type: "string", examples: ["pet", "pet"] })),
    ).toEqual(['@example("pet")', '@example("pet")']);
  });

  it("serializes JSON values using TypeSpec value syntax", () => {
    expect(
      generateDecorators(
        getDecoratorsForSchema({
          examples: [null, false, 0, "a${b}", [], {}, { "pet-name": [1, null, true] }],
        }),
      ),
    ).toEqual([
      "@example(#{`pet-name`: #[1, null, true]})",
      "@example(#{})",
      "@example(#[])",
      '@example("a\\${b}")',
      "@example(0)",
      "@example(false)",
      "@example(null)",
    ]);
  });

  const ignoredSchemas = [
    { name: "absent", schema: { type: "string" }, warns: false },
    { name: "empty", schema: { type: "string", examples: [] }, warns: false },
    { name: "invalid", schema: { type: "string", examples: "pet" }, warns: true },
    { name: "null", schema: { type: "string", examples: null }, warns: true },
    { name: "singular", schema: { type: "string", example: "pet" }, warns: false },
  ] as const;

  it.each(ignoredSchemas)("ignores $name examples", ({ schema, warns }) => {
    const warn = vi.fn();
    const context = createContext(documentFor({}), { trace: vi.fn(), warn, error: vi.fn() });
    expect(getDecoratorsForSchema(schema as OpenAPISchema3_2, context)).toEqual([]);
    if (warns) {
      expect(warn).toHaveBeenCalledWith(
        "Schema examples must be an array. The examples will be ignored.",
      );
    } else {
      expect(warn).not.toHaveBeenCalled();
    }
  });

  it.each(ignoredSchemas)(
    "converts and compiles schemas with $name examples without decorators",
    async ({ schema, warns }) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const code = await convertOpenAPI3Document(documentFor(schema as OpenAPISchema3_2));
        expect(code).not.toContain("@example");
        const output = await emitOpenAPI(code);
        expect(output.components.schemas.Pet).not.toHaveProperty("examples");
        expect(output.components.schemas.Pet).not.toHaveProperty("example");
        expect(warn).toHaveBeenCalledTimes(warns ? 1 : 0);
      } finally {
        warn.mockRestore();
      }
    },
  );

  it.each([
    { examples: [{ name: "Fluffy" }] },
    { examples: [{ name: "Fluffy" }, { name: "Spot" }, { name: "Buddy" }] },
    { examples: [{ name: "Fluffy" }, { name: "Fluffy" }] },
  ])("round-trips model examples $examples in their original order", async ({ examples }) => {
    const code = await convertOpenAPI3Document(
      documentFor({
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } },
        examples,
      }),
    );
    const output = await emitOpenAPI(code);
    expect(output.components.schemas.Pet.examples).toEqual(examples);
    expect(output.components.schemas.Pet).not.toHaveProperty("example");
  });

  it("round-trips examples on properties and scalar, array, and union schemas", async () => {
    const schemas: Record<string, OpenAPISchema3_2> = {
      PetName: { type: "string", examples: ["Fluffy", "Spot"] },
      PetNames: { type: "array", items: { type: "string" }, examples: [[], ["Fluffy"]] },
      MaybePet: { type: ["string", "null"], examples: [null, "Fluffy"] },
      Pet: {
        type: "object",
        properties: { name: { type: "string", examples: ["Fluffy", "Spot", "Fluffy"] } },
      },
    };
    const input = documentFor({});
    input.components = { schemas };
    const code = await convertOpenAPI3Document(input);
    const output = await emitOpenAPI(code);
    for (const name of ["PetName", "PetNames", "MaybePet"]) {
      expect(output.components.schemas[name].examples).toEqual(schemas[name].examples);
    }
    expect(output.components.schemas.Pet.properties.name.examples).toEqual([
      "Fluffy",
      "Spot",
      "Fluffy",
    ]);
  });

  it("uses scalar constructors and enum members in schema examples", async () => {
    const schemas: Record<string, OpenAPISchema3_2> = {
      Color: { type: "string", enum: ["red", "blue"], examples: ["blue"] },
      Timestamp: {
        type: "string",
        format: "date-time",
        examples: ["2026-11-20T16:00:00Z"],
      },
      Pet: {
        type: "object",
        properties: {
          color: { $ref: "#/components/schemas/Color" },
          timestamps: {
            type: "array",
            items: { $ref: "#/components/schemas/Timestamp" },
          },
        },
        examples: [
          {
            color: "red",
            timestamps: ["2026-11-20T16:00:00Z"],
          },
        ],
      },
    };
    const input = documentFor({});
    input.components = { schemas };

    const code = await convertOpenAPI3Document(input);
    expect(code).toContain("Pets.Color.red");
    expect(code).toContain('Pets.Timestamp.fromISO("2026-11-20T16:00:00Z")');
    const output = await emitOpenAPI(code);
    expect(output.components.schemas.Pet.examples).toEqual(schemas.Pet.examples);
    expect(output.components.schemas.Color.examples).toEqual(schemas.Color.examples);
    expect(output.components.schemas.Timestamp.examples).toEqual(schemas.Timestamp.examples);
  });

  it("preserves parent examples when unwrapping an inline object union member", async () => {
    const examples = [{ name: "parent" }];
    const code = await convertOpenAPI3Document(
      documentFor({
        anyOf: [
          {
            type: "object",
            properties: { name: { type: "string" } },
            examples: [{ name: "member" }],
          },
          { type: "null" },
        ],
        examples,
      }),
    );
    const output = await emitOpenAPI(code);
    expect(output.components.schemas.Pet.examples).toEqual(examples);
  });

  it("round-trips null and object examples on a nullable object union", async () => {
    const examples = [null, { name: "Fluffy" }];
    const code = await convertOpenAPI3Document(
      documentFor({
        anyOf: [{ type: "object", properties: { name: { type: "string" } } }, { type: "null" }],
        examples,
      }),
    );
    expect(code).toContain("union Pet");
    const output = await emitOpenAPI(code);
    expect(output.components.schemas.Pet.examples).toEqual(examples);
  });

  it("round-trips examples on inline request and response body schemas", async () => {
    const input = documentFor({});
    input.paths = {
      "/pets": {
        post: {
          operationId: "createPet",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { name: { type: "string" } },
                  examples: [{ name: "request example" }],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { name: { type: "string" } },
                    examples: [{ name: "response example" }],
                  },
                },
              },
            },
          },
        },
      },
    } as OpenAPIDocument3_2["paths"];

    const code = await convertOpenAPI3Document(input);
    const output = await emitOpenAPI(code);
    expect(
      (input.paths as any)["/pets"].post.requestBody.content["application/json"].schema.examples,
    ).toEqual([{ name: "request example" }]);
    expect(
      examplesForSchema(
        output.paths["/pets"].post.requestBody.content["application/json"].schema,
        output,
      ),
    ).toEqual([{ name: "request example" }]);
    expect(
      examplesForSchema(
        output.paths["/pets"].post.responses["200"].content["application/json"].schema,
        output,
      ),
    ).toEqual([{ name: "response example" }]);
  });

  it.each([false, true])("round-trips inline string bodies (const: %s)", async (isConst) => {
    const input = documentFor({});
    input.paths = {
      "/pets": {
        post: {
          operationId: "createPet",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "string",
                  ...(isConst && { const: "request example" }),
                  examples: ["request example"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Created",
              content: {
                "application/json": {
                  schema: {
                    type: "string",
                    ...(isConst && { const: "response example" }),
                    examples: ["response example"],
                  },
                },
              },
            },
          },
        },
      },
    } as OpenAPIDocument3_2["paths"];

    const code = await convertOpenAPI3Document(input);
    if (isConst) {
      expect(code).toMatch(/union \w+ \{\s*"request example",?\s*\}/);
      expect(code).toMatch(/union \w+ \{\s*"response example",?\s*\}/);
    }
    const output = await emitOpenAPI(code);
    const requestContent = output.paths["/pets"].post.requestBody.content as Record<string, any>;
    const responseContent = output.paths["/pets"].post.responses["200"].content as Record<
      string,
      any
    >;
    const requestSchema = Object.values(requestContent)[0].schema;
    const responseSchema = Object.values(responseContent)[0].schema;
    expect(examplesForSchema(requestSchema, output)).toEqual(["request example"]);
    expect(examplesForSchema(responseSchema, output)).toEqual(["response example"]);
  });

  it("round-trips examples on JSON responses with explicit and implicit bodies", async () => {
    const input = documentFor({});
    const schemas: Record<string, OpenAPISchema3_2> = {
      "200": { type: ["string", "null"], examples: [null, "ok"] },
      "201": { type: "string", examples: ["ok"] },
      "202": { type: "string", enum: ["ok", "pending"], examples: ["ok"] },
      "400": { type: "array", items: { type: "string" }, examples: [["ok"]] },
      "404": {
        type: "object",
        properties: { name: { type: "string" } },
        examples: [{ name: "Fluffy" }],
      },
    };
    input.paths = {
      "/pets": {
        get: {
          operationId: "getPet",
          responses: Object.fromEntries(
            Object.entries(schemas).map(([status, schema]) => [
              status,
              { description: "Response", content: { "application/json": { schema } } },
            ]),
          ),
        },
      },
    };

    const output = await emitOpenAPI(await convertOpenAPI3Document(input));
    for (const [status, schema] of Object.entries(schemas)) {
      expect(
        examplesForSchema(
          output.paths["/pets"].get.responses[status].content["application/json"].schema,
          output,
        ),
      ).toEqual(schema.examples);
    }
  });

  it("round-trips schema and media type examples on a scalar JSON response", async () => {
    const input = documentFor({ type: "string", examples: ["schema"] });
    input.paths = {
      "/pets": {
        get: {
          operationId: "getPet",
          responses: {
            "200": {
              description: "Response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Pet" },
                  example: "response",
                },
              },
            },
          },
        },
      },
    };

    const output = await emitOpenAPI(await convertOpenAPI3Document(input));
    const mediaType = output.paths["/pets"].get.responses["200"].content["application/json"];
    expect(examplesForSchema(mediaType.schema, output)).toEqual(["schema"]);
    expect(mediaType.example).toBe("response");
  });

  it("keeps request body examples next to a reference separate from the component examples", async () => {
    const input = documentFor({ type: "string", examples: ["component"] });
    input.paths = {
      "/pets": {
        post: {
          operationId: "createPet",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Pet", examples: ["request"] },
              },
            },
          },
          responses: { "204": { description: "No content" } },
        },
      },
    };

    const output = await emitOpenAPI(await convertOpenAPI3Document(input));
    expect(output.components.schemas.Pet.examples).toEqual(["component"]);
    expect(
      examplesForSchema(
        output.paths["/pets"].post.requestBody.content["application/json"].schema,
        output,
      ),
    ).toEqual(["request"]);
  });

  it("emits type-safe examples on response headers that reference enums", async () => {
    const input = documentFor({ type: "string", enum: ["red", "blue"] });
    const schema = { $ref: "#/components/schemas/Pet", examples: ["red"] };
    input.paths = {
      "/pets": {
        get: {
          operationId: "getPet",
          responses: {
            "200": {
              description: "Response",
              headers: {
                "X-Color": { schema },
              },
            },
          },
        },
      },
    };

    const code = await convertOpenAPI3Document(input);
    expect(code.match(/@example\([^)]*\)/g)).toEqual(["@example(Pets.Pet.red)"]);
    await emitOpenAPI(code);
  });

  it("warns and omits unsupported bytes examples, including inside composite examples", async () => {
    const input = documentFor({
      type: "object",
      properties: { data: { type: "string", format: "byte", examples: ["YQ=="] } },
      examples: [{ data: "YQ==" }, {}],
    });
    Object.assign(input.components!.schemas!, {
      Packet: { type: "string", contentEncoding: "base64", examples: ["YQ=="] },
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const output = await emitOpenAPI(await convertOpenAPI3Document(input));
      expect(output.components.schemas.Pet.examples).toEqual([{}]);
      expect(output.components.schemas.Pet.properties.data).not.toHaveProperty("examples");
      expect(output.components.schemas.Packet).not.toHaveProperty("examples");
      expect(warn).toHaveBeenCalledTimes(3);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("bytes"));
    } finally {
      warn.mockRestore();
    }
  });

  it("round-trips numeric encodings on scalars and nested object examples", async () => {
    const examples = [{ timestamp: -1, seconds: 1.5, milliseconds: -1500 }];
    const input = documentFor({
      type: "object",
      properties: {
        timestamp: { $ref: "#/components/schemas/Timestamp" },
        seconds: { type: "number", format: "double", "x-ms-duration": "seconds" },
        milliseconds: { type: "integer", "x-ms-duration": "milliseconds" },
      },
      examples,
    });
    Object.assign(input.components!.schemas!, {
      Timestamp: { type: "integer", format: "unixtime", examples: [0] },
      Duration: { type: "integer", "x-ms-duration": "milliseconds", examples: [1500] },
    });

    const code = await convertOpenAPI3Document(input);
    const output = await emitOpenAPI(code);
    expect(output.components.schemas.Timestamp.examples).toEqual([0]);
    expect(output.components.schemas.Duration.examples).toEqual([1500]);
    expect(output.components.schemas.Pet.examples).toEqual(examples);
  });

  it("preserves backslashes, interpolation syntax, and control characters in nested examples", async () => {
    const examples = [{ path: 'C:\\temp\\${name}"\r\n\t\b\f\u0000\u001f' }];
    const code = await convertOpenAPI3Document(
      documentFor({
        type: "object",
        properties: { path: { type: "string" } },
        examples,
      }),
    );
    expect(code).toContain('"""');
    const output = await emitOpenAPI(code);
    expect(output.components.schemas.Pet.examples).toEqual(examples);
  });

  it.each([
    ["date-time", "utcDateTime", "2026-11-20T16:00:00Z"],
    ["date", "plainDate", "2026-11-20"],
    ["time", "plainTime", "16:00:00"],
    ["duration", "duration", "PT1H"],
  ])("round-trips nullable %s examples through %s", async (format, scalar, value) => {
    const examples = [value, null];
    const code = await convertOpenAPI3Document(
      documentFor({ type: ["string", "null"], format, examples }),
    );
    expect(code).toContain(`${scalar}.fromISO("${value}")`);
    const output = await emitOpenAPI(code);
    expect(output.components.schemas.Pet.examples).toEqual(examples);
  });

  it("uses enum members for inherited properties and null-first unions", async () => {
    const input = documentFor({
      allOf: [{ $ref: "#/components/schemas/Base" }],
      examples: [{ color: "red" }],
    });
    Object.assign(input.components!.schemas!, {
      Color: { type: "string", enum: ["red", "blue"] },
      Base: {
        type: "object",
        properties: { color: { $ref: "#/components/schemas/Color" } },
      },
      Choice: {
        anyOf: [{ type: "null" }, { $ref: "#/components/schemas/Color" }],
        examples: [null, "red"],
      },
    });
    const code = await convertOpenAPI3Document(input);
    expect(code).toContain("#{ color: Pets.Color.red }");
    expect(code).toContain("@example(Pets.Color.red)");
    const output = await emitOpenAPI(code);
    expect(output.components.schemas.Pet.examples).toEqual([{ color: "red" }]);
    expect(output.components.schemas.Choice.examples).toEqual([null, "red"]);
  });

  it("uses required properties to select the matching example object variant", async () => {
    const examples = [{ b: "2026-11-20T16:00:00Z" }];
    const code = await convertOpenAPI3Document(
      documentFor({
        anyOf: [
          { type: "object", properties: { a: { type: "string" } }, required: ["a"] },
          {
            type: "object",
            properties: { b: { type: "string", format: "date-time" } },
            required: ["b"],
          },
        ],
        examples,
      }),
    );
    expect(code).toContain('b: utcDateTime.fromISO("2026-11-20T16:00:00Z")');
    const output = await emitOpenAPI(code);
    expect(output.components.schemas.Pet.examples).toEqual(examples);
  });

  it("checks required properties inherited through allOf before selecting a union variant", async () => {
    const examples = [{ b: "2026-11-20T16:00:00Z" }];
    const input = documentFor({
      anyOf: [{ $ref: "#/components/schemas/Composed" }, { $ref: "#/components/schemas/Other" }],
      examples,
    });
    Object.assign(input.components!.schemas!, {
      Composed: { allOf: [{ $ref: "#/components/schemas/Base" }] },
      Base: { type: "object", properties: { a: { type: "string" } }, required: ["a"] },
      Other: {
        type: "object",
        properties: { b: { type: "string", format: "date-time" } },
        required: ["b"],
      },
    });

    const output = await emitOpenAPI(await convertOpenAPI3Document(input));
    expect(output.components.schemas.Pet.examples).toEqual(examples);
  });

  it("checks other union variants when a composed reference is circular", () => {
    const schema: OpenAPISchema3_2 = {
      anyOf: [{ $ref: "#/components/schemas/Pet" }, { type: "string", format: "date" }],
      examples: ["2026-11-20"],
    };
    const context = createContext(documentFor({ allOf: [{ $ref: "#/components/schemas/Pet" }] }));
    expect(generateDecorators(getDecoratorsForSchema(schema, context))).toEqual([
      '@example(plainDate.fromISO("2026-11-20"))',
    ]);
  });

  it("preserves outer examples without merging nullable union member examples", async () => {
    const examples = [null, "Fluffy"];
    const code = await convertOpenAPI3Document(
      documentFor({
        anyOf: [{ type: "string", examples: ["Spot"] }, { type: "null" }],
        examples,
      }),
    );
    const output = await emitOpenAPI(code);
    expect(output.components.schemas.Pet.examples).toEqual(examples);
  });

  it("warns about invalid examples on a model property", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const code = await convertOpenAPI3Document(
        documentFor({
          type: "object",
          properties: {
            name: { type: "string", examples: "invalid" } as unknown as OpenAPISchema3_2,
          },
        }),
      );
      expect(code).not.toContain("@example");
      await emitOpenAPI(code);
      expect(warn).toHaveBeenCalledWith(
        "Schema examples must be an array. The examples will be ignored.",
      );
    } finally {
      warn.mockRestore();
    }
  });
});
