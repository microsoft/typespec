import { ApiTester } from "#test/test-host.js";
import { describe, expect, it, vi } from "vitest";
import {
  generateResponseExampleValue,
  type ResponseExampleShape,
} from "../../src/cli/actions/convert/generators/generate-response-examples.js";
import type { TypeSpecModelProperty } from "../../src/cli/actions/convert/interfaces.js";
import { createContext } from "../../src/cli/actions/convert/utils/context.js";
import { convertOpenAPI3Document } from "../../src/index.js";
import type {
  OpenAPI3Document,
  OpenAPI3MediaType,
  OpenAPI3Response,
  OpenAPI3Schema,
  Refable,
  SupportedOpenAPIDocuments,
} from "../../src/types.js";

const message: OpenAPI3Schema = {
  type: "object",
  required: ["body", "id"],
  properties: { body: { type: "string" }, id: { type: "integer", format: "int32" } },
};
const payload = { body: "hello", id: 1 };

function document(
  responses: Record<string, Refable<OpenAPI3Response>>,
  components: OpenAPI3Document["components"] = {},
): OpenAPI3Document {
  return {
    openapi: "3.0.0",
    info: { title: "Test", version: "1.0" },
    paths: { "/test": { get: { operationId: "read", parameters: [], responses } } },
    components,
  };
}

function response(content: OpenAPI3MediaType): OpenAPI3Response {
  return { description: "Response", content: { "application/json": content } };
}

async function roundTrip(input: OpenAPI3Document) {
  const code = await convertOpenAPI3Document(input);
  return { code, responses: (await emit(code)).paths["/test"].get.responses };
}

async function emit(code: string) {
  const { outputs } = await ApiTester.emit("@typespec/openapi3").compile(code, {
    compilerOptions: {
      options: { "@typespec/openapi3": { "file-type": "json", "output-file": "openapi.json" } },
    },
  });
  const output = JSON.parse(outputs["openapi.json"]);
  // Payload examples must never become schema-level examples.
  for (const schema of Object.values(output.components?.schemas ?? {})) {
    expect(schema).not.toHaveProperty("example");
    expect(schema).not.toHaveProperty("examples");
  }
  return output;
}

describe("response media type examples", () => {
  it.each(["200", "201", "203", "404"])(
    "imports an inline object for status %s using the generated wrapper",
    async (status) => {
      const { code, responses } = await roundTrip(
        document({ [status]: response({ schema: message, example: payload }) }),
      );
      expect(code.match(/@opExample\(/g)).toHaveLength(1);
      expect(Object.keys(responses)).toEqual([status]);
      expect(responses[status].content["application/json"].example).toEqual(payload);
    },
  );

  it.each(["200", "201", "203", "404"])(
    "imports a referenced model for status %s, preserving implicit body fields",
    async (status) => {
      const { responses } = await roundTrip(
        document(
          {
            [status]: response({
              schema: { $ref: "#/components/schemas/Message" },
              example: payload,
            }),
          },
          { schemas: { Message: message } },
        ),
      );
      expect(responses[status].content["application/json"].example).toEqual(payload);
    },
  );

  it.each(["200", "201"])(
    "uses the generated referenced response model for status %s",
    async (status) => {
      const { responses } = await roundTrip(
        document(
          { [status]: { $ref: "#/components/responses/MessageResponse" } },
          {
            responses: {
              MessageResponse: response({ schema: message, example: payload }),
            },
          },
        ),
      );
      expect(responses[status].content["application/json"].example).toEqual(payload);
    },
  );

  it.each([
    ["array", { type: "array", items: { type: "integer" } }, [0, 1]],
    ["empty array", { type: "array", items: { type: "string" } }, []],
    ["false", { type: "boolean" }, false],
    ["zero", { type: "integer" }, 0],
    ["empty string", { type: "string" }, ""],
    ["null", { type: "string", nullable: true }, null],
    [
      "value field",
      { type: "object", properties: { value: { type: "string" } } },
      { value: "raw" },
    ],
    [
      "escaped property",
      { type: "object", properties: { "a-b": { type: "string" } } },
      { "a-b": "${literal}" },
    ],
  ] as const)("preserves a singular %s payload", async (_, schema, value) => {
    for (const status of ["200", "201"]) {
      const { code, responses } = await roundTrip(
        document({ [status]: response({ schema: schema as OpenAPI3Schema, example: value }) }),
      );
      expect(code.match(/@opExample\(/g)).toHaveLength(1);
      expect(responses[status].content["application/json"].example).toEqual(value);
    }
  });

  it("keeps a single named entry named, using the key rather than summary", async () => {
    const { responses } = await roundTrip(
      document({
        "200": response({
          schema: message,
          examples: {
            small: { summary: "Compact message", description: "Details", value: payload },
          },
        }),
      }),
    );
    expect(responses["200"].content["application/json"]).toMatchObject({
      examples: { small: { summary: "small", description: "Details", value: payload } },
    });
    expect(responses["200"].content["application/json"]).not.toHaveProperty("example");
  });

  it("does not collapse equal payloads or equal summaries", async () => {
    const { code, responses } = await roundTrip(
      document({
        "200": response({
          schema: message,
          examples: {
            first: { summary: "Same", value: payload },
            second: { summary: "Same", value: payload },
          },
        }),
      }),
    );
    expect(code.match(/@opExample\(/g)).toHaveLength(2);
    expect(responses["200"].content["application/json"].examples).toEqual({
      first: { summary: "first", value: payload },
      second: { summary: "second", value: payload },
    });
  });

  it.each([false, true])(
    "routes named examples independently by status and media type (json first: %s)",
    async (jsonFirst) => {
      const json = {
        schema: { $ref: "#/components/schemas/Message" },
        examples: { small: { value: payload }, other: { value: { body: "other", id: 2 } } },
      };
      const vendor = {
        schema: { $ref: "#/components/schemas/Message" },
        examples: { small: { value: { body: "vendor", id: 3 } } },
      };
      const content = jsonFirst
        ? { "application/json": json, "application/vnd.example+json": vendor }
        : { "application/vnd.example+json": vendor, "application/json": json };
      const { code, responses } = await roundTrip(
        document(
          {
            "200": { description: "OK", content },
            "404": {
              description: "Missing",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Message" },
                  examples: { small: { value: { body: "missing", id: 4 } } },
                },
              },
            },
          },
          { schemas: { Message: message } },
        ),
      );
      expect(code.match(/@opExample\(/g)).toHaveLength(4);
      expect(Object.keys(responses)).toEqual(["200", "404"]);
      expect(Object.keys(responses["200"].content)).toEqual(Object.keys(content));
      expect(responses["200"].content["application/json"].examples).toEqual({
        small: { summary: "small", value: payload },
        other: { summary: "other", value: { body: "other", id: 2 } },
      });
      expect(responses["200"].content["application/vnd.example+json"].examples).toEqual({
        small: { summary: "small", value: { body: "vendor", id: 3 } },
      });
      expect(responses["404"].content["application/json"].examples).toEqual({
        small: { summary: "small", value: { body: "missing", id: 4 } },
      });
    },
  );

  it("routes scalar examples with content type independently of status", async () => {
    const { responses } = await roundTrip(
      document({
        "200": {
          description: "OK",
          content: {
            "application/json": { schema: { type: "string" }, example: "json" },
            "text/plain": { schema: { type: "string" }, example: "plain" },
          },
        },
      }),
    );
    expect(responses["200"].content["application/json"].example).toBe("json");
    expect(responses["200"].content["text/plain"].example).toBe("plain");
  });

  it("retains a payload field named statusCode as data", async () => {
    const schema: OpenAPI3Schema = {
      type: "object",
      properties: { statusCode: { type: "string" }, body: { type: "string" } },
      required: ["statusCode", "body"],
    };
    const value = { statusCode: "ordinary", body: "hello" };
    const { responses } = await roundTrip(
      document({ "201": response({ schema, example: value }) }),
    );
    expect(responses["201"].content["application/json"].example).toEqual(value);
  });

  it("allows optional response headers without inventing header values", async () => {
    const { responses } = await roundTrip(
      document({
        "200": {
          ...response({ schema: message, example: payload }),
          headers: { "x-trace-id": { schema: { type: "string" } } },
        },
      }),
    );
    expect(responses["200"].content["application/json"].example).toEqual(payload);
  });

  it("uses the media type rather than a response Content-Type header", async () => {
    const { responses } = await roundTrip(
      document({
        "200": {
          ...response({ schema: { type: "string" }, example: "hello" }),
          headers: {
            "Content-Type": {
              required: true,
              schema: { type: "string", enum: ["text/plain"] },
            },
          },
        },
      }),
    );
    expect(Object.keys(responses["200"].content)).toEqual(["application/json"]);
    expect(responses["200"].content["application/json"].example).toBe("hello");
  });

  it("resolves local Example Object references, retaining the referencing key", async () => {
    const { responses } = await roundTrip(
      document(
        {
          "200": response({
            schema: message,
            examples: { small: { $ref: "#/components/examples/SmallMessage" } },
          }),
        },
        {
          examples: {
            SmallMessage: { summary: "Original", description: "Details", value: payload },
          },
        },
      ),
    );
    expect(responses["200"].content["application/json"].examples).toEqual({
      small: { summary: "small", description: "Details", value: payload },
    });
  });

  it.each(["2XX", "default"])("does not guess a concrete status for %s", async (status) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { responses, code } = await roundTrip(
        document({ [status]: response({ schema: message, example: payload }) }),
      );
      // default is expressible without a concrete status; a range requires one.
      if (status === "default") {
        expect(responses.default.content["application/json"].example).toEqual(payload);
      } else {
        expect(code).not.toContain("@opExample");
        expect(warn).toHaveBeenCalled();
        expect(responses["2XX"].content["application/json"]).not.toHaveProperty("example");
      }
    } finally {
      warn.mockRestore();
    }
  });

  it("imports no examples for an empty examples map", async () => {
    const { code } = await roundTrip(
      document({ "200": response({ schema: message, examples: {} }) }),
    );
    expect(code).not.toContain("@opExample");
  });

  it.each(["3.1.0", "3.2.0"])("imports response examples from OpenAPI %s", async (version) => {
    const input = {
      ...document({
        "201": response({ schema: message, examples: { small: { value: payload } } }),
      }),
      openapi: version,
    } as SupportedOpenAPIDocuments;
    const code = await convertOpenAPI3Document(input);
    const output = await emit(code);
    expect(output.paths["/test"].get.responses["201"].content["application/json"].examples).toEqual(
      { small: { summary: "small", value: payload } },
    );
  });

  it.each([
    ["date", { type: "string", format: "date" }, "2026-01-02"],
    ["literal with format", { type: "string", format: "date", enum: ["2026-01-02"] }, "2026-01-02"],
    ["date-time", { type: "string", format: "date-time" }, "2026-01-02T03:04:05Z"],
    ["escaped string", { type: "string" }, '\\\n"\t${literal}'],
    ["union", { anyOf: [{ type: "integer" }, { type: "string" }] }, "hello"],
    ["record", { type: "object", additionalProperties: { type: "integer" } }, { a: 1 }],
  ] as const)("converts a %s value", async (_, schema, value) => {
    const { responses } = await roundTrip(
      document({ "201": response({ schema: schema as OpenAPI3Schema, example: value }) }),
    );
    expect(responses["201"].content["application/json"].example).toEqual(value);
  });

  it("diagnoses conflicting example and examples and skips the media type", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { code } = await roundTrip(
        document({
          "200": response({
            schema: message,
            example: payload,
            examples: { small: { value: payload } },
          }),
        }),
      );
      expect(code).not.toContain("@opExample");
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/example.*examples/));
    } finally {
      warn.mockRestore();
    }
  });

  it.each([
    ["externalValue", { externalValue: "https://example.com/example.json" }],
    ["missing value", { summary: "No value" }],
    ["unresolved reference", { $ref: "#/components/examples/Missing" }],
    ["wrong type", { value: "not an object" }],
    ["missing required property", { value: { body: "hello" } }],
    ["invalid nested property", { value: { body: "hello", id: "wrong" } }],
  ])("diagnoses %s and continues importing valid entries", async (_, invalid) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { code, responses } = await roundTrip(
        document({
          "200": response({
            schema: message,
            examples: { unsupported: invalid, valid: { value: payload } },
          }),
        }),
      );
      expect(code.match(/@opExample\(/g)).toHaveLength(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("unsupported"));
      expect(responses["200"].content["application/json"].examples).toEqual({
        valid: { summary: "valid", value: payload },
      });
    } finally {
      warn.mockRestore();
    }
  });

  it("diagnoses required response headers without inventing values", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { code, responses } = await roundTrip(
        document({
          "200": {
            ...response({ schema: message, example: payload }),
            headers: { "x-required": { required: true, schema: { type: "string" } } },
          },
        }),
      );
      expect(code).not.toContain("@opExample");
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/required.*header/i));
      expect(responses["200"].content["application/json"]).not.toHaveProperty("example");
    } finally {
      warn.mockRestore();
    }
  });

  it.each([
    ["string", { type: "string" }, "hello"],
    ["date scalar", { type: "string", format: "date" }, "2026-01-02"],
    ["array", { type: "array", items: { type: "integer" } }, [1, 2]],
    ["enum", { type: "string", enum: ["small", "large"] }, "small"],
  ] as const)("imports a referenced %s body for 200 and 201", async (_, schema, value) => {
    for (const status of ["200", "201"]) {
      const { responses } = await roundTrip(
        document(
          {
            [status]: response({
              schema: { $ref: "#/components/schemas/Payload" },
              example: value,
            }),
          },
          { schemas: { Payload: schema as OpenAPI3Schema } },
        ),
      );
      expect(responses[status].content["application/json"].example).toEqual(value);
    }
  });

  it("converts nested referenced enums and arrays against the generated types", async () => {
    const value = { sizes: ["small", "large"] };
    const { responses } = await roundTrip(
      document(
        {
          "201": response({
            schema: {
              type: "object",
              properties: {
                sizes: { type: "array", items: { $ref: "#/components/schemas/Size" } },
              },
              required: ["sizes"],
            },
            example: value,
          }),
        },
        { schemas: { Size: { type: "string", enum: ["small", "large"] } } },
      ),
    );
    expect(responses["201"].content["application/json"].example).toEqual(value);
  });

  it("imports an empty implicit response body without a leading comma", async () => {
    const { responses } = await roundTrip(
      document(
        {
          "201": response({ schema: { $ref: "#/components/schemas/Empty" }, example: {} }),
        },
        { schemas: { Empty: { type: "object" } } },
      ),
    );
    expect(responses["201"].content["application/json"].example).toEqual({});
  });

  it("does not mistake a payload statusCode for the response discriminator", async () => {
    const schema: OpenAPI3Schema = {
      type: "object",
      properties: { statusCode: { type: "integer" } },
      required: ["statusCode"],
    };
    const { responses } = await roundTrip(
      document({
        "200": response({ schema, example: { statusCode: 404 } }),
        "404": response({ schema, example: { statusCode: 200 } }),
      }),
    );
    expect(responses["200"].content["application/json"].example).toEqual({ statusCode: 404 });
    expect(responses["404"].content["application/json"].example).toEqual({ statusCode: 200 });
  });

  it("keeps a default example separate from a 200 response with the same body", async () => {
    const { responses } = await roundTrip(
      document({
        "200": response({ schema: message, example: payload }),
        default: response({ schema: message, example: { body: "default", id: 2 } }),
      }),
    );
    expect(responses["200"].content["application/json"].example).toEqual(payload);
    expect(responses.default.content["application/json"].example).toEqual({
      body: "default",
      id: 2,
    });
  });

  it("keeps scalar default examples separate from concrete responses", async () => {
    const schema: OpenAPI3Schema = { type: "string" };
    const { responses } = await roundTrip(
      document({
        "200": response({ schema, example: "success" }),
        default: response({ schema, example: "fallback" }),
      }),
    );
    expect(responses["200"].content["application/json"].example).toBe("success");
    expect(responses.default.content["application/json"].example).toBe("fallback");
  });

  it.each([
    ["enum", { enum: ["demo"] }],
    ["const", { const: "demo" }],
  ])("preserves JSON media type for an untyped %s", async (_, schema) => {
    const { responses } = await roundTrip(
      document({ "200": response({ schema: schema as OpenAPI3Schema, example: "demo" }) }),
    );
    expect(responses["200"].content["application/json"].example).toBe("demo");
  });

  it("imports examples of intersections with referenced record schemas", async () => {
    const { responses } = await roundTrip(
      document(
        {
          "200": response({
            schema: { allOf: [{ $ref: "#/components/schemas/Bag" }] },
            example: { a: 1 },
          }),
        },
        { schemas: { Bag: { type: "object", additionalProperties: { type: "integer" } } } },
      ),
    );
    expect(responses["200"].content["application/json"].example).toEqual({ a: 1 });
  });

  it("checks inherited record values and retains valid examples", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { responses } = await roundTrip(
        document(
          {
            "200": response({
              schema: { allOf: [{ $ref: "#/components/schemas/Bag" }] },
              examples: { invalid: { value: { a: "wrong" } }, valid: { value: { a: 1 } } },
            }),
          },
          { schemas: { Bag: { type: "object", additionalProperties: { type: "integer" } } } },
        ),
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("invalid"));
      expect(responses["200"].content["application/json"].examples).toEqual({
        valid: { summary: "valid", value: { a: 1 } },
      });
    } finally {
      warn.mockRestore();
    }
  });

  it.each([
    ["float32 maximum", { type: "number", format: "float" }, 3.4e38],
    ["float32 minimum", { type: "number", format: "float" }, -3.4e38],
    ["safeint maximum", { type: "integer", format: "double-int" }, Number.MAX_SAFE_INTEGER],
    ["safeint minimum", { type: "integer", format: "double-int" }, Number.MIN_SAFE_INTEGER],
    ["nullable int32 maximum", { type: ["integer", "null"], format: "int32" }, 2 ** 31 - 1],
  ] as const)("preserves %s", async (_, schema, value) => {
    const { responses } = await roundTrip(
      document({ "201": response({ schema: schema as OpenAPI3Schema, example: value }) }),
    );
    expect(responses["201"].content["application/json"].example).toBe(value);
  });

  it("skips null examples for referenced components generated as non-nullable models", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { code, responses } = await roundTrip(
        document(
          {
            "200": response({
              schema: { $ref: "#/components/schemas/Payload" },
              examples: { invalid: { value: null }, valid: { value: { name: "demo" } } },
            }),
          },
          {
            schemas: {
              Payload: {
                anyOf: [
                  { type: "object", properties: { name: { type: "string" } } },
                  { type: "null" } as unknown as OpenAPI3Schema,
                ],
              },
            },
          },
        ),
      );
      expect(code.match(/@opExample\(/g)).toHaveLength(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("invalid"));
      expect(responses["200"].content["application/json"].examples).toEqual({
        valid: { summary: "valid", value: { name: "demo" } },
      });
    } finally {
      warn.mockRestore();
    }
  });

  it("does not mistake a referenced payload statusCode for the response discriminator", async () => {
    const { responses } = await roundTrip(
      document(
        {
          "201": response({
            schema: { $ref: "#/components/schemas/Payload" },
            example: { statusCode: "ordinary", body: "hello" },
          }),
        },
        {
          schemas: {
            Payload: {
              type: "object",
              properties: { statusCode: { type: "string" }, body: { type: "string" } },
              required: ["statusCode", "body"],
            },
          },
        },
      ),
    );
    expect(responses["201"].content["application/json"].example).toEqual({
      statusCode: "ordinary",
      body: "hello",
    });
  });

  it("diagnoses a media type not represented by a generated component response", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { code, responses } = await roundTrip(
        document(
          { "200": { $ref: "#/components/responses/Multiple" } },
          {
            responses: {
              Multiple: {
                description: "Multiple",
                content: {
                  "application/json": { schema: message, example: payload },
                  "application/vnd.example+json": {
                    schema: message,
                    example: { body: "vendor", id: 2 },
                  },
                },
              },
            },
          },
        ),
      );
      expect(code.match(/@opExample\(/g)).toHaveLength(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("not represented"));
      expect(responses["200"].content["application/json"].example).toEqual(payload);
      expect(responses["200"].content).not.toHaveProperty("application/vnd.example+json");
    } finally {
      warn.mockRestore();
    }
  });

  it.each([
    ["an out-of-range int32", { type: "integer", format: "int32" }, 2 ** 32],
    ["an out-of-range int64", { type: "integer", format: "int64" }, 2 ** 63],
    ["an out-of-range float", { type: "number", format: "float" }, 3.4e40],
    ["an out-of-range safeint", { type: "integer", format: "double-int" }, 2 ** 53],
    ["an out-of-range nullable int32", { type: ["integer", "null"], format: "int32" }, 2 ** 32],
    [
      "a scalar for an inferred object",
      { properties: { name: { type: "string" } } },
      "not an object",
    ],
    ["an object for an inferred array", { items: { type: "string" } }, { name: "not an array" }],
    ["an invalid array item", { type: "array", items: { type: "integer" } }, ["wrong"]],
    ["an enum mismatch", { type: "string", enum: ["allowed"] }, "wrong"],
    [
      "an unrepresentable extra property",
      { type: "object", properties: { name: { type: "string" } } },
      { name: "hello", extra: "unrepresentable" },
    ],
    ["a non-JSON number", { type: "number" }, Number.POSITIVE_INFINITY],
  ] as const)("diagnoses %s rather than emitting invalid TypeSpec", async (_, schema, value) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { code } = await roundTrip(
        document({ "201": response({ schema: schema as OpenAPI3Schema, example: value }) }),
      );
      expect(code).not.toContain("@opExample");
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});

describe("response example shape binding", () => {
  const bodyProperty = (name: string, decorator: string): TypeSpecModelProperty => ({
    name,
    decorators: [{ name: decorator, args: [] }],
    schema: message,
    isOptional: false,
  });
  const codeProperty: TypeSpecModelProperty = {
    name: "code",
    decorators: [{ name: "statusCode", args: [] }],
    schema: { type: "integer", enum: [201] },
    isOptional: false,
  };

  it("does not produce a leading comma for an empty implicit value", () => {
    const value = generateResponseExampleValue(
      {},
      {
        statusCode: "201",
        mediaType: "application/json",
        content: {},
        properties: [codeProperty],
        implicitBody: { type: "object" },
      },
      [],
      createContext(document({})),
    );
    expect(value).toBe("#{ code: 201 }");
  });

  it.each([
    ["Message", [], message],
    ["{ @body payload: Message; }", [bodyProperty("payload", "body")], undefined],
    ["{ @bodyRoot payload: Message; }", [bodyProperty("payload", "bodyRoot")], undefined],
    [
      "{ @statusCode code: 201; @body payload: Message; }",
      [codeProperty, bodyProperty("payload", "body")],
      undefined,
    ],
    ["{ @statusCode code: 201; body: string; id: int32; }", [codeProperty], message],
  ] as const)("binds the wire payload to %s", async (returnType, properties, implicitBody) => {
    const statusCode = properties.some((p) => p === codeProperty) ? "201" : "200";
    const shape: ResponseExampleShape = {
      statusCode,
      mediaType: "application/json",
      content: { schema: message },
      properties: [...properties],
      implicitBody,
    };
    const value = generateResponseExampleValue(payload, shape, [], createContext(document({})));
    const output = await emit(`
      import "@typespec/http";
      using TypeSpec.Http;
      @service namespace Test;
      model Message { body: string; id: int32; }
      @opExample(#{ returnType: ${value} })
      @route("/test") @get op read(): ${returnType};
    `);
    expect(
      output.paths["/test"].get.responses[statusCode].content["application/json"].example,
    ).toEqual(payload);
  });

  it("uses the actual content-type property independently of a status property", async () => {
    const format: TypeSpecModelProperty = {
      name: "format",
      decorators: [{ name: "header", args: ["content-type"] }],
      schema: { type: "string", enum: ["application/json", "text/plain"] },
      isOptional: false,
    };
    const decorators = ["application/json", "text/plain"].map((mediaType) => {
      const value = generateResponseExampleValue(
        payload,
        {
          statusCode: "200",
          mediaType,
          content: { schema: message },
          properties: [format, bodyProperty("payload", "body")],
        },
        [],
        createContext(document({})),
      );
      return `@opExample(#{ returnType: ${value} })`;
    });
    const output = await emit(`
      import "@typespec/http";
      using TypeSpec.Http;
      @service namespace Test;
      model Message { body: string; id: int32; }
      ${decorators.join("\n")}
      @route("/test") @get op read(): {
        @header("content-type") format: "application/json" | "text/plain";
        @body payload: Message;
      };
    `);
    expect(output.paths["/test"].get.responses["200"].content["application/json"].example).toEqual(
      payload,
    );
    expect(output.paths["/test"].get.responses["200"].content["text/plain"].example).toEqual(
      payload,
    );
  });
});
