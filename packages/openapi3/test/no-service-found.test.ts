import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { it } from "vitest";
import { supportedVersions, worksFor } from "./works-for.js";

worksFor(supportedVersions, ({ diagnoseOpenApiFor }) => {
  it("does not emit warning if a non-service namespace has no routes", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
    namespace Test {
      model Foo {};
    }
    `,
    );
    expectDiagnosticEmpty(diagnostics);
  });

  it("emit a warning if a non-service namespace has routes", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
    namespace Test {
      model Foo {};

      @route("/foo")
      op get(): Foo;
    }
    `,
    );
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/http/no-service-found",
      },
    ]);
  });

  it("does not emit warning for library namespaces with routes but no service", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
    namespace TypeSpec.Library {
      @route("/lib")
      op libOp(): void;
    }

    namespace Azure.Core {
      @route("/azure")
      op azureOp(): void;
    }
    `,
    );
    // Library namespaces should not trigger the warning
    expectDiagnosticEmpty(diagnostics);
  });

  it("emit a warning for user namespace but not for library namespace when no service", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
    namespace MyApp {
      @route("/app")
      op appOp(): void;
    }

    namespace TypeSpec.Library {
      @route("/lib")
      op libOp(): void;
    }
    `,
    );
    // Should only warn about MyApp, not TypeSpec.Library
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/http/no-service-found",
        message:
          "No namespace with '@service' was found, but Namespace 'MyApp' contains routes. Did you mean to annotate this with '@service'?",
      },
    ]);
  });

  it("does not emit a warning if a service namespace has no routes", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
    @service
    namespace Test {
      model Foo {};
    }
    `,
    );
    expectDiagnosticEmpty(diagnostics);
  });

  it("does not emit a warning if a service namespace has routes", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
    @service
    namespace Test {
      model Foo {};

      @route("/foo")
      op get(): Foo;
    }

    namespace Library {
      op ping(): void;
    }
    `,
    );
    expectDiagnosticEmpty(diagnostics);
  });
});
