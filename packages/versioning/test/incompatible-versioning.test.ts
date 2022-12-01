import {
  BasicTestRunner,
  createTestWrapper,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "@cadl-lang/compiler/testing";
import { createVersioningTestHost, createVersioningTestRunner } from "./test-host.js";

describe("versioning: validate incompatible references", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    const host = await createVersioningTestHost();
    runner = createTestWrapper(host, {
      wrapper: (code) => `
      import "@cadl-lang/versioning";

      using Cadl.Versioning;
      
      @versioned(Versions)
      namespace TestService {
        enum Versions {v1, v2, v3, v4}
        ${code}
      }`,
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
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' is referencing versioned type 'TestService.Foo' but is not versioned itself.",
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
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' was added on version 'v2' but referencing type 'TestService.Foo' added in version 'v3'.",
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
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' was removed on version 'v3' but referencing type 'TestService.Foo' removed in version 'v2'.",
      });
    });

    it("succeed if version are compatible", async () => {
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

    it("succeed if version are compatible in interface", async () => {
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
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
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
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar.foo' was added on version 'v2' but referencing type 'TestService.Foo' added in version 'v3'.",
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
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar.foo' was removed on version 'v3' but referencing type 'TestService.Foo' removed in version 'v2'.",
      });
    });

    it("succeed if version are compatible", async () => {
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

    it("emit diagnostic when model property was added before model itself", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v3)
        model Bar {
          @added(Versions.v2)
          foo: string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar' was added on version 'v3' but contains type 'TestService.Bar.foo' added in version 'v2'.",
      });
    });

    it("emit diagnostic when op was removed after return type", async () => {
      const diagnostics = await runner.diagnose(`
        @removed(Versions.v2)
        model Bar {
          @removed(Versions.v3)
          foo: string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar' was removed on version 'v2' but contains type 'TestService.Bar.foo' removed in version 'v3'.",
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
  });

  describe("model template arguments", () => {
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
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar.foo' is referencing versioned type 'TestService.Versioned' but is not versioned itself.",
      });
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

    it("emit diagnostic when model property was added before model itself", async () => {
      const diagnostics = await runner.diagnose(`
        @added(Versions.v3)
        interface Bar {
          @added(Versions.v2)
          foo(): string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar' was added on version 'v3' but contains type 'TestService.foo' added in version 'v2'.",
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
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar' was removed on version 'v2' but contains type 'TestService.foo' removed in version 'v3'.",
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

  describe("with versioned dependencies", () => {
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
        @versionedDependency([
          [Versions.v1, VersionedLib.Versions.l1],
          [Versions.v2, VersionedLib.Versions.l1],
          [Versions.v3, VersionedLib.Versions.l2],
          [Versions.v4, VersionedLib.Versions.l2]
        ])
        namespace TestService {
          enum Versions {v1, v2, v3, v4}

          @added(Versions.v1)
          op test(): VersionedLib.Foo;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' was added on version 'v1' but referencing type 'VersionedLib.Foo' added in version 'v3'.",
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
         @versionedDependency([
          [Versions.v1, VersionedLib.Versions.l2],
          [Versions.v2, VersionedLib.Versions.l2],
          [Versions.v3, VersionedLib.Versions.l2],
          [Versions.v4, VersionedLib.Versions.l2]
        ])
        namespace TestService {
          enum Versions {v1, v2, v3, v4}
          op test(): VersionedLib.Foo;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("emit diagnostic when using item not available in selected version of library", async () => {
      // Here Foo was added in v2 but version 1 was selected.
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace VersionedLib {
          enum Versions {l1, l2}
          @added(Versions.l2)
          model Foo {}
        }

        @versionedDependency(VersionedLib.Versions.l1)
        namespace TestService {
          op test(): VersionedLib.Foo;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' is referencing type 'VersionedLib.Foo' added in version 'l2' but version used is l1.",
      });
    });
  });
});
