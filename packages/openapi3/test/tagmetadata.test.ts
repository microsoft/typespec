import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";

import { openApiFor } from "./test-host.js";

describe("emit results when set value with @tagMetadata decorator", () => {
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
});
