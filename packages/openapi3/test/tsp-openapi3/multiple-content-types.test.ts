import { describe, expect, it } from "vitest";
import { renderTypeSpecForOpenAPI3, validateTsp } from "./utils/tsp-for-openapi3.js";

describe("Multiple content types", () => {
  it("generates separate operations for multipart and json", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        FooMultiPart: {
          type: "object",
          properties: {
            file: { type: "string", format: "binary" },
            description: { type: "string" },
          },
          required: ["file", "description"],
        },
        FooJson: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "integer" },
          },
          required: ["name"],
        },
        Bar: {
          type: "object",
          properties: {
            id: { type: "string" },
            status: { type: "string" },
          },
          required: ["id", "status"],
        },
      },
      paths: {
        "/my-operation": {
          post: {
            operationId: "myOperation",
            parameters: [],
            requestBody: {
              content: {
                "multipart/form-data": {
                  schema: { $ref: "#/components/schemas/FooMultiPart" },
                },
                "application/json": {
                  schema: { $ref: "#/components/schemas/FooJson" },
                },
              },
            },
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Bar" },
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(tsp).toMatchInlineSnapshot(`
      "import "@typespec/http";
      import "@typespec/openapi";
      import "@typespec/openapi3";

      using Http;
      using OpenAPI;

      @service(#{ title: "Test Service" })
      @info(#{ version: "1.0.0" })
      namespace TestService;

      model FooMultiPart {
        file: HttpPart<bytes>;
        description: HttpPart<string>;
      }

      model FooJson {
        name: string;
        age?: integer;
      }

      model Bar {
        id: string;
        status: string;
      }

      @sharedRoute
      @route("/my-operation")
      @post
      op myOperationMultipart(
        @header contentType: "multipart/form-data",
        @multipartBody body: FooMultiPart,
      ): Bar;

      @sharedRoute
      @route("/my-operation")
      @post
      op myOperationJson(@body body: FooJson): Bar;
      "
    `);

    await validateTsp(tsp);
  });

  it("combines multiple non-multipart content types with union", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        FooJson: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
        },
        FooXml: {
          type: "object",
          properties: {
            title: { type: "string" },
          },
        },
      },
      paths: {
        "/my-operation": {
          post: {
            operationId: "myOperation",
            parameters: [],
            requestBody: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FooJson" },
                },
                "application/xml": {
                  schema: { $ref: "#/components/schemas/FooXml" },
                },
              },
            },
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    });

    // Should combine into single operation with union, not split
    expect(tsp).not.toContain("@sharedRoute");
    expect(tsp).toContain("op myOperation");
    expect(tsp).toContain('@header contentType: "application/json" | "application/xml"');
    expect(tsp).toContain("@body body: FooJson | FooXml");

    await validateTsp(tsp);
  });

  it("does not split operations with only one content type", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        FooJson: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
        },
      },
      paths: {
        "/my-operation": {
          post: {
            operationId: "myOperation",
            parameters: [],
            requestBody: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FooJson" },
                },
              },
            },
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    });

    // Should NOT contain @sharedRoute or operation suffixes
    expect(tsp).not.toContain("@sharedRoute");
    expect(tsp).not.toContain("myOperationJson");
    expect(tsp).toContain("op myOperation");
    expect(tsp).toContain("@body body: FooJson");

    await validateTsp(tsp);
  });

  it("does not split operations with only multipart content types", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      schemas: {
        FooMultiPart: {
          type: "object",
          properties: {
            file: { type: "string", format: "binary" },
          },
        },
      },
      paths: {
        "/my-operation": {
          post: {
            operationId: "myOperation",
            parameters: [],
            requestBody: {
              content: {
                "multipart/form-data": {
                  schema: { $ref: "#/components/schemas/FooMultiPart" },
                },
              },
            },
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    });

    // Should NOT contain @sharedRoute or operation suffixes since only one content type
    expect(tsp).not.toContain("@sharedRoute");
    expect(tsp).not.toContain("myOperationMultipart");
    expect(tsp).toContain("op myOperation");
    expect(tsp).toContain('@header contentType: "multipart/form-data"');
    expect(tsp).toContain("@multipartBody body: FooMultiPart");

    await validateTsp(tsp);
  });
});
