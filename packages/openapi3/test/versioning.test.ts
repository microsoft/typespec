import { DecoratorContext, Namespace } from "@cadl-lang/compiler";
import { createTestWrapper } from "@cadl-lang/compiler/testing";
import { deepStrictEqual, strictEqual } from "assert";
import { createOpenAPITestHost, createOpenAPITestRunner, openApiFor } from "./test-host.js";

describe("openapi3: versioning", () => {
  it("works with models", async () => {
    const { v1, v2, v3 } = await openApiFor(
      `
      @versioned(Versions)
      @versionedDependency([[Versions.v1, MyLibrary.Versions.A], [Versions.v2, MyLibrary.Versions.B], [Versions.v3, MyLibrary.Versions.C]])
      @serviceTitle("My Service")
      @serviceVersion("hi")
      namespace MyService {
        enum Versions {"v1", "v2", "v3"}
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
      ["v1", "v2", "v3"]
    );

    strictEqual(v1.info.version, "v1");
    deepStrictEqual(v1.components.schemas.Test, {
      type: "object",
      properties: {
        prop1: { type: "string" },
        prop3: { type: "string" },
        prop5: { type: "string" },
        prop4: { type: "string" },
      },
      required: ["prop1", "prop3", "prop5", "prop4"],
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
        prop5: { type: "string" },
        prop4: { type: "string" },
      },
      required: ["prop1", "prop2", "prop5", "prop4"],
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
        prop5: { type: "string" },
        prop4new: { type: "string" },
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
        storedNamespace = context.program.checker.getNamespaceString(entity);
      },
    });

    const runner = createTestWrapper(
      host,
      (code) =>
        `import "@cadl-lang/rest"; import "@cadl-lang/openapi";
          import "@cadl-lang/openapi3"; import "@cadl-lang/versioning";
          import "./test.js";
          using Cadl.Rest; using Cadl.Http; using OpenAPI; using Cadl.Versioning; ${code}`,
      { emitters: { "@cadl-lang/openapi3": {} } }
    );

    await runner.compile(`
    @versioned(Contoso.Library.Versions)
    namespace Contoso.Library {
      namespace Blah { }
      enum Versions { v1 };
    }
    @armNamespace
    @serviceTitle("Widgets 'r' Us")
    @versionedDependency(Contoso.Library.Versions.v1)
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

  // Test for https://github.com/microsoft/cadl/issues/812
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
      
      @serviceTitle("Service")
      @versionedDependency(Library.Versions.v1)
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
});
