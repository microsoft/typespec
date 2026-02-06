import { describe, expect, it } from "vitest";
import { expectDecorators } from "./utils/expect.js";
import { renderTypeSpecForOpenAPI3, tspForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

describe("x-ms-list-continuation-token extension", () => {
  it("adds @continuationToken decorator when extension is true", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
        WidgetList: {
          type: "object",
          required: ["value", "continuationToken"],
          properties: {
            value: {
              type: "array",
              items: {
                type: "string",
              },
            },
            continuationToken: {
              type: "string",
              "x-ms-list-continuation-token": true,
            } as any,
          },
        },
      },
    });

    const models = serviceNamespace.models;
    const widgetList = models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const continuationTokenProp = widgetList!.properties.get("continuationToken");
    expect(continuationTokenProp).toBeDefined();

    // Should have both @extension and @continuationToken decorators
    const decorators = Array.from(continuationTokenProp!.decorators);
    expect(decorators).toHaveLength(2);

    // Check for @extension decorator
    const extensionDecorator = decorators.find((d) => d.definition?.name === "@extension");
    expect(extensionDecorator).toBeDefined();
    expectDecorators([extensionDecorator!], {
      name: "extension",
      args: ["x-ms-list-continuation-token", true],
    });

    // Check for @continuationToken decorator
    const continuationTokenDecorator = decorators.find(
      (d) => d.definition?.name === "@continuationToken",
    );
    expect(continuationTokenDecorator).toBeDefined();
    expectDecorators([continuationTokenDecorator!], { name: "continuationToken", args: [] });
  });

  it("does not add @continuationToken decorator when extension is false", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
        WidgetList: {
          type: "object",
          required: ["value", "continuationToken"],
          properties: {
            value: {
              type: "array",
              items: {
                type: "string",
              },
            },
            continuationToken: {
              type: "string",
              "x-ms-list-continuation-token": false,
            } as any,
          },
        },
      },
    });

    const models = serviceNamespace.models;
    const widgetList = models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const continuationTokenProp = widgetList!.properties.get("continuationToken");
    expect(continuationTokenProp).toBeDefined();

    // Should only have @extension decorator, not @continuationToken
    expectDecorators(continuationTokenProp!.decorators, [
      { name: "extension", args: ["x-ms-list-continuation-token", false] },
    ]);
  });

  it("does not add @continuationToken decorator when extension is missing", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
        WidgetList: {
          type: "object",
          required: ["value", "continuationToken"],
          properties: {
            value: {
              type: "array",
              items: {
                type: "string",
              },
            },
            continuationToken: {
              type: "string",
            },
          },
        },
      },
    });

    const models = serviceNamespace.models;
    const widgetList = models.get("WidgetList");
    expect(widgetList).toBeDefined();

    const continuationTokenProp = widgetList!.properties.get("continuationToken");
    expect(continuationTokenProp).toBeDefined();

    // Should have no decorators related to paging
    const decorators = Array.from(continuationTokenProp!.decorators);
    const hasContinuationToken = decorators.some((d) => d.decorator.name === "continuationToken");
    expect(hasContinuationToken).toBe(false);
  });

  it("generates correct TypeSpec output with @continuationToken decorator", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
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
      },
    });

    // Should import @typespec/openapi (which is already imported in all conversions)
    expect(tsp).toContain('import "@typespec/openapi"');

    // Should have using OpenAPI (which is already in all conversions)
    expect(tsp).toContain("using OpenAPI");

    // Should have the @extension decorator
    expect(tsp).toContain('@extension("x-ms-list-continuation-token", true)');

    // Should have the @continuationToken decorator
    expect(tsp).toContain("@continuationToken");

    // The property should have both decorators on the same line or adjacent lines
    expect(tsp).toMatch(
      /@extension\("x-ms-list-continuation-token", true\)\s+@continuationToken\s+continuationToken/,
    );
  });

  it("handles nested models with continuation token", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
        PagedResponse: {
          type: "object",
          required: ["items", "nextToken"],
          properties: {
            items: {
              type: "array",
              items: {
                type: "string",
              },
            },
            nextToken: {
              type: "string",
              "x-ms-list-continuation-token": true,
            } as any,
          },
        },
      },
    });

    const models = serviceNamespace.models;
    const pagedResponse = models.get("PagedResponse");
    expect(pagedResponse).toBeDefined();

    const nextTokenProp = pagedResponse!.properties.get("nextToken");
    expect(nextTokenProp).toBeDefined();

    // Should have both decorators
    const decorators = Array.from(nextTokenProp!.decorators);
    expect(decorators).toHaveLength(2);

    // Check for @extension decorator
    const extensionDecorator = decorators.find((d) => d.definition?.name === "@extension");
    expect(extensionDecorator).toBeDefined();
    expectDecorators([extensionDecorator!], {
      name: "extension",
      args: ["x-ms-list-continuation-token", true],
    });

    // Check for @continuationToken decorator
    const continuationTokenDecorator = decorators.find(
      (d) => d.definition?.name === "@continuationToken",
    );
    expect(continuationTokenDecorator).toBeDefined();
    expectDecorators([continuationTokenDecorator!], { name: "continuationToken", args: [] });
  });
});
