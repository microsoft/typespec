import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
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

        @operationId("List_ResourceGroup")
        @route("/sharedroutes/resources", { shared: true })
        op listByResourceGroup(...Resource, @query resourceGroup: string, @query foo: string): Resource[];

        @operationId("List_Subscription")
        @route("/sharedroutes/resources", { shared: true })
        op listBySubscription(...Resource, @query subscription: string, @query foo: string): Resource[];
      }
      `
    );
    deepStrictEqual(
      results.paths["/sharedroutes/resources"].post.operationId,
      "List_ResourceGroup_List_Subscription"
    );
    const params = results.paths["/sharedroutes/resources"].post.parameters as {
      name: string;
      required: boolean;
    }[];
    deepStrictEqual(params, [
      {
        in: "query",
        name: "resourceGroup",
        required: false,
        schema: {
          type: "string",
        },
      },
      {
        in: "query",
        name: "foo",
        required: true,
        schema: {
          type: "string",
        },
      },
      {
        in: "query",
        name: "subscription",
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

        @route("/sharedroutes/resources", { shared: true })
        op listByResourceGroup(...Resource, @query filter: "resourceGroup"): Resource[];

        @route("/sharedroutes/resources", { shared: true })
        op listBySubscription(...Resource, @query filter: "subscription"): Resource[];
      }
      `
    );
    deepStrictEqual(
      results.paths["/sharedroutes/resources"].post.operationId,
      "listByResourceGroup_listBySubscription"
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

        @route("/sharedroutes/resources", { shared: true })
        op listByResourceGroup(...Resource, @query filter: "resourceGroup"): Resource[];

        @route("/sharedroutes/resources", { shared: true })
        op listBySubscription(...Resource, @header filter: "subscription"): Resource[];
      }
      `
    );
    deepStrictEqual(
      results.paths["/sharedroutes/resources"].post.operationId,
      "listByResourceGroup_listBySubscription"
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

        @route("/sharedroutes/resources", { shared: true })
        op returnsInt(...Resource, @query options: string): int32;

        @route("/sharedroutes/resources", { shared: true })
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
              oneOf: [
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

  it("model shared routes with different request body types", async () => {
    const results = await openApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {
        @route("/sharedroutes/resources", { shared: true })
        op processInt(@body body: int32, @query options: string): void;

        @route("/sharedroutes/resources", { shared: true })
        op processString(@body body: string, @query options: string): void;
      }
      `
    );
    deepStrictEqual(
      results.paths["/sharedroutes/resources"].post.operationId,
      "processInt_processString"
    );
    const requestBody = results.paths["/sharedroutes/resources"].post.requestBody;
    deepStrictEqual(requestBody, {
      content: {
        "application/json": {
          schema: {
            oneOf: [
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

  it("model shared routes with different request and response body types", async () => {
    const results = await openApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {
        @route("/process", { shared: true })
        op processInt(@body body: int32, @query options: string): int32;

        @route("/process", { shared: true })
        op processString(@body body: string, @query options: string): string;
      }
      `
    );
    deepStrictEqual(results.paths["/process"].post.operationId, "processInt_processString");
    const requestBody = results.paths["/process"].post.requestBody;
    deepStrictEqual(requestBody, {
      content: {
        "application/json": {
          schema: {
            oneOf: [
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
              oneOf: [
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
});
