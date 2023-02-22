import { expectDiagnostics } from "@typespec/compiler/testing";
import { ok } from "assert";
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

  it("allows shared routes that differ by query params in signature", async () => {
    const results = await openApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {
        model Resource {
          id: string;
        }

        @route("/sharedroutes/resources", { shared: true })
        op listByResourceGroup(...Resource, @query resourceGroup: string): Resource[];

        @route("/sharedroutes/resources", { shared: true })
        op listBySubscription(...Resource, @query subscription: string): Resource[];
      }
      `
    );
    ok(false, "Finish test");
  });
});
