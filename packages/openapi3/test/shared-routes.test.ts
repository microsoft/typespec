import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { diagnoseOpenApiFor, openApiFor } from "./test-host.js";

describe("openapi3: shared routes", () => {
  it("emits warning for routes containing query parameters", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {
        model Resource {
          id: string;
        }

        @route("/sharedroutes/resources?filter=resourceGroup")
        op listByResourceGroup(...Resource): Resource[];

        @route("/sharedroutes/resources?filter=subscription")
        op listBySubscription(...Resource): Resource[];
      }
      `
    );
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/openapi3/path-query",
        message: "OpenAPI does not allow paths containing a query string.",
      },
      {
        code: "@typespec/openapi3/path-query",
        message: "OpenAPI does not allow paths containing a query string.",
      },
    ]);
  });

  it("model shared routes that differ by query params as a union of optional params", async () => {
    const results = await openApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {
        model Resource {
          id: string;
        }

        @sharedRoute
        @operationId("List_ResourceGroup")
        @route("/sharedroutes/resources")
        op listByResourceGroup(...Resource, @query resourceGroup: string, @query foo: string): Resource[];

        @sharedRoute
        @operationId("List_Subscription")
        @route("/sharedroutes/resources")
        op listBySubscription(...Resource, @query subscription: string, @query foo: string): Resource[];
      }
      `
    );
    deepStrictEqual(
      results.paths["/sharedroutes/resources"].post.operationId,
      "List_ResourceGroup_List_Subscription"
    );
    deepStrictEqual(
      results.paths["/sharedroutes/resources"].post.responses["200"].statusCode,
      undefined
    );
    const params = results.paths["/sharedroutes/resources"].post.parameters as {
      name: string;
      required: boolean;
    }[];
    deepStrictEqual(params, [
      {
        in: "query",
        name: "resourceGroup",
        explode: false,
        required: false,
        schema: {
          type: "string",
        },
      },
      {
        in: "query",
        name: "foo",
        explode: false,
        required: true,
        schema: {
          type: "string",
        },
      },
      {
        in: "query",
        name: "subscription",
        explode: false,
        required: false,
        schema: {
          type: "string",
        },
      },
    ]);
  });

  it("model shared routes that differ by query param values as an enum", async () => {
    const results = await openApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {
        model Resource {
          id: string;
        }

        @sharedRoute
        @route("/sharedroutes/resources")
        op listByResourceGroup(...Resource, @query filter: "resourceGroup"): Resource[];

        @sharedRoute
        @route("/sharedroutes/resources")
        op listBySubscription(...Resource, @query filter: "subscription"): Resource[];
      }
      `
    );
    deepStrictEqual(
      results.paths["/sharedroutes/resources"].post.operationId,
      "listByResourceGroup_listBySubscription"
    );
    deepStrictEqual(
      results.paths["/sharedroutes/resources"].post.responses["200"].statusCode,
      undefined
    );
    const params = results.paths["/sharedroutes/resources"].post.parameters as {
      name: string;
      required: boolean;
      schema: any;
    }[];
    deepStrictEqual(params, [
      {
        in: "query",
        name: "filter",
        explode: false,
        required: true,
        schema: {
          type: "string",
          enum: ["resourceGroup", "subscription"],
        },
      },
    ]);
  });

  it("model shared routes with shared parameters in different locations", async () => {
    const results = await openApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {
        model Resource {
          id: string;
        }

        @sharedRoute
        @route("/sharedroutes/resources")
        op listByResourceGroup(...Resource, @query filter: "resourceGroup"): Resource[];

        @sharedRoute
        @route("/sharedroutes/resources")
        op listBySubscription(...Resource, @header filter: "subscription"): Resource[];
      }
      `
    );
    deepStrictEqual(
      results.paths["/sharedroutes/resources"].post.operationId,
      "listByResourceGroup_listBySubscription"
    );
    deepStrictEqual(
      results.paths["/sharedroutes/resources"].post.responses["200"].statusCode,
      undefined
    );
    const params = results.paths["/sharedroutes/resources"].post.parameters as {
      name: string;
      required: boolean;
      schema: any;
    }[];
    deepStrictEqual(params, [
      {
        name: "filter",
        in: "query",
        required: false,
        explode: false,
        schema: {
          type: "string",
          enum: ["resourceGroup"],
        },
      },
      {
        name: "filter",
        in: "header",
        required: false,
        schema: {
          type: "string",
          enum: ["subscription"],
        },
      },
    ]);
  });

  it("model shared routes with different response types", async () => {
    const results = await openApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {
        model Resource {
          id: string;
        }

        @sharedRoute
        @route("/sharedroutes/resources")
        op returnsInt(...Resource, @query options: string): int32;

        @sharedRoute
        @route("/sharedroutes/resources")
        op returnsString(...Resource, @query options: string): string;
      }
      `
    );
    deepStrictEqual(
      results.paths["/sharedroutes/resources"].post.operationId,
      "returnsInt_returnsString"
    );
    const responses = results.paths["/sharedroutes/resources"].post.responses;
    deepStrictEqual(responses, {
      "200": {
        content: {
          "application/json": {
            schema: {
              anyOf: [
                {
                  type: "integer",
                  format: "int32",
                },
                {
                  type: "string",
                },
              ],
            },
          },
        },
        description: "The request has succeeded.",
      },
    });
  });

  it("model shared routes with different request bodies", async () => {
    const results = await openApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {
        @sharedRoute
        @route("/1")
        op processInt(@body a: int32, @query options: string): void;

        @sharedRoute
        @route("/1")
        op processString(@body b: string, @query options: string): void;

        @sharedRoute
        @route("/2")
        op updateInt(@body a: int32, @query options: string): void;

        @sharedRoute
        @route("/2")
        op updateString(@body b: string, @query options: string): void;
      }
      `
    );
    deepStrictEqual(results.paths["/1"].post.operationId, "processInt_processString");
    deepStrictEqual(results.paths["/1"].post.requestBody, {
      required: true,
      content: {
        "application/json": {
          schema: {
            anyOf: [
              {
                type: "integer",
                format: "int32",
              },
              {
                type: "string",
              },
            ],
          },
        },
      },
    });
    deepStrictEqual(results.paths["/2"].post.operationId, "updateInt_updateString");
    deepStrictEqual(results.paths["/2"].post.requestBody, {
      required: true,
      content: {
        "application/json": {
          schema: {
            anyOf: [
              {
                type: "integer",
                format: "int32",
              },
              {
                type: "string",
              },
            ],
          },
        },
      },
    });
  });

  it("model shared routes with different response bodies", async () => {
    const results = await openApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {

        model A {
          val: int16;

          @header
          someHeader: string;
        }

        model B {
          val: string;

          @header
          someHeader: string;
        }

        @sharedRoute
        @route("/1")
        op processInt(@body _: int32, @query options: string): A;

        @sharedRoute
        @route("/1")
        op processString(@body _: string, @query options: string): B;
      }
      `
    );
    const responses = results.paths["/1"].post.responses;
    deepStrictEqual(responses, {
      "200": {
        content: {
          "application/json": {
            schema: {
              anyOf: [{ $ref: "#/components/schemas/A" }, { $ref: "#/components/schemas/B" }],
            },
          },
        },
        description: "The request has succeeded.",
        headers: {
          "some-header": {
            required: true,
            schema: {
              type: "string",
            },
          },
        },
      },
    });
  });

  it("model shared routes with different implicit request bodies", async () => {
    const results = await openApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {
        model A {
          name: string;

          @header
          someHeader: string;
        }

        model B {
          age: int32;

          @header
          someHeader: string;
        }

        @sharedRoute
        op updateA(a: A): void;

        @sharedRoute
        op updateB(b: B): int32;
      }
      `
    );
    deepStrictEqual(results.paths["/"].post.operationId, "updateA_updateB");
    const requestBody = results.paths["/"].post.requestBody;

    deepStrictEqual(requestBody, {
      required: true,
      content: {
        "application/json": {
          schema: {
            anyOf: [
              {
                properties: {
                  a: { $ref: "#/components/schemas/A" },
                },
                required: ["a"],
                type: "object",
              },
              {
                properties: {
                  b: { $ref: "#/components/schemas/B" },
                },
                required: ["b"],
                type: "object",
              },
            ],
          },
        },
      },
    });
  });

  it("model shared routes with different request and response body types", async () => {
    const results = await openApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {

        @error
        model ErrorModel {
          @header "x-ms-error-code": string;

          description: string;
        }

        @sharedRoute
        @route("/process")
        op processInt(@body body: int32, @query options: string): int32 | ErrorModel;

        @sharedRoute
        @route("/process")
        op processString(@body body: string, @query options: string): string | ErrorModel;
      }
      `
    );
    deepStrictEqual(results.paths["/process"].post.operationId, "processInt_processString");
    const requestBody = results.paths["/process"].post.requestBody;
    deepStrictEqual(requestBody, {
      required: true,
      content: {
        "application/json": {
          schema: {
            anyOf: [
              {
                type: "integer",
                format: "int32",
              },
              {
                type: "string",
              },
            ],
          },
        },
      },
    });
    const responses = results.paths["/process"].post.responses;
    deepStrictEqual(responses, {
      "200": {
        content: {
          "application/json": {
            schema: {
              anyOf: [
                {
                  type: "integer",
                  format: "int32",
                },
                {
                  type: "string",
                },
              ],
            },
          },
        },
        description: "The request has succeeded.",
      },
      default: {
        description: "An unexpected error response.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorModel",
            },
          },
        },
        headers: {
          "x-ms-error-code": {
            required: true,
            schema: {
              type: "string",
            },
          },
        },
      },
    });
  });

  it("should warn if shared routes differ by `@parameterVisibility`", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {
        model Resource {
          @visibility("read")
          @key
          id: string;

          @visibility("create", "update")
          name: string;
        }

        @sharedRoute
        @route("/foo")
        @parameterVisibility("read")
        op op1Foo(...Resource): Resource[];

        @sharedRoute
        @route("/foo")
        @parameterVisibility("create")
        op op2Foo(...Resource): Resource[];
      }
      `
    );
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/openapi3/inconsistent-shared-route-request-visibility",
      },
    ]);
  });
});
