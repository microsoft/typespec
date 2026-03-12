import { Model } from "@typespec/compiler";
import { describe, expect, it } from "vitest";
import { expectDecorators } from "./utils/expect.js";
import { compileForOpenAPI3, renderTypeSpecForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

describe("converts x-ms-list-page-items extension to @pageItems decorator", () => {
  it("adds @pageItems decorator when x-ms-list-page-items is true", async () => {
    const { namespace: serviceNamespace } = await compileForOpenAPI3({
      schemas: {
        Widget: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
          },
          required: ["id", "name"],
        },
        WidgetList: {
          type: "object",
          properties: {
            value: {
              type: "array",
              items: { $ref: "#/components/schemas/Widget" },
              "x-ms-list-page-items": true,
            },
          },
          required: ["value"],
        },
      },
    });

    const models = serviceNamespace.models;
    const widgetList = models.get("WidgetList") as Model;
    expect(widgetList).toBeDefined();

    const valueProperty = widgetList?.properties.get("value");
    expect(valueProperty).toBeDefined();

    // Check that both decorators are present
    expectDecorators(
      valueProperty!.decorators,
      [
        { name: "extension", args: ["x-ms-list-page-items", true] },
        { name: "pageItems", args: [] },
      ],
      { strict: false },
    );
  });

  it("does not add @pageItems when x-ms-list-page-items is false", async () => {
    const { namespace: serviceNamespace } = await compileForOpenAPI3({
      schemas: {
        Widget: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        WidgetList: {
          type: "object",
          properties: {
            value: {
              type: "array",
              items: { $ref: "#/components/schemas/Widget" },
              "x-ms-list-page-items": false,
            },
          },
          required: ["value"],
        },
      },
    });

    const models = serviceNamespace.models;
    const widgetList = models.get("WidgetList") as Model;
    expect(widgetList).toBeDefined();

    const valueProperty = widgetList?.properties.get("value");
    expect(valueProperty).toBeDefined();

    // Check that @pageItems decorator is NOT present, but extension is
    const hasPageItems = valueProperty!.decorators.some((d) => d.definition?.name === "@pageItems");
    expect(hasPageItems).toBe(false);

    // Extension decorator should still be present since it's false
    expectDecorators(valueProperty!.decorators, [
      { name: "extension", args: ["x-ms-list-page-items", false] },
    ]);
  });

  it("does not add @pageItems when x-ms-list-page-items is not present", async () => {
    const { namespace: serviceNamespace } = await compileForOpenAPI3({
      schemas: {
        Widget: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        WidgetList: {
          type: "object",
          properties: {
            value: {
              type: "array",
              items: { $ref: "#/components/schemas/Widget" },
            },
          },
          required: ["value"],
        },
      },
    });

    const models = serviceNamespace.models;
    const widgetList = models.get("WidgetList") as Model;
    expect(widgetList).toBeDefined();

    const valueProperty = widgetList?.properties.get("value");
    expect(valueProperty).toBeDefined();

    // Check that @pageItems decorator is NOT present
    const hasPageItems = valueProperty!.decorators.some((d) => d.definition?.name === "@pageItems");
    expect(hasPageItems).toBe(false);

    // Extension decorator should also NOT be present
    const hasExtension = valueProperty!.decorators.some((d) => d.definition?.name === "@extension");
    expect(hasExtension).toBe(false);
  });

  it("renders @pageItems decorator in generated TypeSpec code", async () => {
    const code = await renderTypeSpecForOpenAPI3({
      schemas: {
        Widget: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        WidgetList: {
          type: "object",
          properties: {
            value: {
              type: "array",
              items: { $ref: "#/components/schemas/Widget" },
              "x-ms-list-page-items": true,
            },
          },
          required: ["value"],
        },
      },
    });

    // Check that the generated code includes both decorators
    expect(code).toContain('@extension("x-ms-list-page-items", true)');
    expect(code).toContain("@pageItems");
  });
});
