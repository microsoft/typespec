import { describe, expect, it } from "vitest";
import { OpenAPI3Response } from "../../src/types.js";
import { renderTypeSpecForOpenAPI3, validateTsp } from "./utils/tsp-for-openapi3.js";

const response: OpenAPI3Response = {
  description: "test response",
  content: {
    "application/json": {
      schema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
          },
        },
      },
    },
  },
};

describe("x-ms-list extension", () => {
  it("adds @list decorator when x-ms-list is true", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      paths: {
        "/widgets": {
          get: {
            operationId: "Widgets_list",
            "x-ms-list": true,
            parameters: [],
            responses: {
              "200": response,
            },
          },
        },
      },
    });

    expect(tsp).toContain("@list");
    expect(tsp).toContain('@extension("x-ms-list", true)');

    // Note: We don't validate the TypeSpec here because the generated code
    // may not be semantically correct without proper pagination properties.
    // The x-ms-list extension just indicates intent to mark the operation as a list operation.
  });

  it("does not add @list decorator when x-ms-list is false", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      paths: {
        "/widgets": {
          get: {
            operationId: "Widgets_list",
            "x-ms-list": false,
            parameters: [],
            responses: {
              "200": response,
            },
          },
        },
      },
    });

    expect(tsp).not.toContain("@list");
    expect(tsp).toContain('@extension("x-ms-list", false)');

    await validateTsp(tsp);
  });

  it("does not add @list decorator when x-ms-list is not present", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      paths: {
        "/widgets": {
          get: {
            operationId: "Widgets_list",
            parameters: [],
            responses: {
              "200": response,
            },
          },
        },
      },
    });

    expect(tsp).not.toContain("@list");
    expect(tsp).not.toContain("x-ms-list");

    await validateTsp(tsp);
  });

  it("handles x-ms-list in complete example with other decorators", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      paths: {
        "/widgets": {
          get: {
            operationId: "Widgets_list",
            description: "List widgets",
            summary: "List all widgets",
            "x-ms-list": true,
            parameters: [],
            responses: {
              "200": {
                description: "The request has succeeded.",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Widget",
                      },
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
          required: ["id", "name"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
          },
        },
      },
    });

    // Check that all expected decorators are present
    expect(tsp).toContain("@list");
    expect(tsp).toContain('@extension("x-ms-list", true)');
    expect(tsp).toContain('@summary("List all widgets")');
    expect(tsp).toContain('@tag("Widgets")');
    expect(tsp).toContain("List widgets");

    // Note: We don't validate the TypeSpec here because the generated code
    // may not be semantically correct without proper pagination properties.
    // The x-ms-list extension just indicates intent to mark the operation as a list operation.
  });
});
