import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { openApiFor } from "./test-host.js";

describe("openapi3: info", () => {
  it("set the service title with @service", async () => {
    const res = await openApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {
        op test(): string;
      }
      `,
    );
    strictEqual(res.info.title, "My Service");
  });

  it("set the service version with @service", async () => {
    const res = await openApiFor(
      `
      @service({
        #suppress "deprecated" "For test"
        version: "1.2.3-test"
      })
      namespace Foo {
        op test(): string;
      }
      `,
    );
    strictEqual(res.info.version, "1.2.3-test");
  });

  it("set the service description with @doc", async () => {
    const res = await openApiFor(
      `
      @doc("My service description")
      @service({title: "My Service"})
      namespace Foo {
        op test(): string;
      }
      `,
    );
    strictEqual(res.info.description, "My service description");
  });
  it("set the service externalDocs with @externalDocs", async () => {
    const res = await openApiFor(
      `
      @externalDocs("https://example.com", "more info")
      @service({title: "My Service"})
      namespace Foo {
        op test(): string;
      }
      `,
    );
    deepStrictEqual(res.externalDocs, {
      url: "https://example.com",
      description: "more info",
    });
  });

  it("set the additional information with @info decorator", async () => {
    const res = await openApiFor(
      `
      @service
      @info({
        termsOfService: "http://example.com/terms/",
        contact: {
          name: "API Support",
          url: "http://www.example.com/support",
          email: "support@example.com"
        },
        license: {
          name: "Apache 2.0",
          url: "http://www.apache.org/licenses/LICENSE-2.0.html"
        },
      })
      namespace Foo {
        op test(): string;
      }
      `,
    );
    deepStrictEqual(res.info, {
      title: "(title)",
      version: "0.0.0",
      termsOfService: "http://example.com/terms/",
      contact: {
        name: "API Support",
        url: "http://www.example.com/support",
        email: "support@example.com",
      },
      license: {
        name: "Apache 2.0",
        url: "http://www.apache.org/licenses/LICENSE-2.0.html",
      },
    });
  });
});
