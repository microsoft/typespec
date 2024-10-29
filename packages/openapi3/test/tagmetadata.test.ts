import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { getTagsMetadata } from "../src/decorators.js";
import { createOpenAPITestRunner, diagnoseOpenApiFor, openApiFor } from "./test-host.js";

it.each([
  ["tagName is not a string", `@tagMetadata(123)`],
  ["tagMetdata parameter is not an object", `@tagMetadata("tagName", 123)`],
  ["description is not a string", `@tagMetadata("tagName", { description: 123, })`],
  ["externalDocs is not an object", `@tagMetadata("tagName", { externalDocs: 123, })`],
])("%s", async (_, code) => {
  const diagnostics = await diagnoseOpenApiFor(
    `
    ${code}
    namespace PetStore{};
    `,
  );

  expectDiagnostics(diagnostics, {
    code: "invalid-argument",
  });
});

it("emit diagnostic if dup tagName", async () => {
  const diagnostics = await diagnoseOpenApiFor(
    `
    @tagMetadata("tagName")
    @tagMetadata("tagName")
    namespace PetStore{};
    `,
  );

  expectDiagnostics(diagnostics, {
    code: "@typespec/openapi3/duplicate-tag",
  });
});

describe("emit diagnostics when passing extension key not starting with `x-` in additionalInfo", () => {
  it.each([
    ["root", `{ foo:"Bar" }`],
    ["externalDocs", `{ externalDocs:{ url: "https://example.com", foo:"Bar"} }`],
    ["complex", `{ externalDocs:{ url: "https://example.com", "x-custom": "string" }, foo:"Bar" }`],
  ])("%s", async (_, code) => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      @tagMetadata("tagName", ${code})
      namespace PetStore{};
      `,
    );

    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi/invalid-extension-key",
      message: `OpenAPI extension must start with 'x-' but was 'foo'`,
    });
  });

  it("multiple", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      @tagMetadata("tagName",{
        externalDocs: { url: "https://example.com", foo1:"Bar" }, 
        foo2:"Bar" 
      })
      @test namespace Service{};
      `,
    );

    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/openapi/invalid-extension-key",
        message: `OpenAPI extension must start with 'x-' but was 'foo1'`,
      },
      {
        code: "@typespec/openapi/invalid-extension-key",
        message: `OpenAPI extension must start with 'x-' but was 'foo2'`,
      },
    ]);
  });
});

it("emit diagnostic if externalDocs.url is not a valid url", async () => {
  const diagnostics = await diagnoseOpenApiFor(
    `
    @tagMetadata("tagName", {
        externalDocs: { url: "notvalidurl"}, 
    })
    @test namespace Service {}
    `,
  );

  expectDiagnostics(diagnostics, {
    code: "@typespec/openapi/not-url",
    message: "externalDocs.url: notvalidurl is not a valid URL.",
  });
});

it("emit diagnostic if use on non namespace", async () => {
  const diagnostics = await diagnoseOpenApiFor(
    `
    @tagMetadata("tagName",{})
    model Foo {}
    `,
  );

  expectDiagnostics(diagnostics, {
    code: "decorator-wrong-target",
    message: "Cannot apply @tagMetadata decorator to Foo since it is not assignable to Namespace",
  });
});

it.each([
  [
    "tagMetadata without additionalInfo",
    `@tagMetadata("tagName")`,
    { tagName: { name: "tagName" } },
  ],
  [
    "tagMetadata without externalDocs",
    `@tagMetadata("tagName",{description: "Pets operations"})`,
    { tagName: { name: "tagName", description: "Pets operations" } },
  ],
  [
    "multiple tagsMetadata",
    `@tagMetadata(
        "tagName1",
        {
          description: "Pets operations",
          externalDocs: {
            url: "https://example.com",
            "x-custom": "string"
          },          
        }
      )
      @tagMetadata(
        "tagName2",
        {
          description: "Pets operations",
          externalDocs: {
            url: "https://example.com",
            description: "More info.",           
          },
          "x-custom": "string"
        }
      )`,
    {
      tagName1: {
        name: "tagName1",
        description: "Pets operations",
        externalDocs: {
          url: "https://example.com",
          "x-custom": "string",
        },
      },

      tagName2: {
        name: "tagName2",
        description: "Pets operations",
        externalDocs: {
          url: "https://example.com",
          description: "More info.",
        },
        "x-custom": "string",
      },
    },
  ],
])("%s", async (_, code, expected) => {
  const runner = await createOpenAPITestRunner();
  const { PetStore } = await runner.compile(
    `
    ${code}
    @test 
    namespace PetStore {}
    `,
  );
  deepStrictEqual(getTagsMetadata(runner.program, PetStore), expected);
});

it.each([
  [
    "set the additional information with @tagMetadata decorator",
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
    "set tag with @tagMetadata decorator",
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
    "set tags with @tagMetadata decorator and @tag decorator",
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
])("%s", async (_, code, expected) => {
  const res = await openApiFor(
    `
    @service
    @tagMetadata(
      "TagName",
      {
        description: "Pets operations",
        externalDocs: {
          url: "https://example.com",
          description: "More info.",
          "x-custom": "string"
        },
        "x-custom": "string"
      }
    )      
    namespace PetStore{${code}};
    `,
  );

  deepStrictEqual(res.tags, expected);
});
