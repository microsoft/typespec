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

  it("array form preserves explicit tag declaration order", async () => {
    const res = await openApiFor(
      `
      @service
      @tagMetadata(#[
        #{name: "First", description: "First tag"},
        #{name: "Second", description: "Second tag"},
        #{name: "Third", description: "Third tag"},
      ])
      namespace PetStore {};
      `,
    );

    deepStrictEqual(res.tags, [
      { name: "First", description: "First tag" },
      { name: "Second", description: "Second tag" },
      { name: "Third", description: "Third tag" },
    ]);
  });

  it("operation-level tag not defined in @tagMetadata is inserted before tagMetadata tags", async () => {
    const res = await openApiFor(
      `
      @service
      @tagMetadata("MetaTag", #{description: "Metadata tag"})
      namespace PetStore {
        @tag("OpOnlyTag") op op1(): string;
      };
      `,
    );

    // Tags used only in operations (not in @tagMetadata) are emitted first,
    // followed by tags defined with @tagMetadata.
    deepStrictEqual(res.tags, [
      { name: "OpOnlyTag" },
      { name: "MetaTag", description: "Metadata tag" },
    ]);
  });

  it("operation-level tag also defined in @tagMetadata (array form) is emitted once in its declared position", async () => {
    const res = await openApiFor(
      `
      @service
      @tagMetadata(#[
        #{name: "First", description: "First tag"},
        #{name: "Second", description: "Second tag"},
      ])
      namespace PetStore {
        @tag("First") op op1(): string;
      };
      `,
    );

    // Tags used in both operations and @tagMetadata are not duplicated;
    // they appear in their @tagMetadata-declared position with metadata.
    deepStrictEqual(res.tags, [
      { name: "First", description: "First tag" },
      { name: "Second", description: "Second tag" },
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

  it("array form with parent field emits tags in declared order", async () => {
    const res = await OpenAPISpecHelpers["3.2.0"].openApiFor(
      `
      @service
      @tagMetadata(#[
        #{name: "ParentTag", description: "Parent tag"},
        #{name: "ChildTag", description: "Child tag", parent: "ParentTag"},
      ])
      namespace PetStore {
        @tag("ChildTag") op test(): string;
      }
      `,
    );

    deepStrictEqual(res.tags, [
      {
        name: "ParentTag",
        description: "Parent tag",
      },
      {
        name: "ChildTag",
        description: "Child tag",
        parent: "ParentTag",
      },
    ]);
  });
});
