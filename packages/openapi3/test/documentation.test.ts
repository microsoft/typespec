import { deepStrictEqual, strictEqual } from "assert";
import { expect, it } from "vitest";
import { supportedVersions, worksFor } from "./works-for.js";

worksFor(supportedVersions, ({ openApiFor, version }) => {
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

  it("supports externalDocs on properties", async () => {
    const openApi = await openApiFor(`
      model Foo {
        @externalDocs("https://example.com", "more info")
        name: string;
      }
      `);
    expect(openApi.components.schemas.Foo.properties.name).toEqual({
      type: "string",
      externalDocs: {
        url: "https://example.com",
        description: "more info",
      },
    });
  });
  it("supports externalDocs on properties resulting in a $ref", async () => {
    const openApi = await openApiFor(`
      model Foo {
        @externalDocs("https://example.com", "more info")
        name: Bar;
      }
      model Bar {}
      `);
    const externalDocs = {
      url: "https://example.com",
      description: "more info",
    };
    if (version === "3.0.0") {
      // OpenAPI 3.0 does not allow keywords next to a `$ref`, so the reference is
      // wrapped in an `allOf`.
      expect(openApi.components.schemas.Foo.properties.name).toEqual({
        allOf: [{ $ref: "#/components/schemas/Bar" }],
        externalDocs,
      });
    } else {
      expect(openApi.components.schemas.Foo.properties.name).toEqual({
        $ref: "#/components/schemas/Bar",
        externalDocs,
      });
    }
  });
});
