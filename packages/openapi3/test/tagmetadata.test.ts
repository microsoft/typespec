import { deepStrictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { OpenAPISpecHelpers, supportedVersions, worksFor } from "./works-for.js";

worksFor(supportedVersions, ({ openApiFor, openapisFor }) => {
  const testCases: [string, string, string, any][] = [
    [
      "set tag metadata",
      `@tagMetadata(
      "TagName",
        #{
          description: "Pets operations",
          externalDocs: #{
            url: "https://example.com",
            description: "More info.",
            \`x-custom\`: "string"
          },
          \`x-custom\`: "string"
        }
      )`,
      ``,
      [
        {
          name: "TagName",
          description: "Pets operations",
          externalDocs: {
            description: "More info.",
            url: "https://example.com",
            "x-custom": "string",
          },
          "x-custom": "string",
        },
      ],
    ],
    [
      "add additional information for tag",
      `@tagMetadata(
        "TagName",
        #{
          description: "Pets operations",
          externalDocs: #{
            url: "https://example.com",
            description: "More info.",
            \`x-custom\`: "string"
          },
          \`x-custom\`: "string"
        }
      )`,
      `@tag("TagName") op NamespaceOperation(): string;`,
      [
        {
          name: "TagName",
          description: "Pets operations",
          externalDocs: {
            description: "More info.",
            url: "https://example.com",
            "x-custom": "string",
          },
          "x-custom": "string",
        },
      ],
    ],
    [
      "set tag and tag metadata with different name",
      `@tagMetadata(
        "TagName",
        #{
          description: "Pets operations",
          externalDocs: #{
            url: "https://example.com",
            description: "More info.",
            \`x-custom\`: "string"
          },
          \`x-custom\`: "string"
        }
      )`,
      `@tag("opTag") op NamespaceOperation(): string;`,
      [
        { name: "opTag" },
        {
          name: "TagName",
          description: "Pets operations",
          externalDocs: {
            description: "More info.",
            url: "https://example.com",
            "x-custom": "string",
          },
          "x-custom": "string",
        },
      ],
    ],
  ];
  it.each(testCases)("%s", async (_, tagMetaDecorator, operationDeclaration, expected) => {
    const res = await openApiFor(
      `
      @service
      ${tagMetaDecorator}  
      namespace PetStore{${operationDeclaration}};
      `,
    );

    deepStrictEqual(res.tags, expected);
  });

  it("tagMetadata do not gets applied to another service without tags", async () => {
    const res = await openapisFor(`
      @service
      @tagMetadata(
        "CatTag", #{ description: "Cat operations" }
      )
      namespace CatStore {}

      @service
      namespace DogStore {}
    `);
    expect(res["openapi.CatStore.json"].tags).toEqual([
      {
        description: "Cat operations",
        name: "CatTag",
      },
    ]);
    expect(res["openapi.DogStore.json"].tags).toEqual([]);
  });

  it("tagMetadata only affect the service they are defined on", async () => {
    const res = await openapisFor(`
      @service
      @tagMetadata(
        "CatTag", #{ description: "Cat operations" }
      )
      namespace CatStore {}

      @service
      @tagMetadata(
        "DogTag", #{ description: "Dog operations" }
      )
      namespace DogStore {}
    `);
    expect(res["openapi.CatStore.json"].tags).toEqual([
      {
        description: "Cat operations",
        name: "CatTag",
      },
    ]);
    expect(res["openapi.DogStore.json"].tags).toEqual([
      {
        description: "Dog operations",
        name: "DogTag",
      },
    ]);
  });
});

// Test for parent field - version specific behavior
describe("tag metadata with parent field", () => {
  it("OpenAPI 3.2 should emit parent field as-is", async () => {
    const res = await OpenAPISpecHelpers["3.2.0"].openApiFor(
      `
      @service
      @tagMetadata("ParentTag", #{description: "Parent tag"})
      @tagMetadata("ChildTag", #{description: "Child tag", parent: "ParentTag"})
      namespace PetStore {
        @tag("ChildTag") op test(): string;
      }
      `,
    );

    deepStrictEqual(res.tags, [
      {
        name: "ChildTag",
        description: "Child tag",
        parent: "ParentTag",
      },
      {
        name: "ParentTag",
        description: "Parent tag",
      },
    ]);
  });

  it("OpenAPI 3.1 should drop parent field", async () => {
    const res = await OpenAPISpecHelpers["3.1.0"].openApiFor(
      `
      @service
      @tagMetadata("ParentTag", #{description: "Parent tag"})
      @tagMetadata("ChildTag", #{description: "Child tag", parent: "ParentTag"})
      namespace PetStore {
        @tag("ChildTag") op test(): string;
      }
      `,
    );

    deepStrictEqual(res.tags, [
      {
        name: "ChildTag",
        description: "Child tag",
      },
      {
        name: "ParentTag",
        description: "Parent tag",
      },
    ]);
  });

  it("OpenAPI 3.0 should drop parent field", async () => {
    const res = await OpenAPISpecHelpers["3.0.0"].openApiFor(
      `
      @service
      @tagMetadata("ParentTag", #{description: "Parent tag"})
      @tagMetadata("ChildTag", #{description: "Child tag", parent: "ParentTag"})
      namespace PetStore {
        @tag("ChildTag") op test(): string;
      }
      `,
    );

    deepStrictEqual(res.tags, [
      {
        name: "ChildTag",
        description: "Child tag",
      },
      {
        name: "ParentTag",
        description: "Parent tag",
      },
    ]);
  });
});

// Tests for summary and kind fields - version specific behavior
describe("tag metadata with summary and kind fields", () => {
  it("OpenAPI 3.2 should emit summary and kind as native fields", async () => {
    const res = await OpenAPISpecHelpers["3.2.0"].openApiFor(
      `
      @service
      @tagMetadata("foo", #{summary: "all operations that allow doing Foo", kind: "FooGroup"})
      namespace PetStore {
        @tag("foo") op test(): string;
      }
      `,
    );

    deepStrictEqual(res.tags, [
      {
        name: "foo",
        summary: "all operations that allow doing Foo",
        kind: "FooGroup",
      },
    ]);
  });

  it("OpenAPI 3.1 should emit summary as x-oai-summary and kind as x-oai-kind", async () => {
    const res = await OpenAPISpecHelpers["3.1.0"].openApiFor(
      `
      @service
      @tagMetadata("foo", #{summary: "all operations that allow doing Foo", kind: "FooGroup"})
      namespace PetStore {
        @tag("foo") op test(): string;
      }
      `,
    );

    deepStrictEqual(res.tags, [
      {
        name: "foo",
        "x-oai-summary": "all operations that allow doing Foo",
        "x-oai-kind": "FooGroup",
      },
    ]);
  });

  it("OpenAPI 3.0 should emit summary as x-oai-summary and kind as x-oai-kind", async () => {
    const res = await OpenAPISpecHelpers["3.0.0"].openApiFor(
      `
      @service
      @tagMetadata("foo", #{summary: "all operations that allow doing Foo", kind: "FooGroup"})
      namespace PetStore {
        @tag("foo") op test(): string;
      }
      `,
    );

    deepStrictEqual(res.tags, [
      {
        name: "foo",
        "x-oai-summary": "all operations that allow doing Foo",
        "x-oai-kind": "FooGroup",
      },
    ]);
  });

  it("OpenAPI 3.2 should emit summary only if kind is absent", async () => {
    const res = await OpenAPISpecHelpers["3.2.0"].openApiFor(
      `
      @service
      @tagMetadata("foo", #{summary: "all operations that allow doing Foo"})
      namespace PetStore {
        @tag("foo") op test(): string;
      }
      `,
    );

    deepStrictEqual(res.tags, [
      {
        name: "foo",
        summary: "all operations that allow doing Foo",
      },
    ]);
  });

  it("OpenAPI 3.2 should emit kind only if summary is absent", async () => {
    const res = await OpenAPISpecHelpers["3.2.0"].openApiFor(
      `
      @service
      @tagMetadata("foo", #{kind: "FooGroup"})
      namespace PetStore {
        @tag("foo") op test(): string;
      }
      `,
    );

    deepStrictEqual(res.tags, [
      {
        name: "foo",
        kind: "FooGroup",
      },
    ]);
  });
});
