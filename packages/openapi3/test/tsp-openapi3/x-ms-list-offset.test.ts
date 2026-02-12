import { describe, expect, it } from "vitest";
import { renderTypeSpecForOpenAPI3, validateTsp } from "./utils/tsp-for-openapi3.js";

describe("x-ms-list-offset extension", () => {
  it("adds @offset decorator when x-ms-list-offset: true is present", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      paths: {
        "/widgets": {
          get: {
            operationId: "Widgets_list",
            description: "List widgets",
            parameters: [
              {
                name: "offset",
                in: "query",
                required: true,
                schema: {
                  type: "integer",
                  format: "int32",
                },
                "x-ms-list-offset": true,
                explode: false,
              },
            ],
            responses: {
              "200": {
                description: "The request has succeeded.",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Should include @offset decorator
    expect(tsp).toContain("@offset");
    // Should include @extension decorator with x-ms-list-offset
    expect(tsp).toContain('@extension("x-ms-list-offset", true)');
    // Should include the query decorator
    expect(tsp).toContain("@query");
    // Should have the parameter named offset
    expect(tsp).toContain("offset:");

    expect(tsp).toMatchInlineSnapshot(`
      "import "@typespec/http";
      import "@typespec/openapi";
      import "@typespec/openapi3";

      using Http;
      using OpenAPI;

      @service(#{ title: "Test Service" })
      @info(#{ version: "1.0.0" })
      namespace TestService;

      /** List widgets */
      @route("/widgets") @get op Widgets_list(
        @extension("x-ms-list-offset", true)
        @offset
        @query
        offset: int32,
      ): Body<{
        id?: string;
      }[]>;
      "
    `);

    await validateTsp(tsp);
  });

  it("does not add @offset decorator when x-ms-list-offset is false", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      paths: {
        "/widgets": {
          get: {
            operationId: "Widgets_list",
            parameters: [
              {
                name: "offset",
                in: "query",
                required: true,
                schema: {
                  type: "integer",
                  format: "int32",
                },
                "x-ms-list-offset": false,
              },
            ],
            responses: {
              "200": {
                description: "The request has succeeded.",
              },
            },
          },
        },
      },
    });

    // Should NOT include @offset decorator
    expect(tsp).not.toContain("@offset");
    // Should still include @extension decorator with x-ms-list-offset
    expect(tsp).toContain('@extension("x-ms-list-offset", false)');

    await validateTsp(tsp);
  });

  it("does not add @offset decorator when x-ms-list-offset is absent", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      paths: {
        "/widgets": {
          get: {
            operationId: "Widgets_list",
            parameters: [
              {
                name: "offset",
                in: "query",
                required: true,
                schema: {
                  type: "integer",
                  format: "int32",
                },
              },
            ],
            responses: {
              "200": {
                description: "The request has succeeded.",
              },
            },
          },
        },
      },
    });

    // Should NOT include @offset decorator
    expect(tsp).not.toContain("@offset");
    // Should NOT include @extension decorator with x-ms-list-offset
    expect(tsp).not.toContain("x-ms-list-offset");

    await validateTsp(tsp);
  });

  it("works with optional parameters", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      paths: {
        "/widgets": {
          get: {
            operationId: "Widgets_list",
            parameters: [
              {
                name: "offset",
                in: "query",
                required: false,
                schema: {
                  type: "integer",
                  format: "int32",
                },
                "x-ms-list-offset": true,
              },
            ],
            responses: {
              "200": {
                description: "The request has succeeded.",
              },
            },
          },
        },
      },
    });

    // Should include @offset decorator
    expect(tsp).toContain("@offset");
    // Should include @extension decorator with x-ms-list-offset
    expect(tsp).toContain('@extension("x-ms-list-offset", true)');
    // Parameter should be optional
    expect(tsp).toContain("offset?:");

    await validateTsp(tsp);
  });

  it("works with multiple parameters including x-ms-list-offset", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      paths: {
        "/widgets": {
          get: {
            operationId: "Widgets_list",
            parameters: [
              {
                name: "filter",
                in: "query",
                schema: {
                  type: "string",
                },
              },
              {
                name: "offset",
                in: "query",
                required: true,
                schema: {
                  type: "integer",
                  format: "int32",
                },
                "x-ms-list-offset": true,
              },
              {
                name: "limit",
                in: "query",
                schema: {
                  type: "integer",
                  format: "int32",
                },
              },
            ],
            responses: {
              "200": {
                description: "The request has succeeded.",
              },
            },
          },
        },
      },
    });

    // Should include @offset decorator for offset
    expect(tsp).toContain("@offset");
    // Should have all parameters
    expect(tsp).toContain("filter?:");
    expect(tsp).toContain("offset:");
    expect(tsp).toContain("limit?:");

    await validateTsp(tsp);
  });
});
