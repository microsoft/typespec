import { setTypeSpecNamespace } from "@typespec/compiler";
import { expectDiagnosticEmpty, expectDiagnostics, mockFile } from "@typespec/compiler/testing";
import { describe, it } from "vitest";
import { Tester } from "./test-host.js";

/** Compile `code` inside a namespace, so it doesn't also trip the `missing-namespace` rule. */
async function diagnose(code: string) {
  return Tester.diagnose(`namespace MyLib;\n${code}`);
}

/**
 * Same as {@link diagnose}, but also provides JS implementations for the named decorators so they
 * don't trip the `missing-signature` rule.
 */
async function diagnoseDecorators(names: string[], code: string) {
  const implementations: Record<string, (...args: unknown[]) => null> = {};
  for (const name of names) {
    const fn = () => null;
    setTypeSpecNamespace("MyLib", fn);
    implementations[`$${name}`] = fn;
  }
  return Tester.files({ "./dec.js": mockFile.js(implementations) }).diagnose(
    `import "./dec.js";\nnamespace MyLib;\n${code}`,
  );
}

describe("missing-documentation", () => {
  it("emit diagnostics for an undocumented model", async () => {
    const diagnostics = await diagnose(`model Foo {}`);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/missing-documentation",
      message: "Missing documentation for model 'Foo'. Add a doc comment describing it.",
      severity: "warning",
    });
  });

  it("emit diagnostics for an undocumented model property", async () => {
    const diagnostics = await diagnose(`
      /** A model. */
      model Foo {
        bar: string;
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/missing-documentation",
      message:
        "Missing documentation for property 'bar' of 'Foo'. Add a doc comment describing it.",
    });
  });

  it("emit diagnostics for an undocumented enum member", async () => {
    const diagnostics = await diagnose(`
      /** An enum. */
      enum Foo {
        bar,
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/missing-documentation",
      message:
        "Missing documentation for enum member 'bar' of 'Foo'. Add a doc comment describing it.",
    });
  });

  it("emit diagnostics for an undocumented union variant", async () => {
    const diagnostics = await diagnose(`
      /** A union. */
      union Foo {
        bar: string,
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/missing-documentation",
      message: "Missing documentation for variant 'bar' of 'Foo'. Add a doc comment describing it.",
    });
  });

  it("emit diagnostics for an undocumented operation parameter", async () => {
    const diagnostics = await diagnose(`
      /** An operation. */
      op foo(bar: string): void;
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/missing-documentation",
      message:
        "Missing documentation for parameter 'bar' of 'foo'. Add a doc comment describing it.",
    });
  });

  it("emit diagnostics for an undocumented template parameter", async () => {
    const diagnostics = await diagnose(`
      /** A model. */
      model Foo<T> {
        /** A property. */
        prop: T;
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/missing-documentation",
      message:
        "Missing documentation for template parameter 'T' of 'Foo'. Add a doc comment describing it.",
    });
  });

  it("emit diagnostics for an undocumented decorator and its parameters", async () => {
    const diagnostics = await diagnoseDecorators(
      ["myDec"],
      `extern dec myDec(target: unknown, value: valueof string);`,
    );
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/library-linter/missing-documentation",
        message: "Missing documentation for decorator '@myDec'. Add a doc comment describing it.",
      },
      {
        code: "@typespec/library-linter/missing-documentation",
        message:
          "Missing documentation for parameter 'value' of '@myDec'. Add a doc comment describing it.",
      },
    ]);
  });

  it("treat an empty @doc as missing", async () => {
    const diagnostics = await diagnose(`
      @doc("")
      model Foo {}
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/missing-documentation",
      message: "Missing documentation for model 'Foo'. Add a doc comment describing it.",
    });
  });

  it("accept documentation provided with @doc", async () => {
    const diagnostics = await diagnose(`
      @doc("A model.")
      model Foo {
        @doc("A property.")
        bar: string;
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("accept documentation provided with a doc comment", async () => {
    const diagnostics = await diagnoseDecorators(
      ["myDec"],
      `
      /**
       * A decorator.
       * @param value A value.
       */
      extern dec myDec(target: unknown, value: valueof string);
    `,
    );
    expectDiagnosticEmpty(diagnostics);
  });

  it("ignore declarations in a Private namespace", async () => {
    const diagnostics = await diagnose(`
      namespace Private {
        model Foo {
          bar: string;
        }
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("ignore declarations marked internal", async () => {
    const diagnostics = await diagnose(`internal model Foo {}`);
    expectDiagnosticEmpty(diagnostics);
  });

  it("ignore types coming from the standard library", async () => {
    const diagnostics = await diagnose(`
      /** A model. */
      model Foo {
        /** A property. */
        bar: Record<string>;
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });
});

describe("extraneous-documentation", () => {
  it("emit diagnostics for a @param that does not exist", async () => {
    const diagnostics = await diagnose(`
      /**
       * An operation.
       * @param notAParam Does not exist.
       */
      op foo(): void;
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/extraneous-documentation",
      message: "Documented parameter 'notAParam' does not exist on operation 'foo'.",
      severity: "warning",
    });
  });

  it("emit diagnostics for a decorator @param that does not exist", async () => {
    const diagnostics = await diagnoseDecorators(
      ["noParams"],
      `
      /**
       * A decorator.
       * @param blah Does not exist.
       */
      extern dec noParams(target: unknown);
    `,
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/extraneous-documentation",
      message: "Documented parameter 'blah' does not exist on decorator '@noParams'.",
    });
  });

  it("emit diagnostics for a @prop that does not exist", async () => {
    const diagnostics = await diagnose(`
      /**
       * A model.
       * @prop notAProp Does not exist.
       */
      model Foo {}
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/extraneous-documentation",
      message: "Documented property 'notAProp' does not exist on model 'Foo'.",
    });
  });

  it("emit diagnostics for a @template that does not exist", async () => {
    const diagnostics = await diagnose(`
      /**
       * A model.
       * @template T Does not exist.
       */
      model Foo {}
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/extraneous-documentation",
      message: "Documented template parameter 'T' does not exist on model 'Foo'.",
    });
  });

  it("emit diagnostics for a @template naming a parameter of an enclosing interface", async () => {
    const diagnostics = await diagnose(`
      /**
       * An interface.
       * @template T A template parameter.
       */
      interface Foo<T> {
        /**
         * An operation.
         * @template T Not a parameter of this operation.
         */
        bar(): void;
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/extraneous-documentation",
      message: "Documented template parameter 'T' does not exist on operation 'bar'.",
    });
  });

  it("emit diagnostics for @returns on a model", async () => {
    const diagnostics = await diagnose(`
      /**
       * A model.
       * @returns Nothing.
       */
      model Foo {}
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/extraneous-documentation",
      message: "Doc tag '@returns' is not applicable to model 'Foo'.",
    });
  });

  it("emit diagnostics for an unknown tag", async () => {
    const diagnostics = await diagnose(`
      /**
       * A model marked with @deprecated for some reason.
       */
      model Foo {}
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/extraneous-documentation",
      message:
        "Unknown doc tag '@deprecated'. Use backticks around code if this was not meant to be a tag.",
    });
  });

  it("accept @returns and @errors on an operation", async () => {
    const diagnostics = await diagnose(`
      /**
       * An operation.
       * @returns A string.
       * @errors An error.
       */
      op foo(): string;
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("accept @example and other known freeform tags", async () => {
    const diagnostics = await diagnose(`
      /**
       * A model.
       * @example
       * \`\`\`tsp
       * model Bar {}
       * \`\`\`
       * @see Something else.
       */
      model Foo {}
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("emit diagnostics for an unknown tag on a documented model property", async () => {
    const diagnostics = await diagnose(`
      /** A model. */
      model Foo {
        /**
         * A property.
         * @deprecated Use something else.
         */
        bar: string;
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/extraneous-documentation",
      message:
        "Unknown doc tag '@deprecated'. Use backticks around code if this was not meant to be a tag.",
      severity: "warning",
    });
  });

  it("emit diagnostics for @returns on a model property", async () => {
    const diagnostics = await diagnose(`
      /** A model. */
      model Foo {
        /**
         * A property.
         * @returns Nothing.
         */
        bar: string;
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/extraneous-documentation",
      message: "Doc tag '@returns' is not applicable to property 'bar'.",
      severity: "warning",
    });
  });

  it("emit diagnostics for an unknown tag on an enum member", async () => {
    const diagnostics = await diagnose(`
      /** An enum. */
      enum Foo {
        /**
         * A member.
         * @bogus Nope.
         */
        bar,
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/extraneous-documentation",
      message:
        "Unknown doc tag '@bogus'. Use backticks around code if this was not meant to be a tag.",
      severity: "warning",
    });
  });

  it("accept tags that resolve correctly", async () => {
    const diagnostics = await diagnose(`
      /**
       * A model.
       * @template T A template parameter.
       * @prop bar A property.
       */
      model Foo<T> {
        bar: T;
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });
});
