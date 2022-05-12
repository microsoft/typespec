import {
  BasicTestRunner,
  createTestWrapper,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "@cadl-lang/compiler/testing";
import { createVersioningTestHost } from "./test-host.js";

describe.only("versioning: validate incompatible references", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    const host = await createVersioningTestHost();
    runner = createTestWrapper(
      host,
      (code) => `
      import "@cadl-lang/versioning";

      @versioned("1" | "2" | "3" | "4")
      namespace TestService {
        ${code}
      }`
    );
  });

  describe("operation return type", () => {
    it("emit diagnostic when unversioned op is returning versioned model", async () => {
      const diagnostics = await runner.diagnose(`
        @added("2")
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
        @added("3")
        model Foo {}
        
        @added("2")
        op test(): Foo;
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' was added on version '2' but referencing type 'TestService.Foo' added in version '3'.",
      });
    });

    it("emit diagnostic when op was removed after return type", async () => {
      const diagnostics = await runner.diagnose(`
        @removed("2")
        model Foo {}
        
        @removed("3")
        op test(): Foo;
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' was removed on version '3' but referencing type 'TestService.Foo' removed in version '3'.",
      });
    });

    it("succeed if version are compatible", async () => {
      const diagnostics = await runner.diagnose(`
        @added("2")
        @removed("4")
        model Foo {}
        
        @added("2")
        @removed("3")
        op test(): Foo;
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("succeed if version are compatible in interface", async () => {
      const diagnostics = await runner.diagnose(`
        @added("2")
        @removed("4")
        model Foo {}
        
        @added("2")
        @removed("3")
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
        @added("2")
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
        @added("3")
        model Foo {}
        
        model Bar {
          @added("2")
          foo: Foo;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar.foo' was added on version '2' but referencing type 'TestService.Foo' added in version '3'.",
      });
    });

    it("emit diagnostic when nodel property was removed after return type", async () => {
      const diagnostics = await runner.diagnose(`
        @removed("2")
        model Foo {}
        
        model Bar {
          @removed("3")
          foo: Foo;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar.foo' was removed on version '3' but referencing type 'TestService.Foo' removed in version '3'.",
      });
    });

    it("succeed if version are compatible", async () => {
      const diagnostics = await runner.diagnose(`
        @added("2")
        @removed("4")
        model Foo {}
        
       
        model Bar {
          @added("2")
          @removed("3")
          foo: Foo;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("succeed if version are compatible in parent model", async () => {
      const diagnostics = await runner.diagnose(`
        @added("2")
        @removed("4")
        model Foo {}
       
        @added("2")
        @removed("3")
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
          @added("2")
          foo: string;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("emit diagnostic when model property was added before model itself", async () => {
      const diagnostics = await runner.diagnose(`
        @added("3")
        model Bar {
          @added("2")
          foo: string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar' was added on version '3' but contains type 'TestService.Bar.foo' added in version '2'.",
      });
    });

    it("emit diagnostic when op was removed after return type", async () => {
      const diagnostics = await runner.diagnose(`
        @removed("2")
        model Bar {
          @removed("3")
          foo: string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar' was removed on version '2' but contains type 'TestService.Bar.foo' removed in version '2'.",
      });
    });

    it("succeed if version are compatible", async () => {
      const diagnostics = await runner.diagnose(`
        @added("2")
        @removed("4")
        model Bar {
          @added("2")
          @removed("3")
          foo: string;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("interface operations", () => {
    it("succeed when unversioned interface has versioned operation", async () => {
      const diagnostics = await runner.diagnose(`
        interface Bar {
          @added("2")
          foo(): string;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("emit diagnostic when model property was added before model itself", async () => {
      const diagnostics = await runner.diagnose(`
        @added("3")
        interface Bar {
          @added("2")
          foo(): string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar' was added on version '3' but contains type 'TestService.foo' added in version '2'.",
      });
    });

    it("emit diagnostic when op was removed after return type", async () => {
      const diagnostics = await runner.diagnose(`
        @removed("2")
        interface Bar {
          @removed("3")
          foo(): string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.Bar' was removed on version '2' but contains type 'TestService.foo' removed in version '2'.",
      });
    });

    it("succeed if version are compatible", async () => {
      const diagnostics = await runner.diagnose(`
        @added("2")
        @removed("4")
        interface Bar {
          @added("2")
          @removed("3")
          foo(): string;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("with versioned dependencies", () => {
    let runner: BasicTestRunner;

    beforeEach(async () => {
      const host = await createVersioningTestHost();
      runner = createTestWrapper(host, (code) => code);
    });

    it("emit diagnostic when referencing incompatible version via version dependency", async () => {
      // Here Foo was added in v2 which makes it only available in 1 & 2.
      const diagnostics = await runner.diagnose(`
        import "@cadl-lang/versioning";

        @versioned("l1" | "l2")
        namespace VersionedLib {
          @added("l2")
          model Foo {}
        }

        @versioned("1" | "2" | "3" | "4")
        @versionedDependency(VersionedLib, {
          "1": "l1",
          "2": "l1",
          "3": "l2",
          "4": "l2",
        })
        namespace TestService {
          @added("1")
          op test(): VersionedLib.Foo;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/incompatible-versioned-reference",
        message:
          "'TestService.test' was added on version '1' but referencing type 'VersionedLib.Foo' added in version '3'.",
      });
    });

    it("emit diagnostic when referencing incompatible version via version dependency", async () => {
      // Here Foo was added in v2 which makes it only available in 1 & 2.
      const diagnostics = await runner.diagnose(`
        import "@cadl-lang/versioning";

        @versioned("l1" | "l2")
        namespace VersionedLib {
          @added("l2")
          model Foo {}
        }

        @versionedDependency(VersionedLib, "l1")
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
