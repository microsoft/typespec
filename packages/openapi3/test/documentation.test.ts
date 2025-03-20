import { deepStrictEqual, strictEqual } from "assert";
import { it } from "vitest";
import { worksFor } from "./works-for.js";

worksFor(["3.0.0", "3.1.0"], ({ openApiFor }) => {
  it("supports summary and description", async () => {
    const openApi = await openApiFor(`
      @summary("This is a summary")
      @doc("This is the longer description")
      op read(): {};
      `);
    strictEqual(openApi.paths["/"].get.summary, "This is a summary");
    strictEqual(openApi.paths["/"].get.description, "This is the longer description");
  });

  it("supports externalDocs on operation", async () => {
    const openApi = await openApiFor(`
      @externalDocs("https://example.com", "more info")
      op read(): {};
      `);
    deepStrictEqual(openApi.paths["/"].get.externalDocs, {
      url: "https://example.com",
      description: "more info",
    });
  });

  it("supports externalDocs on models", async () => {
    const openApi = await openApiFor(`
      op read(): Foo;

      @externalDocs("https://example.com", "more info")
      model Foo {
        name: string;
      }
      `);
    deepStrictEqual(openApi.components.schemas.Foo.externalDocs, {
      url: "https://example.com",
      description: "more info",
    });
  });
});
