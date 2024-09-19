import { formatTypeSpec } from "@typespec/compiler";
import { strictEqual } from "node:assert";
import { describe, it } from "vitest";
import { createContext } from "../../src/cli/actions/convert/utils/context.js";
import { OpenAPI3Schema, Refable } from "../../src/types.js";

interface TestScenario {
  schema: Refable<OpenAPI3Schema>;
  expected: string;
}

function generateScenarioName(scenario: TestScenario): string {
  return `${JSON.stringify(scenario.schema)} => ${scenario.expected}`;
}

const testScenarios: TestScenario[] = [
  // boolean
  { schema: { type: "boolean" }, expected: "boolean" },
  { schema: { type: "boolean", nullable: true }, expected: "boolean | null" },
  // integers
  { schema: { type: "integer" }, expected: "integer" },
  { schema: { type: "integer", format: "int8" }, expected: "int8" },
  { schema: { type: "integer", format: "int16" }, expected: "int16" },
  { schema: { type: "integer", format: "int32" }, expected: "int32" },
  { schema: { type: "integer", format: "int64" }, expected: "int64" },
  { schema: { type: "integer", format: "uint8" }, expected: "uint8" },
  { schema: { type: "integer", format: "uint16" }, expected: "uint16" },
  { schema: { type: "integer", format: "uint32" }, expected: "uint32" },
  { schema: { type: "integer", format: "uint64" }, expected: "uint64" },
  { schema: { type: "integer", format: "double-int" }, expected: "safeint" },
  { schema: { type: "integer", enum: [1, 3, 5, 8, 13] }, expected: "1 | 3 | 5 | 8 | 13" },
  {
    schema: { type: "integer", default: 3, enum: [1, 3, 5, 8, 13] },
    expected: "1 | 3 | 5 | 8 | 13 = 3",
  },
  {
    schema: { type: "integer", default: 3, enum: [1, 3, 5, 8, 13], nullable: true },
    expected: "1 | 3 | 5 | 8 | 13 | null = 3",
  },
  // numerics
  { schema: { type: "number" }, expected: "numeric" },
  { schema: { type: "number", default: 123 }, expected: "numeric = 123" },
  { schema: { type: "number", default: 123, nullable: true }, expected: "numeric | null = 123" },
  { schema: { type: "number", format: "decimal" }, expected: "decimal" },
  { schema: { type: "number", format: "decimal128" }, expected: "decimal128" },
  { schema: { type: "number", format: "double" }, expected: "float64" },
  { schema: { type: "number", format: "float" }, expected: "float32" },
  { schema: { type: "number", enum: [3.14, 6.28, 42] }, expected: "3.14 | 6.28 | 42" },
  // strings
  { schema: { type: "string" }, expected: "string" },
  { schema: { type: "string", format: "binary" }, expected: "bytes" },
  { schema: { type: "string", format: "byte" }, expected: "bytes" },
  { schema: { type: "string", format: "date" }, expected: "plainDate" },
  { schema: { type: "string", format: "date-time" }, expected: "utcDateTime" },
  { schema: { type: "string", format: "duration" }, expected: "duration" },
  { schema: { type: "string", format: "time" }, expected: "plainTime" },
  { schema: { type: "string", format: "uri" }, expected: "url" },
  { schema: { type: "string", enum: ["foo", "bar"] }, expected: `"foo" | "bar"` },
  {
    schema: { type: "string", default: "foo", enum: ["foo", "bar"] },
    expected: `"foo" | "bar" = "foo"`,
  },
  // refs
  { schema: { $ref: "#/Path/To/Some/Model" }, expected: "Model" },
  { schema: { $ref: "#/Path/To/Some/Model.Prop" }, expected: "Model.Prop" },
  // arrays
  { schema: { type: "array", items: { type: "string" } }, expected: "string[]" },
  {
    schema: { type: "array", items: { type: "array", items: { type: "string" } } },
    expected: "string[][]",
  },
  {
    schema: { type: "array", items: { type: "string", enum: ["foo", "bar"] } },
    expected: `("foo" | "bar")[]`,
  },
  { schema: { type: "array", items: { $ref: "#/Path/To/Some/Model" } }, expected: "Model[]" },
  {
    schema: { type: "array", items: { anyOf: [{ type: "string" }, { $ref: "#/Path/To/Model" }] } },
    expected: "(string | Model)[]",
  },
  // objects
  {
    schema: { type: "object", properties: { foo: { type: "string" } } },
    expected: "{foo?: string}",
  },
  {
    schema: {
      type: "object",
      required: ["foo"],
      properties: { foo: { type: "string" }, bar: { type: "boolean" } },
    },
    expected: "{foo: string; bar?: boolean}",
  },
  {
    schema: { type: "object", additionalProperties: { type: "string" } },
    expected: "Record<string>",
  },
  {
    schema: {
      type: "object",
      additionalProperties: { type: "string" },
      properties: { bar: { type: "boolean" } },
    },
    expected: "{bar?: boolean; ...Record<string>}",
  },
  {
    schema: {
      type: "object",
      required: ["foo"],
      properties: { foo: { type: "object", properties: { foo: { type: "string" } } } },
    },
    expected: "{foo: {foo?: string}}",
  },
  {
    schema: {
      type: "object",
      required: ["foo"],
      properties: { foo: { type: "string" }, bar: { $ref: "#/Path/To/Model" } },
    },
    expected: "{foo: string; bar?: Model}",
  },
  // anyOf/oneOf
  {
    schema: {
      anyOf: [
        { $ref: "#/Path/To/Model" },
        { type: "boolean" },
        { type: "string", enum: ["foo", "bar"] },
      ],
    },
    expected: `Model | boolean | "foo" | "bar"`,
  },
  {
    schema: {
      oneOf: [
        { $ref: "#/Path/To/Model" },
        { type: "boolean" },
        { type: "string", enum: ["foo", "bar"] },
      ],
    },
    expected: `Model | boolean | "foo" | "bar"`,
  },
  // fallthrough
  { schema: {}, expected: "unknown" },
];

describe("tsp-openapi: generate-type", () => {
  const context = createContext({
    openapi: "3.0.0",
    info: { title: "Test", version: "1.0.0" },
    paths: {},
  });
  testScenarios.forEach((t) =>
    it(`${generateScenarioName(t)}`, async () => {
      const type = context.generateTypeFromRefableSchema(t.schema, []);
      const wrappedType = await formatWrappedType(type);
      const wrappedExpected = await formatWrappedType(t.expected);
      strictEqual(wrappedType, wrappedExpected);
    }),
  );
});

// Wrap the expected and actual types in this model to get formatted types.
function formatWrappedType(type: string): Promise<string> {
  return formatTypeSpec(`model Test { test: ${type}; }`);
}
