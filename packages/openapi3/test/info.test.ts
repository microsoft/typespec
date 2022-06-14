import { deepStrictEqual, strictEqual } from "assert";
import { openApiFor } from "./test-host.js";

describe("openapi3: info", () => {
  it("set the service title with @serviceTitle", async () => {
    const res = await openApiFor(
      `
      @serviceTitle("My Service")
      namespace Foo {}
      `
    );
    strictEqual(res.info.title, "My Service");
  });

  it("set the service version with @serviceVersion", async () => {
    const res = await openApiFor(
      `
      @serviceVersion("1.2.3-test")
      namespace Foo {}
      `
    );
    strictEqual(res.info.version, "1.2.3-test");
  });

  it("set the service description with @doc", async () => {
    const res = await openApiFor(
      `
      @doc("My service description")
      @serviceTitle("My Service")
      namespace Foo {}
      `
    );
    strictEqual(res.info.description, "My service description");
  });
  it("set the service externalDocs with @externalDocs", async () => {
    const res = await openApiFor(
      `
      @externalDocs("https://example.com", "more info")
      @serviceTitle("My Service")
      namespace Foo {}
      `
    );
    deepStrictEqual(res.externalDocs, {
      url: "https://example.com",
      description: "more info",
    });
  });
});
