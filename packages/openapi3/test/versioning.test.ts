import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { ApiTester, openApiForVersions } from "./test-host.js";
import { worksFor } from "./works-for.js";

worksFor(["3.0.0", "3.1.0"], ({ openApiFor, version: specVersion }) => {
  const TesterWithVersioning = ApiTester.importLibraries()
    .using("Http", "Rest", "Versioning")
    .emit("@typespec/openapi3", { "openapi-versions": [specVersion] });

  it("works with models", async () => {
    const { v1, v2, v3 } = await openApiForVersions(
      `
      @versioned(Versions)
      @service(#{title: "My Service"})
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
    ok(v1.components?.schemas);
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
    ok(v2.components?.schemas);
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
    ok(v3.components?.schemas);
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

  // Test for https://github.com/microsoft/typespec/issues/812
  it("doesn't throw errors when using UpdateableProperties", async () => {
    // if this test throws a duplicate name diagnostic, check that getEffectiveType
    // is returning the projected type.
    await TesterWithVersioning.compile(
      `
      @versioned(Library.Versions)
      namespace Library {
        enum Versions {
          v1,
          v2,
        }
      }
      
      @service(#{title: "Service"})
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
    `,
    );
  });

  describe("versioned resource", () => {
    it("reports diagnostic without crashing for mismatched versions", async () => {
      const diagnostics = await TesterWithVersioning.diagnose(
        `
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
      `,
      );
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
      });
    });

    it("succeeds for aligned versions", async () => {
      await TesterWithVersioning.compile(
        `
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
    `,
      );
    });
  });
});
