import OpenAPIParser from "@apidevtools/swagger-parser";
import { OpenAPI } from "openapi-types";
import { beforeAll, describe, expect, it } from "vitest";
import { TypeSpecUnion } from "../../src/cli/actions/convert/interfaces.js";
import { transformComponentSchemas } from "../../src/cli/actions/convert/transforms/transform-component-schemas.js";
import { createContext } from "../../src/cli/actions/convert/utils/context.js";
import { generateDataType } from "../../src/cli/actions/convert/generators/generate-model.js";
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
        },
      },
    });
  });

  it("preserves description and decorators from anyOf members when one is null", () => {
    const context = createContext(parser, doc as OpenAPI3Document);
    const types: (TypeSpecUnion)[] = [];
    transformComponentSchemas(context, types);
    
    const union = types.find((t) => t.name === "ReasoningEffort" && t.kind === "union") as TypeSpecUnion;
    expect(union).toBeDefined();
    
    // Log the actual structure for debugging
    console.log("Union:", JSON.stringify(union, null, 2));
    console.log("Schema:", JSON.stringify(union.schema, null, 2));
    
    expect(union.doc).toBeTruthy();
    expect(union.doc).toContain("Constrains effort on reasoning");
    
    // Generate the TypeSpec code to verify the output
    const generatedCode = generateDataType(union, context);
    expect(generatedCode).toContain("Constrains effort on reasoning");
    expect(generatedCode).toContain("null");
    expect(generatedCode).toContain("minimal");
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
            enum: ["value1", "value2"],
            default: "value1",
            description: "A nullable string with enum values",
          },
        },
      },
    });

    const context = createContext(parser, docWithTypeArray as OpenAPI3Document);
    const types: (TypeSpecUnion)[] = [];
    transformComponentSchemas(context, types);
    
    const union = types.find((t) => t.name === "NullableString" && t.kind === "union") as TypeSpecUnion;
    expect(union).toBeDefined();
    expect(union.doc).toBe("A nullable string with enum values");
  });
});