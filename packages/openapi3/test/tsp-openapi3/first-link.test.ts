import { describe, expect, it } from "vitest";
import { expectDecorators } from "./utils/expect.js";
import { tspForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

describe("x-ms-list-first-link extension", () => {
  it("adds @firstLink decorator when x-ms-list-first-link is true", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
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
        Widget: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
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

  it("does not add @firstLink decorator when x-ms-list-first-link is false", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
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
              "x-ms-list-first-link": false,
            } as any,
          },
        },
        Widget: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
          },
        },
      },
    });

    const models = serviceNamespace.models;
    const widgetList = models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const firstLinkProperty = widgetList!.properties.get("firstLink");
    expect(firstLinkProperty).toBeDefined();

    // Check that only @extension decorator is present, not @firstLink
    expectDecorators(firstLinkProperty!.decorators, [
      { name: "extension", args: ["x-ms-list-first-link", false] },
    ]);
  });

  it("does not add @firstLink decorator when x-ms-list-first-link is not present", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
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
            },
          },
        },
        Widget: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
          },
        },
      },
    });

    const models = serviceNamespace.models;
    const widgetList = models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const firstLinkProperty = widgetList!.properties.get("firstLink");
    expect(firstLinkProperty).toBeDefined();

    // Check that no decorators are present
    expect(firstLinkProperty!.decorators.length).toBe(0);
  });
});
