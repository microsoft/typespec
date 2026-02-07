import { describe, expect, it } from "vitest";
import { renderTypeSpecForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

describe("x-ms-list-continuation-token integration test (from issue)", () => {
  it("generates correct TypeSpec for the complete Widget Service example from the issue", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      paths: {
        "/widgets": {
          get: {
            operationId: "Widgets_list",
            description: "List widgets",
            parameters: [],
            responses: {
              "200": {
                description: "The request has succeeded.",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/WidgetList",
                    },
                  },
                },
              },
            },
            tags: ["Widgets"],
          },
        },
      },
      schemas: {
        Widget: {
          type: "object",
          required: ["id", "weight", "color"],
          properties: {
            id: {
              type: "string",
              readOnly: true,
            },
            weight: {
              type: "integer",
              format: "int32",
            },
            color: {
              type: "string",
              enum: ["red", "blue"],
            },
          },
        },
        WidgetList: {
          type: "object",
          required: ["value", "continuationToken"],
          properties: {
            value: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Widget",
              },
            },
            continuationToken: {
              type: "string",
              "x-ms-list-continuation-token": true,
            } as any,
          },
        },
        Error: {
          type: "object",
          required: ["code", "message"],
          properties: {
            code: {
              type: "integer",
              format: "int32",
            },
            message: {
              type: "string",
            },
          },
        },
      },
      tags: [{ name: "Widgets" }],
    });

    // Verify the required imports are present
    expect(tsp).toContain('import "@typespec/http"');
    expect(tsp).toContain('import "@typespec/openapi"');

    // Verify the using statements are present
    expect(tsp).toContain("using Http;");
    expect(tsp).toContain("using OpenAPI;");

    // Verify the @extension decorator is present
    expect(tsp).toContain('@extension("x-ms-list-continuation-token", true)');

    // Verify the @continuationToken decorator is present
    expect(tsp).toContain("@continuationToken");

    // Verify both decorators are on the continuationToken property
    // The property should have both decorators
    expect(tsp).toMatch(
      /@extension\("x-ms-list-continuation-token", true\)\s+@continuationToken\s+continuationToken/,
    );

    // Verify the WidgetList model structure
    expect(tsp).toContain("model WidgetList {");
    expect(tsp).toContain("value: Widget[];");
    expect(tsp).toContain("continuationToken: string;");
  });
});
