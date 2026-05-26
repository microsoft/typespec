import { it } from "vitest";
import { SyntaxKind } from "../src/ast/index.js";
import { navigateProgram } from "../src/core/semantic-walker.js";
import { createRemoveUnusedSuppressionCodeFix } from "../src/core/suppression-tracking.js";
import { expectCodeFixOnAst } from "../src/testing/code-fix-testing.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../src/testing/index.js";
import { Tester } from "./tester.js";

async function run(typespec: string) {
  const { program } = await Tester.compile(typespec, {
    compilerOptions: { nostdlib: true },
  });

  navigateProgram(program, {
    model: (model) => {
      if (model.name === "") {
        program.reportDiagnostic({
          severity: "warning",
          code: "no-inline-model",
          message: "Inline models are not recommended",
          target: model,
        });
      }
    },
    modelProperty: (prop) => {
      if (prop.name === "id") {
        program.reportDiagnostic({
          severity: "error",
          code: "no-id-property",
          message: "Id properties on models are forbidden",
          target: prop,
        });
      }
    },
  });

  return program.diagnostics;
}

it("emit warning diagnostics when there is no suppression", async () => {
  const diagnostics = await run(`
      model Foo {
        inline: {
          name: 123;
        };
      }
    `);

  expectDiagnostics(diagnostics, { code: "no-inline-model" });
});

it("suppress warning diagnostic on item itself", async () => {
  const diagnostics = await run(`
      model Foo {
        #suppress "no-inline-model" "This is needed"
        inline: {
          name: 123;
        };
      }
    `);

  expectDiagnosticEmpty(diagnostics);
});

it("suppress warning diagnostic on parent node", async () => {
  const diagnostics = await run(`
      #suppress "no-inline-model"  "This is needed"
      model Foo {
        inline: {
          name: 123;
        };
      }
    `);
  expectDiagnosticEmpty(diagnostics);
});

it("error diagnostics cannot be suppressed and emit another error", async () => {
  const diagnostics = await run(`
      model Foo {
        #suppress "no-id-property" "This is needed"
        id: 123;
      }
    `);

  expectDiagnostics(diagnostics, [{ code: "suppress-error" }, { code: "no-id-property" }]);
});

it("does not report unused suppression in normal compile", async () => {
  const diagnostics = await Tester.diagnose(
    `
      #suppress "deprecated" "not needed anymore"
      model Foo {}
      `,
    {
      compilerOptions: { nostdlib: true },
    },
  );

  expectDiagnosticEmpty(diagnostics);
});

it("provides a code fix to remove an unused suppression", async () => {
  await expectCodeFixOnAst(
    `#┆suppress "deprecated" "not needed anymore"   
model Foo {}
`,
    (node) => {
      if (
        node.kind !== SyntaxKind.Identifier ||
        node.parent?.kind !== SyntaxKind.DirectiveExpression
      ) {
        throw new Error("Expected a directive expression node.");
      }
      return createRemoveUnusedSuppressionCodeFix(node.parent);
    },
  ).toChangeTo(`model Foo {}
`);
});

it("does not report unused suppression when diagnostic was suppressed", async () => {
  const diagnostics = await Tester.diagnose(
    `
      #deprecated "Old is deprecated"
      model Old {}

      model Foo {
        #suppress "deprecated" "intentional"
        prop: Old;
      }
      `,
    {
      compilerOptions: { nostdlib: true },
    },
  );

  expectDiagnosticEmpty(diagnostics);
});

it("does not report unused suppression for unavailable diagnostic source by default", async () => {
  const diagnostics = await Tester.diagnose(
    `
      #suppress "test-emitter/not-run" "only emitted by another tool"
      model Foo {}
      `,
    {
      compilerOptions: { nostdlib: true },
    },
  );

  expectDiagnosticEmpty(diagnostics);
});

it("does not report unused suppression for errors as replacement for suppress-error", async () => {
  const diagnostics = await Tester.diagnose(
    `
      model Foo {
        #suppress "invalid-ref" "errors cannot be suppressed"
        prop: Unknown;
      }
      `,
    {
      compilerOptions: { nostdlib: true },
    },
  );

  expectDiagnostics(diagnostics, [{ code: "suppress-error" }, { code: "invalid-ref" }]);
});
