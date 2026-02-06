import { describe, expect, it } from "vitest";
import { expectDecorators } from "./utils/expect.js";
import { renderTypeSpecForOpenAPI3, tspForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

describe("x-ms-list-first-link integration test", () => {
  it("compiles OpenAPI document with x-ms-list-first-link extension", async () => {
    const serviceNamespace = await tspForOpenAPI3({
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
          required: ["value", "firstLink"],
          properties: {
            value: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Widget",
              },
            },
            firstLink: {
              type: "string",
              "x-ms-list-first-link": true,
            } as any,
          },
        },
      },
    });

    const models = serviceNamespace.models;
    const widgetList = models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const firstLinkProperty = widgetList!.properties.get("firstLink");
    expect(firstLinkProperty).toBeDefined();

    // Check that both @extension and @firstLink decorators are present
    // Note: TypeSpec compiler may reorder decorators during parsing
    expectDecorators(firstLinkProperty!.decorators, [
      { name: "firstLink", args: [] },
      { name: "extension", args: ["x-ms-list-first-link", true] },
    ]);
  });

  it("generates correct TypeSpec string with @firstLink decorator", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        WidgetList: {
          type: "object",
          required: ["value", "firstLink"],
          properties: {
            value: {
              type: "array",
              items: {
                type: "string",
              },
            },
            firstLink: {
              type: "string",
              "x-ms-list-first-link": true,
            } as any,
          },
        },
      },
    });

    // Verify the generated TypeSpec contains the @firstLink decorator
    expect(tsp).toContain("@firstLink");
    expect(tsp).toContain('@extension("x-ms-list-first-link", true)');
    // Verify the firstLink property is in the WidgetList model
    expect(tsp).toMatch(/model WidgetList[\s\S]*@firstLink[\s\S]*firstLink: string/);
  });
});
