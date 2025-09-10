import { strictEqual } from "node:assert";
import { describe, it } from "vitest";
import { renderTypeSpecForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

describe("enum default values", () => {
  it("should generate enum member references for union default values", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        ToolChoiceOptions: {
          type: "string",
          enum: ["none", "auto", "required"],
        },
        ToolChoiceFunction: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["function"],
            },
            name: {
              type: "string",
            },
          },
          required: ["type", "name"],
        },
        ToolChoiceMCP: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["mcp"],
            },
            server_label: {
              type: "string",
              description: "The label of the MCP server to use.",
            },
            name: {
              type: "string",
              description: "The name of the tool to call on the server.",
              nullable: true,
            },
          },
        },
        Foo: {
          type: "object",
          properties: {
            tool_choice: {
              description:
                "How the model chooses tools. Provide one of the string modes or force a specific function/MCP tool.",
              default: "auto",
              anyOf: [
                { $ref: "#/components/schemas/ToolChoiceOptions" },
                { $ref: "#/components/schemas/ToolChoiceFunction" },
                { $ref: "#/components/schemas/ToolChoiceMCP" },
              ],
            },
          },
        },
      },
    });

    // Should contain ToolChoiceOptions.auto instead of "auto"
    strictEqual(
      tsp.includes("= ToolChoiceOptions.auto"),
      true,
      "Default value should reference enum member ToolChoiceOptions.auto"
    );
    
    // Should NOT contain the raw string default
    strictEqual(
      tsp.includes('= "auto"'),
      false,
      "Default value should not be raw string auto"
    );
  });

  it("should handle the original issue example", async () => {
    // This is the exact example from the GitHub issue
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        ToolChoiceOptions: {
          type: "string",
          enum: ["none", "auto", "required"],
        },
        ToolChoiceFunction: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["function"],
            },
            name: {
              type: "string",
            },
          },
          required: ["type", "name"],
        },
        ToolChoiceMCP: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["mcp"],
            },
            server_label: {
              type: "string",
              description: "The label of the MCP server to use.",
            },
            name: {
              type: "string",
              description: "The name of the tool to call on the server.",
              nullable: true,
            },
          },
        },
        RealtimeResponseCreateParams: {
          type: "object",
          properties: {
            tool_choice: {
              description:
                "How the model chooses tools. Provide one of the string modes or force a specific function/MCP tool.",
              default: "auto",
              anyOf: [
                { $ref: "#/components/schemas/ToolChoiceOptions" },
                { $ref: "#/components/schemas/ToolChoiceFunction" },
                { $ref: "#/components/schemas/ToolChoiceMCP" },
              ],
            },
          },
        },
      },
    });

    // Should generate the correct enum reference
    strictEqual(
      tsp.includes("= ToolChoiceOptions.auto"),
      true,
      "Should generate ToolChoiceOptions.auto for the default value"
    );

    // Should include the proper model name from the issue
    strictEqual(
      tsp.includes("model RealtimeResponseCreateParams"),
      true,
      "Should generate the correct model name"
    );
  });

  it("should handle simple enum defaults correctly", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        SimpleEnum: {
          type: "string",
          enum: ["one", "two", "three"],
          default: "two",
        },
      },
    });

    // For simple enums, TypeSpec doesn't support default values on enum declarations
    // The enum should be generated without any default value
    strictEqual(
      tsp.includes("enum SimpleEnum {"),
      true,
      "Simple enum should be generated as enum declaration"
    );
    
    // Should not contain any default value
    strictEqual(
      tsp.includes("= "),
      false,
      "Simple enum should not have default values"
    );
  });
});