import OpenAPIParser from "@apidevtools/swagger-parser";
import { OpenAPI } from "openapi-types";
import { beforeAll, describe, expect, it } from "vitest";
import { generateDataType } from "../../src/cli/actions/convert/generators/generate-model.js";
import { TypeSpecUnion } from "../../src/cli/actions/convert/interfaces.js";
import { transformComponentSchemas } from "../../src/cli/actions/convert/transforms/transform-component-schemas.js";
import { createContext } from "../../src/cli/actions/convert/utils/context.js";
import { OpenAPI3Document } from "../../src/types.js";

describe("tsp-openapi: union anyOf with null", () => {
  let parser: OpenAPIParser;
  let doc: OpenAPI.Document<{}>;

  beforeAll(async () => {
    parser = new OpenAPIParser();
    doc = await parser.bundle({
      openapi: "3.1.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          ReasoningEffort: {
            anyOf: [
              {
                type: "string",
                enum: ["minimal", "low", "medium", "high"],
                default: "medium",
                description: `Constrains effort on reasoning for
[reasoning models](https://platform.openai.com/docs/guides/reasoning).
Currently supported values are \`minimal\`, \`low\`, \`medium\`, and \`high\`. Reducing
reasoning effort can result in faster responses and fewer tokens used
on reasoning in a response.`,
              },
              {
                type: "null",
              },
            ],
          },
          NullableNumberWithConstraints: {
            oneOf: [
              {
                type: "number",
                minimum: 0,
                maximum: 100,
                description: "A percentage value between 0 and 100",
              },
              {
                type: "null",
              },
            ],
          },
          ModelOrNull: {
            anyOf: [
              {
                $ref: "#/components/schemas/SomeModel",
              },
              {
                type: "null",
              },
            ],
          },
          SomeModel: {
            type: "object",
            properties: {
              id: { type: "string" },
            },
          },
        },
      },
    });
  });

  it("generates proper TypeSpec code with description and null", () => {
    const context = createContext(parser, doc as OpenAPI3Document);
    const types: TypeSpecUnion[] = [];
    transformComponentSchemas(context, types);

    const union = types.find(
      (t) => t.name === "ReasoningEffort" && t.kind === "union",
    ) as TypeSpecUnion;
    expect(union).toBeDefined();
    expect(union.doc).toBeTruthy();

    // Generate the actual TypeSpec code
    const generatedCode = generateDataType(union, context);

    // Verify the generated code contains all expected elements
    expect(generatedCode).toContain("/**");
    expect(generatedCode).toContain("Constrains effort on reasoning");
    expect(generatedCode).toContain("*/");
    expect(generatedCode).toContain("union ReasoningEffort {");
    expect(generatedCode).toContain('"minimal"');
    expect(generatedCode).toContain('"low"');
    expect(generatedCode).toContain('"medium"');
    expect(generatedCode).toContain('"high"');
    expect(generatedCode).toContain("null");
    expect(generatedCode).toContain("}");
  });

  it("preserves description from oneOf members with constraints when one is null", () => {
    const context = createContext(parser, doc as OpenAPI3Document);
    const types: TypeSpecUnion[] = [];
    transformComponentSchemas(context, types);

    const union = types.find(
      (t) => t.name === "NullableNumberWithConstraints" && t.kind === "union",
    ) as TypeSpecUnion;
    expect(union).toBeDefined();
    expect(union.doc).toBe("A percentage value between 0 and 100");

    // Check that decorators from the number schema are preserved
    expect(union.decorators).toBeDefined();
    const hasMinConstraint = union.decorators.some((d) => d.name === "minValue");
    const hasMaxConstraint = union.decorators.some((d) => d.name === "maxValue");
    expect(hasMinConstraint).toBe(true);
    expect(hasMaxConstraint).toBe(true);
  });

  it("handles reference + null anyOf correctly", () => {
    const context = createContext(parser, doc as OpenAPI3Document);
    const types: TypeSpecUnion[] = [];
    transformComponentSchemas(context, types);

    const union = types.find(
      (t) => t.name === "ModelOrNull" && t.kind === "union",
    ) as TypeSpecUnion;
    expect(union).toBeDefined();
    // For reference + null, there's no description on the ref itself, so doc should be undefined
    expect(union.doc).toBeUndefined();

    const generatedCode = generateDataType(union, context);
    expect(generatedCode).toContain("SomeModel");
    expect(generatedCode).toContain("null");
  });

  it("handles oneOf with null type array properly", async () => {
    const docWithTypeArray = await parser.bundle({
      openapi: "3.1.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          NullableString: {
            type: ["string", "null"],
            enum: ["value1", "value2", null],
            default: "value1",
            description: "A nullable string with enum values",
          },
          NullableInteger: {
            type: ["integer", "null"],
            minimum: 1,
            maximum: 10,
            description: "A nullable integer between 1 and 10",
          },
        },
      },
    });

    const context = createContext(parser, docWithTypeArray as OpenAPI3Document);
    const types: TypeSpecUnion[] = [];
    transformComponentSchemas(context, types);

    const stringUnion = types.find(
      (t) => t.name === "NullableString" && t.kind === "union",
    ) as TypeSpecUnion;
    expect(stringUnion).toBeDefined();
    expect(stringUnion.doc).toBe("A nullable string with enum values");

    const integerUnion = types.find(
      (t) => t.name === "NullableInteger" && t.kind === "union",
    ) as TypeSpecUnion;
    expect(integerUnion).toBeDefined();
    expect(integerUnion.doc).toBe("A nullable integer between 1 and 10");

    // Check that constraints are preserved for the integer union
    const hasMinConstraint = integerUnion.decorators.some((d) => d.name === "minValue");
    const hasMaxConstraint = integerUnion.decorators.some((d) => d.name === "maxValue");
    expect(hasMinConstraint).toBe(true);
    expect(hasMaxConstraint).toBe(true);
  });
});
