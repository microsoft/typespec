import { describe, expect, it } from "vitest";
import { expectDecorators } from "./utils/expect.js";
import { renderTypeSpecForOpenAPI3, tspForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

describe("converts x-ms-list-last-link extension", () => {
  it("adds @lastLink decorator when x-ms-list-last-link is true", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
        WidgetList: {
          type: "object",
          required: ["value", "lastLink"],
          properties: {
            value: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Widget",
              },
            },
            lastLink: {
              type: "string",
              "x-ms-list-last-link": true,
            } as any,
          },
        },
        Widget: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: {
              type: "string",
            },
            name: {
              type: "string",
            },
          },
        },
      },
    });

    const widgetListModel = serviceNamespace.models.get("WidgetList");
    expect(widgetListModel).toBeDefined();

    const lastLinkProp = widgetListModel!.properties.get("lastLink");
    expect(lastLinkProp).toBeDefined();

    // Should have both @extension and @lastLink decorators
    expectDecorators(
      lastLinkProp!.decorators,
      [
        { name: "extension", args: ["x-ms-list-last-link", true] },
        { name: "lastLink", args: [] },
      ],
      { strict: false },
    );
  });

  it("does not add @lastLink decorator when x-ms-list-last-link is false", async () => {
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
              "x-ms-list-last-link": false,
            } as any,
          },
        },
      },
    });

    const widgetListModel = serviceNamespace.models.get("WidgetList");
    expect(widgetListModel).toBeDefined();

    const lastLinkProp = widgetListModel!.properties.get("lastLink");
    expect(lastLinkProp).toBeDefined();

    // Should have @extension decorator but not @lastLink
    expectDecorators(
      lastLinkProp!.decorators,
      [{ name: "extension", args: ["x-ms-list-last-link", false] }],
      { strict: true },
    );
  });

  it("does not add @lastLink decorator when x-ms-list-last-link is not present", async () => {
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
            },
          },
        },
      },
    });

    const widgetListModel = serviceNamespace.models.get("WidgetList");
    expect(widgetListModel).toBeDefined();

    const lastLinkProp = widgetListModel!.properties.get("lastLink");
    expect(lastLinkProp).toBeDefined();

    // Should have no decorators
    expect(lastLinkProp!.decorators).toHaveLength(0);
  });

  it("generates correct TypeSpec code with @lastLink and @extension decorators", async () => {
    const tspCode = await renderTypeSpecForOpenAPI3({
      schemas: {
        WidgetList: {
          type: "object",
          required: ["value", "lastLink"],
          properties: {
            value: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Widget",
              },
            },
            lastLink: {
              type: "string",
              "x-ms-list-last-link": true,
            } as any,
          },
        },
        Widget: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: {
              type: "string",
            },
            name: {
              type: "string",
            },
          },
        },
      },
    });

    // Should contain both decorators
    expect(tspCode).toContain('@extension("x-ms-list-last-link", true)');
    expect(tspCode).toContain("@lastLink");
    // Decorators should be on the same property
    expect(tspCode).toMatch(/@extension\("x-ms-list-last-link", true\)\s+@lastLink\s+lastLink:/);
  });
});
