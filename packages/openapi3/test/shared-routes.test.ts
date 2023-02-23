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

        @route("/sharedroutes/resources", { shared: true })
        op listByResourceGroup(...Resource, @query resourceGroup: string, @query foo: string): Resource[];

        @route("/sharedroutes/resources", { shared: true })
        op listBySubscription(...Resource, @query subscription: string, @query foo: string): Resource[];
      }
      `
    );
    deepStrictEqual(
      results.paths["/sharedroutes/resources"].post.parameters[0].name,
      "subscription"
    );
    deepStrictEqual(results.paths["/sharedroutes/resources"].post.parameters[0].required, false);
    deepStrictEqual(results.paths["/sharedroutes/resources"].post.parameters[1].name, "foo");
    deepStrictEqual(results.paths["/sharedroutes/resources"].post.parameters[1].required, true);
    deepStrictEqual(
      results.paths["/sharedroutes/resources"].post.parameters[2].name,
      "resourceGroup"
    );
    deepStrictEqual(results.paths["/sharedroutes/resources"].post.parameters[2].required, false);
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
    deepStrictEqual(results.paths["/sharedroutes/resources"].post.parameters[0].name, "filter");
    deepStrictEqual(results.paths["/sharedroutes/resources"].post.parameters[0].required, true);
    deepStrictEqual(results.paths["/sharedroutes/resources"].post.parameters[0].schema, {
      type: "string",
      enum: ["subscription", "resourceGroup"],
    });
  });
});
