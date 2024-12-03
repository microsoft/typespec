import {
  createTestWrapper,
  expectDiagnosticEmpty,
  expectDiagnostics,
  type BasicTestRunner,
  type TestHost,
} from "@typespec/compiler/testing";
import { ok } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createVersioningTestHost, createVersioningTestRunner } from "./test-host.js";

describe("versioning: incompatible use of decorators", () => {
  let runner: BasicTestRunner;
  let host: TestHost;
  const imports: string[] = [];

  beforeEach(async () => {
    host = await createVersioningTestHost();
    runner = createTestWrapper(host, {
      wrapper: (code) => `
      import "@typespec/versioning";
      ${imports.map((i) => `import "${i}";`).join("\n")}
      using TypeSpec.Versioning;
      ${code}`,
    });
  });

  it("emit diagnostic when @service({version: 'X'}) is used with @versioned", async () => {
    const diagnostics = await runner.diagnose(`
    @versioned(Versions)
    @service({
      title: "Widget Service",
      #suppress "deprecated" "For test"
      version: "v3"
    })
    namespace DemoService;

    enum Versions {
      v1,
      v2,
    }
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/versioning/no-service-fixed-version",
      severity: "error",
    });
  });

  it("emit diagnostic when version enum has duplicate values", async () => {
    const diagnostics = await runner.diagnose(`
    @versioned(Versions)
    namespace DemoService;

    enum Versions {
      v1: "v1",
      v2: "v2",
      latest: "v2",
    }
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/versioning/version-duplicate",
      message:
        "Multiple versions from 'Versions' resolve to the same value. Version enums must resolve to unique values.",
      severity: "error",
    });
  });

  it("emit diagnostic when version enum has duplicate implicit values", async () => {
    const diagnostics = await runner.diagnose(`
    @versioned(Versions)
    namespace DemoService;

    enum Versions {
      v1,
      v2: "v1",
    }
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/versioning/version-duplicate",
      message:
        "Multiple versions from 'Versions' resolve to the same value. Version enums must resolve to unique values.",
      severity: "error",
    });
  });
});

describe("versioning: validate incompatible references", () => {
  let runner: BasicTestRunner;
  let host: TestHost;
  const imports: string[] = [];

  beforeEach(async () => {
    host = await createVersioningTestHost();
    runner = createTestWrapper(host, {
      wrapper: (code) => `
      import "@typespec/versioning";
      ${imports.map((i) => `import "${i}";`).join("\n")}
      using TypeSpec.Versioning;

      @versioned(Versions)
      namespace TestService {
        enum Versions {v1, v2, v3, v4}
        ${code}
      }`,
    });
  });

  describe("operation", () => {
    // TODO See: https://github.com/microsoft/typespec/issues/2695
    it.skip("emit diagnostic when unversioned op has a versioned model as a parameter", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        model Foo {}

        op test(param: Foo): void;
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' is referencing versioned type 'TestService.Foo' but is not versioned itself.",
      });
    });

    it("allow unversioned op to have a versioned parameter", async () => {
      ok(
        await runner.compile(`
        model Foo {}

        op test(param: string, @added(Versions.v2) newParam: Foo): void;
      `),
      );
    });

    it("emit diagnostic when versioned op has a newer versioned spread parameter", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        model MyOptions {
          prop: string;
        }
        
        @added(Versions.v1)
        op foo(...MyOptions,): void;
        `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.foo' was added in version 'v1' but referencing type 'TestService.MyOptions' added in version 'v2'.",
      });
    });

    // TODO See: https://github.com/microsoft/typespec/issues/2695
    it.skip("emit diagnostic when unversioned op based on a template has a versioned model as a parameter", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        model Foo {}

        op Template<T>(param: T): void;

        op test is Template<Foo>;
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' is referencing versioned type 'TestService.Foo' but is not versioned itself.",
      });
    });

    // TODO See: https://github.com/microsoft/typespec/issues/2695
    it.skip("emit diagnostic when type changed to types that don't exist", async () => {
      const diagnostics = await runner.diagnose(`
      @added(Versions.v3)  
      model Foo {}

      @removed(Versions.v1)
      model Doo {}

      @added(Versions.v3)
      op test(@typeChangedFrom(Versions.v2, Doo) param: Foo): void;
      `);
      expectDiagnostics(diagnostics, [
        {
          code: "@typespec/versioning/incompatible-versioned-reference",
          severity: "error",
          message:
            "'TestService.(anonymous model).param' is referencing type 'TestService.Doo' which does not exist in version 'v1'.",
        },
        {
          code: "@typespec/versioning/incompatible-versioned-reference",
          severity: "error",
          message:
            "'TestService.(anonymous model).param' is referencing type 'TestService.Foo' which does not exist in version 'v2'.",
        },
      ]);
    });
  });

  describe("operation return type", () => {
    it("emit diagnostic when unversioned op is returning versioned model", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        model Foo {}

        op test(): Foo;
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' is referencing versioned type 'TestService.Foo' but is not versioned itself.",
      });
    });

    it("emit diagnostic when op was added before templated return type", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v3)
        model Gadget {};

        model List<T> {
          value: T[];
          nextLink?: url;
        }

        @added(Versions.v2)
        op list(): List<Gadget>;
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.list' was added in version 'v2' but referencing type 'TestService.Gadget' added in version 'v3'.",
      });
    });

    it("emit diagnostic when op was added before return type", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v3)
        model Foo {}
        
        @added(Versions.v2)
        op test(): Foo;
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' was added in version 'v2' but referencing type 'TestService.Foo' added in version 'v3'.",
      });
    });

    it("emit diagnostic when op was removed after return type", async () => {
      const diagnostics = await runner.diagnose(`
        @removed(Versions.v2)
        model Foo {}
        
        @removed(Versions.v3)
        op test(): Foo;
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' was removed in version 'v3' but referencing type 'TestService.Foo' removed in version 'v2'.",
      });
    });

    it("succeed if versions are compatible in model", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        @removed(Versions.v4)
        model Foo {}
        
        @added(Versions.v2)
        @removed(Versions.v3)
        op test(): Foo;
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("succeed if versions are compatible in interface", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        @removed(Versions.v4)
        model Foo {}
        
        @added(Versions.v2)
        @removed(Versions.v3)
        interface TestI {
          op test(): Foo;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("model property type", () => {
    it("emit diagnostic when unversioned model property type is a versioned model", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        model Foo {}

        model Bar {
          foo: Foo;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar.foo' is referencing versioned type 'TestService.Foo' but is not versioned itself.",
      });
    });

    it("emit diagnostic when model property was added before return type", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v3)
        model Foo {}
        
        model Bar {
          @added(Versions.v2)
          foo: Foo;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar.foo' was added in version 'v2' but referencing type 'TestService.Foo' added in version 'v3'.",
      });
    });

    it("emit diagnostic when model property was removed after return type", async () => {
      const diagnostics = await runner.diagnose(`
        @removed(Versions.v2)
        model Foo {}
        
        model Bar {
          @removed(Versions.v3)
          foo: Foo;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar.foo' was removed in version 'v3' but referencing type 'TestService.Foo' removed in version 'v2'.",
      });
    });

    it("emit diagnostic when using @typeChangedFrom with a type parameter that does not yet exist", async () => {
      const diagnostics = await runner.diagnose(`        
        @test
        model Original {}

        @test
        @added(Versions.v3)
        model Updated {}

        @test
        model Test {
          @typeChangedFrom(Versions.v2, Original)
          prop: Updated;
        }
        `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        severity: "error",
        message:
          "'TestService.Test.prop' is referencing type 'TestService.Updated' which does not exist in version 'v2'.",
      });
    });

    it("emit diagnostic when using @typeChangedFrom with a base parameter that does not yet exist", async () => {
      const diagnostics = await runner.diagnose(`        
        @test
        @added(Versions.v2)
        model Original {}

        @test
        @added(Versions.v3)
        model Updated {}

        @test
        model Test {
          @typeChangedFrom(Versions.v3, Original)
          prop: Updated;
        }
        `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        severity: "error",
        message:
          "'TestService.Test.prop' is referencing type 'TestService.Original' which does not exist in version 'v1'.",
      });
    });

    it("succeed if version are compatible in model", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        @removed(Versions.v4)
        model Foo {}
        
       
        model Bar {
          @added(Versions.v2)
          @removed(Versions.v3)
          foo: Foo;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("succeed if version are compatible in parent model", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        @removed(Versions.v4)
        model Foo {}
       
        @added(Versions.v2)
        @removed(Versions.v3)
        model Bar {
          foo: Foo;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("model property", () => {
    it("succeed when unversioned model has versioned property", async () => {
      const diagnostics = await runner.diagnose(`
        model Bar {
          @added(Versions.v2)
          foo: string;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("succeed when spreading a model that might have add properties added in previous versions", async () => {
      const diagnostics = await runner.diagnose(`
        model Base {
          @added(Versions.v1) name: string;
        }

        @added(Versions.v2)
        model Child {
          ...Base;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("succeed when spreading a model that might have add properties removed after the model", async () => {
      const diagnostics = await runner.diagnose(`
        model Base {
          @removed(Versions.v3) name: string;
        }

        @removed(Versions.v2)
        model Child {
          ...Base;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("emit diagnostic when model property was added before model itself", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v3)
        model Bar {
          @added(Versions.v2)
          foo: string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar' was added in version 'v3' but contains type 'TestService.Bar.foo' added in version 'v2'.",
      });
    });

    it("emit diagnostic when model property was removed after model itself", async () => {
      const diagnostics = await runner.diagnose(`
        @removed(Versions.v2)
        model Bar {
          @removed(Versions.v3)
          foo: string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar' was removed in version 'v2' but contains type 'TestService.Bar.foo' removed in version 'v3'.",
      });
    });

    it("succeed if version are compatible", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        @removed(Versions.v4)
        model Bar {
          @added(Versions.v2)
          @removed(Versions.v3)
          foo: string;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("succeed if it was added in the first defined version", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v1)
        model Foo {}

        model Bar {
          foo: Foo;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("emit diagnostic when property marked @madeOptional but is required", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo {
          @madeOptional(Versions.v2)
          name: string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/made-optional-not-optional",
        message: "Property 'name' marked with @madeOptional but is required. Should be 'name?'",
      });
    });

    it("emit diagnostic when property marked @madeRequired but is optional", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo {
          @madeRequired(Versions.v2)
          name?: string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/made-required-optional",
        message: "Property 'name?' marked with @madeRequired but is optional. Should be 'name'",
      });
    });
  });

  describe("operations", () => {
    it("ok if operation is added before model used in params", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        model Foo {}

        @added(Versions.v2)
        op test(param: Foo): void;
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("emit diagnostic when unversioned parameter type is a versioned model", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        model Foo {}

        op test(param: Foo): void;
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
      });
    });
  });

  describe("complex type references", () => {
    it("emit diagnostic when using versioned model as template argument in non versioned property", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        model Versioned {}

        model Foo<T> {t: T}

        model Bar {
          foo: Foo<Versioned>;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar.foo' is referencing versioned type 'TestService.Versioned' but is not versioned itself.",
      });
    });
    it("emit diagnostic when using versioned union variant in nin versioned operation return type", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        model Versioned {}
        op test(): Versioned | string;
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' is referencing versioned type 'TestService.Versioned' but is not versioned itself.",
      });
    });

    it("emit diagnostic when using versioned array element in nin versioned operation return type", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        model Versioned {}
        op test(): Versioned[];
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' is referencing versioned type 'TestService.Versioned' but is not versioned itself.",
      });
    });

    it("emit diagnostic when using versioned union variant of array in non versioned source", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        model Versioned {}
        op test(): Versioned[] | string;
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
      });
    });

    it("emit diagnostic when using versioned tuple element in nin versioned operation return type", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        model Versioned {}
        op test(): [Versioned, string]; 
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' is referencing versioned type 'TestService.Versioned' but is not versioned itself.",
      });
    });

    describe("interface operations", () => {
      it("succeed when unversioned interface has versioned operation", async () => {
        const diagnostics = await runner.diagnose(`
        interface Bar {
          @added(Versions.v2)
          foo(): string;
        }
      `);
        expectDiagnosticEmpty(diagnostics);
      });
    });

    it("emit diagnostic when operation was added before interface itself", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v3)
        interface Bar {
          @added(Versions.v2)
          foo(): string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar' was added in version 'v3' but contains type 'TestService.Bar.foo' added in version 'v2'.",
      });
    });

    it("emit diagnostic when op was removed after return type", async () => {
      const diagnostics = await runner.diagnose(`
        @removed(Versions.v2)
        interface Bar {
          @removed(Versions.v3)
          foo(): string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar' was removed in version 'v2' but contains type 'TestService.Bar.foo' removed in version 'v3'.",
      });
    });

    it("succeed if version are compatible", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v2)
        @removed(Versions.v4)
        interface Bar {
          @added(Versions.v2)
          @removed(Versions.v3)
          foo(): string;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("interface templates", () => {
    beforeEach(() => {
      imports.push("./lib.tsp");
      host.addTypeSpecFile(
        "lib.tsp",
        `
        namespace Lib;
        interface Ops<T extends {}> {
          get(): T[];
        }
        `,
      );
    });
    it("emit diagnostic when extending interface with versioned type argument from unversioned interface", async () => {
      const diagnostics = await runner.diagnose(
        `
        @added(Versions.v2)
        model Widget {
          id: string;
        }
        interface WidgetService extends Lib.Ops<Widget> {}
        `,
      );
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.WidgetService' is referencing versioned type 'TestService.Widget' but is not versioned itself.",
      });
    });

    it("emit diagnostic when extending interface with versioned type argument added after interface", async () => {
      const diagnostics = await runner.diagnose(
        `
        @added(Versions.v2)
        model Widget {
          id: string;
        }
      
        @added(Versions.v1)
        interface WidgetService extends Lib.Ops<Widget> {}
      `,
      );
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.WidgetService' was added in version 'v1' but referencing type 'TestService.Widget' added in version 'v2'.",
      });
    });

    it("succeed when extending interface with versioned type argument added before interface", async () => {
      const diagnostics = await runner.diagnose(
        `
        @added(Versions.v2)
        model Widget {
          id: string;
        }
      
        @added(Versions.v2)
        interface WidgetService extends Lib.Ops<Widget> {}
      `,
      );
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("with @useDependency", () => {
    let runner: BasicTestRunner;

    beforeEach(async () => {
      runner = await createVersioningTestRunner();
    });

    it("emit diagnostic when referencing incompatible version via version dependency", async () => {
      // Here Foo was added in v2 which makes it only available in 1 & 2.
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace VersionedLib {
          enum Versions {l1, l2}
          @added(Versions.l2)
          model Foo {}
        }

        @versioned(Versions)
        namespace TestService {
          enum Versions {
            @useDependency(VersionedLib.Versions.l1)
            v1,
            @useDependency(VersionedLib.Versions.l1)
            v2,
            @useDependency(VersionedLib.Versions.l2)
            v3,
            @useDependency(VersionedLib.Versions.l2)
            v4
          }

          @added(Versions.v1)
          op test(): VersionedLib.Foo;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' was added in version 'v1' but referencing type 'VersionedLib.Foo' added in version 'v3'.",
      });
    });

    it("doesn't emit diagnostic if all version use the same one", async () => {
      // Here Foo was added in v2 which makes it only available in 1 & 2.
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace VersionedLib {
          enum Versions {l1, l2}
          @added(Versions.l2)
          model Foo {}
        }

        @versioned(Versions)
        namespace TestService {
          enum Versions {
            @useDependency(VersionedLib.Versions.l2)
            v1,
            @useDependency(VersionedLib.Versions.l2)
            v2,
            @useDependency(VersionedLib.Versions.l2)
            v3,
            @useDependency(VersionedLib.Versions.l2)
            v4
          }
          op test(): VersionedLib.Foo;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("emit diagnostic when using item that was added in a later version of library", async () => {
      // Here Foo was added in v2 but version 1 was selected.
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace VersionedLib {
          enum Versions {l1, l2}
          @added(Versions.l2)
          model Foo {}
        }

        @useDependency(VersionedLib.Versions.l1)
        namespace TestService {
          op test(): VersionedLib.Foo;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' is referencing type 'VersionedLib.Foo' added in version 'l2' but version used is l1.",
      });
    });

    it("emit diagnostic when using item that was removed in an earlier version of library", async () => {
      // Here Foo was removed in v2 but version 2 was selected.
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace VersionedLib {
          enum Versions {l1, l2}
          @removed(Versions.l2)
          model Foo {}
        }

        @useDependency(VersionedLib.Versions.l2)
        namespace TestService {
          op test(): VersionedLib.Foo;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' is referencing type 'VersionedLib.Foo' removed in version 'l2' but version used is l2.",
      });
    });
  });
});
