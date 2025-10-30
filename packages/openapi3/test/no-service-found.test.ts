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
