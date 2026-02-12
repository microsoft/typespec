import { deepStrictEqual } from "assert";
import { expect, it } from "vitest";
import { supportedVersions, worksFor } from "./works-for.js";

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
