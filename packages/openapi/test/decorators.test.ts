import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import {
  getExtensions,
  getExternalDocs,
  getInfo,
  getTagsMetadata,
  resolveInfo,
  setInfo,
} from "../src/decorators.js";
import { Tester } from "./test-host.js";

describe("openapi: decorators", () => {
  describe("@operationId", () => {
    it("emit diagnostic if use on non operation", async () => {
      const diagnostics = await Tester.diagnose(`
        @operationId("foo")
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message:
          "Cannot apply @operationId decorator to Foo since it is not assignable to Operation",
      });
    });

    it("emit diagnostic if operation id is not a string", async () => {
      const diagnostics = await Tester.diagnose(`
        @operationId(123)
        op foo(): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
      });
    });
  });

  describe("@extension", () => {
    it("apply extension on model", async () => {
      const { program, Foo } = await Tester.compile(t.code`
        @extension("x-custom", "Bar")
        model ${t.model("Foo")} {
          prop: string
        }
      `);

      deepStrictEqual(Object.fromEntries(getExtensions(program, Foo)), {
        "x-custom": "Bar",
      });
    });

    it("apply extension with complex value", async () => {
      const { program, Foo } = await Tester.compile(t.code`
        @extension("x-custom", #{foo: 123, bar: "string"})
        model ${t.model("Foo")} {
          prop: string
        }
      `);

      deepStrictEqual(Object.fromEntries(getExtensions(program, Foo)), {
        "x-custom": { foo: 123, bar: "string" },
      });
    });

    it.for([
      { value: `#{ name: "foo" }`, expected: { name: "foo" } },
      { value: `#{ items: #[ #{foo: "bar" }]}`, expected: { items: [{ foo: "bar" }] } },
      { value: `#["foo"]`, expected: ["foo"] },
      { value: `true`, expected: true },
      { value: `42`, expected: 42 },
      { value: `"hi"`, expected: "hi" },
      { value: `null`, expected: null },
    ])("treats value $value as raw value", async ({ value, expected }) => {
      const { program, Foo } = await Tester.compile(t.code`
          @extension("x-custom", ${value})
          model ${t.model("Foo")} {}  
        `);

      deepStrictEqual(Object.fromEntries(getExtensions(program, Foo)), {
        "x-custom": expected,
      });
    });

    it("supports extension key not starting with `x-`", async () => {
      const { program, Foo } = await Tester.compile(t.code`
        @extension("foo", "Bar")
        model ${t.model("Foo")} {
          prop: string
        }
      `);

      deepStrictEqual(Object.fromEntries(getExtensions(program, Foo)), {
        foo: "Bar",
      });
    });

    it("emit diagnostics when passing non string extension key", async () => {
      const diagnostics = await Tester.diagnose(`
        @extension(123, "Bar")
        @test
        model Foo {
          prop: string
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
      });
    });
  });

  describe("@externalDocs", () => {
    it("emit diagnostic if url is not a string", async () => {
      const diagnostics = await Tester.diagnose(`
        @externalDocs(123)
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
      });
    });

    it("emit diagnostic if description is not a string", async () => {
      const diagnostics = await Tester.diagnose(`
        @externalDocs("https://example.com", 123)
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
      });
    });

    it("set the external url", async () => {
      const { program, Foo } = await Tester.compile(t.code`
        @externalDocs("https://example.com")
        model ${t.model("Foo")} {}
      `);

      deepStrictEqual(getExternalDocs(program, Foo), { url: "https://example.com" });
    });

    it("set the external url with description", async () => {
      const { program, Foo } = await Tester.compile(t.code`
        @externalDocs("https://example.com", "More info there")
        model ${t.model("Foo")} {}
      `);

      deepStrictEqual(getExternalDocs(program, Foo), {
        url: "https://example.com",
        description: "More info there",
      });
    });
  });

  describe("@info", () => {
    describe("emit diagnostics when passing extension key not starting with `x-` in additionalInfo", () => {
      it.each([
        ["root", `#{ foo: "Bar" }`],
        ["license", `#{ license: #{ name: "Apache 2.0", foo:"Bar"} }`],
        ["contact", `#{ contact: #{ foo:"Bar"} }`],
        ["complex", `#{ contact: #{ \`x-custom\`: "string" }, foo:"Bar" }`],
      ])("%s", async (_, code) => {
        const diagnostics = await Tester.diagnose(`
        @info(${code})
        @test namespace Service;
      `);

        expectDiagnostics(diagnostics, {
          code: "@typespec/openapi/invalid-extension-key",
          message: `OpenAPI extension must start with 'x-' but was 'foo'`,
        });
      });

      it("multiple", async () => {
        const diagnostics = await Tester.diagnose(`
          @info(#{
            license: #{ name: "Apache 2.0", foo1:"Bar"}, 
            contact: #{ \`x-custom\`: "string", foo2:"Bar" }, 
            foo3:"Bar" 
          })
          @test namespace Service;
        `);

        expectDiagnostics(diagnostics, [
          {
            code: "@typespec/openapi/invalid-extension-key",
            message: `OpenAPI extension must start with 'x-' but was 'foo1'`,
          },
          {
            code: "@typespec/openapi/invalid-extension-key",
            message: `OpenAPI extension must start with 'x-' but was 'foo2'`,
          },
          {
            code: "@typespec/openapi/invalid-extension-key",
            message: `OpenAPI extension must start with 'x-' but was 'foo3'`,
          },
        ]);
      });
    });

    it("emit diagnostic if termsOfService is not a valid url", async () => {
      const diagnostics = await Tester.diagnose(`
        @info(#{termsOfService:"notvalidurl"})
        namespace Service {}
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/openapi/not-url",
        message: "TermsOfService: notvalidurl is not a valid URL.",
      });
    });

    it("emit diagnostic if use on non namespace", async () => {
      const diagnostics = await Tester.diagnose(`
        @info(#{})
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @info decorator to Foo since it is not assignable to Namespace",
      });
    });

    it("emit diagnostic if info parameter is not an object", async () => {
      const diagnostics = await Tester.diagnose(`
        @info(123)
        namespace Service {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
      });
    });

    it("set all properties", async () => {
      const { program, Service } = await Tester.compile(t.code`
        @info(#{
          title: "My API",
          version: "1.0.0",
          summary: "My API summary",
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
        namespace ${t.namespace("Service")} {}
      `);

      deepStrictEqual(getInfo(program, Service), {
        title: "My API",
        version: "1.0.0",
        summary: "My API summary",
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

    it("resolveInfo() merge with data from @service and @summary", async () => {
      const { program, Service } = await Tester.compile(t.code`
        @service(#{ 
          title: "Service API", 
        })
        @summary("My summary")
        @info(#{
          version: "1.0.0",
          termsOfService: "http://example.com/terms/",
        })
        namespace ${t.namespace("Service")} {}
      `);

      deepStrictEqual(resolveInfo(program, Service), {
        title: "Service API",
        version: "1.0.0",
        summary: "My summary",
        termsOfService: "http://example.com/terms/",
      });
    });

    it("resolveInfo() returns empty object if nothing is provided", async () => {
      const { program, Service } = await Tester.compile(t.code`
        namespace ${t.namespace("Service")} {}
      `);

      deepStrictEqual(resolveInfo(program, Service), {});
    });

    it("setInfo() function for setting info object directly", async () => {
      const { program, Service } = await Tester.compile(t.code`
        namespace ${t.namespace("Service")} {}
      `);
      setInfo(program, Service, {
        title: "My API",
        version: "1.0.0",
        summary: "My API summary",
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
        "x-custom": "Bar",
      });
      deepStrictEqual(getInfo(program, Service), {
        title: "My API",
        version: "1.0.0",
        summary: "My API summary",
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
        "x-custom": "Bar",
      });
    });
  });

  describe("@tagMetadata", () => {
    it("emit an error if a non-service namespace", async () => {
      const diagnostics = await Tester.diagnose(
        `
        @tagMetadata("tagName", #{})
        namespace Test {}
      `,
      );
      expectDiagnostics(diagnostics, [
        {
          code: "@typespec/openapi/tag-metadata-target-service",
        },
      ]);
    });

    it.each([
      ["tagName is not a string", `@tagMetadata(123, #{})`],
      ["tagMetdata parameter is not an object", `@tagMetadata("tagName", 123)`],
      ["description is not a string", `@tagMetadata("tagName", #{ description: 123, })`],
      ["externalDocs is not an object", `@tagMetadata("tagName", #{ externalDocs: 123, })`],
    ])("%s", async (_, code) => {
      const diagnostics = await Tester.diagnose(
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
      const diagnostics = await Tester.diagnose(
        `
        @service()
        @tagMetadata("tagName", #{})
        @tagMetadata("tagName", #{})
        namespace PetStore{};
        `,
      );

      expectDiagnostics(diagnostics, {
        code: "@typespec/openapi/duplicate-tag",
      });
    });

    describe("emit diagnostics when passing extension key not starting with `x-` in metadata", () => {
      it.each([
        ["root", `#{ foo:"Bar" }`],
        ["externalDocs", `#{ externalDocs: #{ url: "https://example.com", foo:"Bar"} }`],
        [
          "complex",
          `#{ externalDocs: #{ url: "https://example.com", \`x-custom\`: "string" }, foo:"Bar" }`,
        ],
      ])("%s", async (_, code) => {
        const diagnostics = await Tester.diagnose(
          `
          @service()
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
        const diagnostics = await Tester.diagnose(
          `
          @service()
          @tagMetadata("tagName", #{
            externalDocs: #{ url: "https://example.com", foo1:"Bar" }, 
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
      const diagnostics = await Tester.diagnose(
        `
        @service
        @tagMetadata("tagName", #{
            externalDocs: #{ url: "notvalidurl"}, 
        })
        namespace Service {}
        `,
      );

      expectDiagnostics(diagnostics, {
        code: "@typespec/openapi/not-url",
        message: "externalDocs.url: notvalidurl is not a valid URL.",
      });
    });

    it("emit diagnostic if use on non namespace", async () => {
      const diagnostics = await Tester.diagnose(
        `
        @tagMetadata("tagName", #{})
        model Foo {}
        `,
      );

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message:
          "Cannot apply @tagMetadata decorator to Foo since it is not assignable to Namespace",
      });
    });

    const testCases: [string, string, any][] = [
      ["set tagMetadata without additionalInfo", `@tagMetadata("tagName", #{})`, { tagName: {} }],
      [
        "set tagMetadata without externalDocs",
        `@tagMetadata("tagName", #{ description: "Pets operations" })`,
        { tagName: { description: "Pets operations" } },
      ],
      [
        "set tagMetadata additionalInfo",
        `@tagMetadata("tagName", #{ \`x-custom\`: "string" })`,
        { tagName: { "x-custom": "string" } },
      ],
      [
        "set multiple tagsMetadata",
        `@tagMetadata(
            "tagName1",
            #{
              description: "Pets operations",
              externalDocs: #{
                url: "https://example.com",
                \`x-custom\`: "string"
              }        
            }
          )
          @tagMetadata(
            "tagName2",
            #{
              description: "Pets operations",
              externalDocs: #{
                url: "https://example.com",
                description: "More info."        
              },
               \`x-custom\`: "string"
            }
          )`,
        {
          tagName1: {
            description: "Pets operations",
            externalDocs: {
              url: "https://example.com",
              "x-custom": "string",
            },
          },

          tagName2: {
            description: "Pets operations",
            externalDocs: {
              url: "https://example.com",
              description: "More info.",
            },
            "x-custom": "string",
          },
        },
      ],
    ];
    it.each(testCases)("%s", async (_, tagMetaDecorator, expected) => {
      const { program, PetStore } = await Tester.compile(t.code`
        @service()
        ${tagMetaDecorator}
        namespace ${t.namespace("PetStore")} {}
      `);
      deepStrictEqual(getTagsMetadata(program, PetStore), expected);
    });
  });
});
