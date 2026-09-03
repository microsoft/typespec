import { describe, it } from "vitest";
import type { CompilerOptions } from "../../src/core/options.js";
import {
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../src/testing/index.js";

/** Root project config enabling the given features for the consumer's own files. */
function projectOptions(features: string[]): CompilerOptions {
  return {
    configFile: {
      projectRoot: ".",
      kind: "project",
      features,
      diagnostics: [],
      outputDir: "tsp-output",
    },
  };
}

const ALL_FEATURES = ["auto-decorators", "scoped-decorators"];

async function diagnoseCode(code: string, features: string[] = ALL_FEATURES) {
  const host = await createTestHost();
  host.addTypeSpecFile("main.tsp", code);
  return await host.diagnose("main.tsp", projectOptions(features));
}

describe("when clause is restricted to auto decorators", () => {
  it("allows a when clause on an auto decorator", async () => {
    const diagnostics = await diagnoseCode(`
      auto dec myName(target: unknown, value: valueof string);
      @myName("Cs") when emitter("csharp")
      model Foo {}
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("rejects a when clause on an extern decorator", async () => {
    const diagnostics = await diagnoseCode(`
      @doc("d") when emitter("csharp")
      model Foo {}
    `);
    expectDiagnostics(diagnostics, {
      code: "when-clause-not-allowed",
    });
  });

  it("rejects a when clause on an augment decorator", async () => {
    // Augment decorators are deliberately not supported in phase 1.
    const diagnostics = await diagnoseCode(`
      auto dec myName(target: unknown, value: valueof string);
      model Foo {}
      @@myName(Foo, "Cs") when emitter("csharp");
    `);
    expectDiagnostics(diagnostics, {
      code: "when-clause-not-allowed",
    });
  });

  it("still validates decorator arguments when a when clause is present", async () => {
    // Validation is unconditional; only storage is conditioned.
    const diagnostics = await diagnoseCode(`
      auto dec myName(target: unknown, value: valueof string);
      @myName(123) when emitter("csharp")
      model Foo {}
    `);
    expectDiagnostics(diagnostics, { code: "invalid-argument" });
  });

  it("still validates decorator arity when a when clause is present", async () => {
    const diagnostics = await diagnoseCode(`
      auto dec myName(target: unknown, value: valueof string);
      @myName("a", "b") when emitter("csharp")
      model Foo {}
    `);
    expectDiagnostics(diagnostics, { code: "invalid-argument-count" });
  });

  it("requires the scoped-decorators feature", async () => {
    const diagnostics = await diagnoseCode(
      `
      auto dec myName(target: unknown, value: valueof string);
      @myName("Cs") when emitter("csharp")
      model Foo {}
    `,
      ["auto-decorators"],
    );
    expectDiagnostics(diagnostics, { code: "scoped-decorator-disabled" });
  });

  it("does not report anything for an unconditioned auto decorator", async () => {
    const diagnostics = await diagnoseCode(`
      auto dec myName(target: unknown, value: valueof string);
      @myName("Bar")
      model Foo {}
    `);
    expectDiagnosticEmpty(diagnostics);
  });
});

describe("when condition resolution", () => {
  it("rejects an unknown filter", async () => {
    const diagnostics = await diagnoseCode(`
      auto dec myName(target: unknown, value: valueof string);
      @myName("Cs") when notAFilter("x")
      model Foo {}
    `);
    expectDiagnostics(diagnostics, { code: "unknown-when-filter" });
  });

  it("rejects a filter with the wrong argument count", async () => {
    const diagnostics = await diagnoseCode(`
      auto dec myName(target: unknown, value: valueof string);
      @myName("Cs") when emitter()
      model Foo {}
    `);
    expectDiagnostics(diagnostics, { code: "invalid-when-condition" });
  });

  it("rejects a non-string filter argument", async () => {
    const diagnostics = await diagnoseCode(`
      auto dec myName(target: unknown, value: valueof string);
      @myName("Cs") when emitter(123)
      model Foo {}
    `);
    expectDiagnostics(diagnostics, { code: "invalid-when-condition" });
  });

  it("accepts every built-in filter", async () => {
    const diagnostics = await diagnoseCode(`
      auto dec myName(target: unknown, value: valueof string);
      @myName("A") when emitter("@typespec/http-client-csharp")
      @myName("B") when language("csharp")
      @myName("C") when target("client")
      model Foo {}
    `);
    expectDiagnosticEmpty(diagnostics);
  });
});
