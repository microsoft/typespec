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
});
