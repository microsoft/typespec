import { DecoratorContext, Namespace, getNamespaceFullName } from "@typespec/compiler";
import { createTestWrapper, expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { createOpenAPITestHost, createOpenAPITestRunner, openApiFor } from "./test-host.js";

describe("openapi3: versioning", () => {
  it("works with models", async () => {
    const { v1, v2, v3 } = await openApiFor(
      `
      @versioned(Versions)
      @service({title: "My Service"})
      namespace MyService {
        enum Versions {
          @useDependency(MyLibrary.Versions.A)
          "v1",
          @useDependency(MyLibrary.Versions.B)
          "v2",
          @useDependency(MyLibrary.Versions.C)
          "v3"}
        model Test {
          prop1: string;
          @added(Versions.v2) prop2: string;
          @removed(Versions.v2) prop3: string;
          @renamedFrom(Versions.v3, "prop4") prop4new: string;
          @madeOptional(Versions.v3) prop5?: string;
        }

        @route("/read1")
        op read1(): Test;
        op read2(): MyLibrary.Foo;
      }

      @versioned(Versions)
      namespace MyLibrary {
        enum Versions {A, B, C}

        model Foo {
          prop1: string;
          @added(Versions.B) prop2: string;
          @added(Versions.C) prop3: string;
        }
      }
    `,
      ["v1", "v2", "v3"],
    );

    strictEqual(v1.info.version, "v1");
    deepStrictEqual(v1.components.schemas.Test, {
      type: "object",
      properties: {
        prop1: { type: "string" },
        prop3: { type: "string" },
        prop4: { type: "string" },
        prop5: { type: "string" },
      },
      required: ["prop1", "prop3", "prop4", "prop5"],
    });

    deepStrictEqual(v1.components.schemas["MyLibrary.Foo"], {
      type: "object",
      properties: {
        prop1: { type: "string" },
      },
      required: ["prop1"],
    });

    strictEqual(v2.info.version, "v2");
    deepStrictEqual(v2.components.schemas.Test, {
      type: "object",
      properties: {
        prop1: { type: "string" },
        prop2: { type: "string" },
        prop4: { type: "string" },
        prop5: { type: "string" },
      },
      required: ["prop1", "prop2", "prop4", "prop5"],
    });
    deepStrictEqual(v2.components.schemas["MyLibrary.Foo"], {
      type: "object",
      properties: {
        prop1: { type: "string" },
        prop2: { type: "string" },
      },
      required: ["prop1", "prop2"],
    });

    strictEqual(v3.info.version, "v3");
    deepStrictEqual(v3.components.schemas.Test, {
      type: "object",
      properties: {
        prop1: { type: "string" },
        prop2: { type: "string" },
        prop4new: { type: "string" },
        prop5: { type: "string" },
      },
      required: ["prop1", "prop2", "prop4new"],
    });
    deepStrictEqual(v3.components.schemas["MyLibrary.Foo"], {
      type: "object",
      properties: {
        prop1: { type: "string" },
        prop2: { type: "string" },
        prop3: { type: "string" },
      },
      required: ["prop1", "prop2", "prop3"],
    });
  });

  it("doesn't lose parent namespace", async () => {
    const host = await createOpenAPITestHost();

    let storedNamespace: string | undefined = undefined;
    host.addJsFile("test.js", {
      $armNamespace(context: DecoratorContext, entity: Namespace) {
        storedNamespace = getNamespaceFullName(entity);
      },
    });

    const runner = createTestWrapper(host, {
      autoImports: [...host.libraries.map((x) => x.name), "./test.js"],
      autoUsings: ["TypeSpec.Rest", "TypeSpec.Http", "TypeSpec.OpenAPI", "TypeSpec.Versioning"],
      compilerOptions: { emit: ["@typespec/openapi3"] },
    });

    await runner.compile(`
    @versioned(Contoso.Library.Versions)
    namespace Contoso.Library {
      namespace Blah { }
      enum Versions { v1 };
    }
    @armNamespace
    @service({title: "Widgets 'r' Us"})
    @useDependency(Contoso.Library.Versions.v1)
    namespace Contoso.WidgetService {
      model Widget {
        @key
        @segment("widgets")
        id: string;
      }
      interface Operations {
        @test
        op get(id: string): Widget;
      }
    }
    `);

    strictEqual(storedNamespace, "Contoso.WidgetService");
  });

  // Test for https://github.com/microsoft/typespec/issues/812
  it("doesn't throw errors when using UpdateableProperties", async () => {
    // if this test throws a duplicate name diagnostic, check that getEffectiveType
    // is returning the projected type.
    const runner = await createOpenAPITestRunner({ withVersioning: true });
    await runner.compile(`
      @versioned(Library.Versions)
      namespace Library {
        enum Versions {
          v1,
          v2,
        }
      }
      
      @service({title: "Service"})
      @useDependency(Library.Versions.v1)
      namespace Service {
        model Widget {
          details?: WidgetDetails;
        }
      
        model WidgetDetails {}
        interface Projects {
          oops(...UpdateableProperties<Widget>): Widget;
        }
      }
    `);
  });

  describe("versioned resource", () => {
    it("reports diagnostic without crashing for mismatched versions", async () => {
      const runner = await createOpenAPITestRunner({ withVersioning: true });
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        @service
        namespace DemoService;

        enum Versions { 
          v1, 
          v2 
        }

        model Toy {
          @key id: string;
        }

        @added(Versions.v2)
        model Widget { 
          @key id: string; 
        }

        @error
        model Error {
          message: string;
        }

        @route("/toys")
        interface Toys extends Resource.ResourceOperations<Toy, Error> {}

        @route("/widgets")
        interface Widgets extends Resource.ResourceOperations<Widget, Error> {}
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
      });
    });

    it("succeeds for aligned versions", async () => {
      const runner = await createOpenAPITestRunner({ withVersioning: true });
      await runner.compile(`
        @versioned(Versions)
        @service
        namespace DemoService;

        enum Versions { 
          v1, 
          v2 
        }

        model Toy {
          @key id: string;
        }

        @added(Versions.v2)
        model Widget { 
          @key id: string; 
        }

        @error
        model Error {
          message: string;
        }

        @route("/toys")
        interface Toys extends Resource.ResourceOperations<Toy, Error> {}

        @added(Versions.v2)
        @route("/widgets")
        interface Widgets extends Resource.ResourceOperations<Widget, Error> {}
    `);
    });
  });
});
