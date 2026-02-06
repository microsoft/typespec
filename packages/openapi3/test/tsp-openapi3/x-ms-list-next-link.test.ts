import { describe, expect, it } from "vitest";
import { expectDecorators } from "./utils/expect.js";
import { renderTypeSpecForOpenAPI3, tspForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

describe("x-ms-list-next-link extension", () => {
  it("should add @nextLink decorator when x-ms-list-next-link is true", async () => {
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
          required: ["value", "nextLink"],
          properties: {
            value: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Widget",
              },
            },
            nextLink: {
              type: "string",
              "x-ms-list-next-link": true,
            },
          },
        },
      },
    });

    const models = serviceNamespace.models;
    const widgetList = models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const nextLinkProp = widgetList?.properties.get("nextLink");
    expect(nextLinkProp).toBeDefined();

    // Should have both @extension and @nextLink decorators
    expectDecorators(
      nextLinkProp!.decorators,
      [
        { name: "extension", args: ["x-ms-list-next-link", true] },
        { name: "nextLink", args: [] },
      ],
      { strict: false },
    );
  });

  it("should not add @nextLink decorator when x-ms-list-next-link is false", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
        WidgetList: {
          type: "object",
          required: ["value", "nextLink"],
          properties: {
            value: {
              type: "array",
              items: {
                type: "string",
              },
            },
            nextLink: {
              type: "string",
              "x-ms-list-next-link": false,
            },
          },
        },
      },
    });

    const models = serviceNamespace.models;
    const widgetList = models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const nextLinkProp = widgetList?.properties.get("nextLink");
    expect(nextLinkProp).toBeDefined();

    // Should have @extension but not @nextLink decorator
    expectDecorators(nextLinkProp!.decorators, [
      { name: "extension", args: ["x-ms-list-next-link", false] },
    ]);
  });

  it("should not add @nextLink decorator when x-ms-list-next-link is not present", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
        WidgetList: {
          type: "object",
          required: ["value", "nextLink"],
          properties: {
            value: {
              type: "array",
              items: {
                type: "string",
              },
            },
            nextLink: {
              type: "string",
            },
          },
        },
      },
    });

    const models = serviceNamespace.models;
    const widgetList = models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const nextLinkProp = widgetList?.properties.get("nextLink");
    expect(nextLinkProp).toBeDefined();

    // Should have no decorators
    expect(nextLinkProp!.decorators.length).toBe(0);
  });

  it("should generate correct TypeSpec with imports for complete example", async () => {
    const tspCode = await renderTypeSpecForOpenAPI3({
      info: {
        title: "Widget Service",
        version: "0.0.0",
      },
      paths: {},
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
          required: ["value", "nextLink"],
          properties: {
            value: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Widget",
              },
            },
            nextLink: {
              type: "string",
              "x-ms-list-next-link": true,
            },
          },
        },
      },
    });

    // Check that imports are present (already in the template)
    expect(tspCode).toContain('import "@typespec/http";');
    expect(tspCode).toContain('import "@typespec/openapi";');
    expect(tspCode).toContain("using Http;");
    expect(tspCode).toContain("using OpenAPI;");

    // Check that both decorators are present
    expect(tspCode).toContain('@extension("x-ms-list-next-link", true)');
    expect(tspCode).toContain("@nextLink");

    // Check that nextLink property has both decorators
    expect(tspCode).toMatch(/@extension\("x-ms-list-next-link", true\)\s+@nextLink\s+nextLink:/);
  });
});
