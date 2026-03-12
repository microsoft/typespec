import { describe, expect, it } from "vitest";
import { expectDecorators } from "./utils/expect.js";
import { renderTypeSpecForOpenAPI3, tspForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

describe("converts paging link extensions", () => {
  it("handles x-ms-list-prev-link extension", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
        WidgetList: {
          type: "object",
          required: ["value", "prevLink"],
          properties: {
            value: {
              type: "array",
              items: {
                type: "string",
              },
            },
            prevLink: {
              type: "string",
              "x-ms-list-prev-link": true,
            },
          },
        },
      },
    });

    const widgetList = serviceNamespace.models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const prevLinkProp = widgetList?.properties.get("prevLink");
    expect(prevLinkProp).toBeDefined();

    // Should have both @extension and @prevLink decorators
    // Note: TypeSpec compiler may reorder decorators during parsing
    expectDecorators(prevLinkProp!.decorators, [
      { name: "prevLink", args: [] },
      { name: "extension", args: ["x-ms-list-prev-link", true] },
    ]);
  });

  it("handles x-ms-list-next-link extension", async () => {
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
              "x-ms-list-next-link": true,
            },
          },
        },
      },
    });

    const widgetList = serviceNamespace.models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const nextLinkProp = widgetList?.properties.get("nextLink");
    expect(nextLinkProp).toBeDefined();

    // Should have both @extension and @nextLink decorators
    // Note: TypeSpec compiler may reorder decorators during parsing
    expectDecorators(nextLinkProp!.decorators, [
      { name: "nextLink", args: [] },
      { name: "extension", args: ["x-ms-list-next-link", true] },
    ]);
  });

  it("handles x-ms-list-first-link extension", async () => {
    const serviceNamespace = await tspForOpenAPI3({
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
            },
          },
        },
      },
    });

    const widgetList = serviceNamespace.models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const firstLinkProp = widgetList?.properties.get("firstLink");
    expect(firstLinkProp).toBeDefined();

    // Should have both @extension and @firstLink decorators
    // Note: TypeSpec compiler may reorder decorators during parsing
    expectDecorators(firstLinkProp!.decorators, [
      { name: "firstLink", args: [] },
      { name: "extension", args: ["x-ms-list-first-link", true] },
    ]);
  });

  it("handles x-ms-list-last-link extension", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
        WidgetList: {
          type: "object",
          required: ["value", "lastLink"],
          properties: {
            value: {
              type: "array",
              items: {
                type: "string",
              },
            },
            lastLink: {
              type: "string",
              "x-ms-list-last-link": true,
            },
          },
        },
      },
    });

    const widgetList = serviceNamespace.models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const lastLinkProp = widgetList?.properties.get("lastLink");
    expect(lastLinkProp).toBeDefined();

    // Should have both @extension and @lastLink decorators
    // Note: TypeSpec compiler may reorder decorators during parsing
    expectDecorators(lastLinkProp!.decorators, [
      { name: "lastLink", args: [] },
      { name: "extension", args: ["x-ms-list-last-link", true] },
    ]);
  });

  it("only adds link decorator when extension value is true", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
        WidgetList: {
          type: "object",
          required: ["value", "prevLink"],
          properties: {
            value: {
              type: "array",
              items: {
                type: "string",
              },
            },
            prevLink: {
              type: "string",
              "x-ms-list-prev-link": false,
            },
          },
        },
      },
    });

    const widgetList = serviceNamespace.models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const prevLinkProp = widgetList?.properties.get("prevLink");
    expect(prevLinkProp).toBeDefined();

    // Should only have @extension decorator, not @prevLink
    expectDecorators(prevLinkProp!.decorators, [
      { name: "extension", args: ["x-ms-list-prev-link", false] },
    ]);
  });

  it("renders TypeSpec with correct imports for prevLink", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        WidgetList: {
          type: "object",
          required: ["value", "prevLink"],
          properties: {
            value: {
              type: "array",
              items: {
                type: "string",
              },
            },
            prevLink: {
              type: "string",
              "x-ms-list-prev-link": true,
            },
          },
        },
      },
    });

    // Should import @typespec/openapi
    expect(tsp).toContain('import "@typespec/openapi";');
    // Should have using OpenAPI
    expect(tsp).toContain("using OpenAPI;");
    // Should have both decorators
    expect(tsp).toContain('@extension("x-ms-list-prev-link", true)');
    expect(tsp).toContain("@prevLink");
  });
});
