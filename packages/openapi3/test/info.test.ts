import { deepStrictEqual, strictEqual } from "assert";
import { it } from "vitest";
import { worksFor } from "./works-for.js";

worksFor(["3.0.0", "3.1.0"], ({ openApiFor }) => {
  it("set the service title with @service", async () => {
    const res = await openApiFor(
      `
      @service(#{title: "My Service"})
      namespace Foo {
        op test(): string;
      }
      `,
    );
    strictEqual(res.info.title, "My Service");
  });

  it("set the service description with @doc", async () => {
    const res = await openApiFor(
      `
      @doc("My service description")
      @service(#{title: "My Service"})
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
      @service(#{title: "My Service"})
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
      @info(#{
        termsOfService: "http://example.com/terms/",
        contact: #{
          name: "API Support",
          url: "http://www.example.com/support",
          email: "support@example.com"
        },
        license: #{
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
