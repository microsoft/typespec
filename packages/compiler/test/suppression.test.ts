import { deepStrictEqual, strictEqual } from "assert";
import { it } from "vitest";
import { collectSuppressions, parse, SyntaxKind } from "../src/ast/index.js";
import { navigateProgram } from "../src/core/semantic-walker.js";
import type { SourceResolution } from "../src/core/source-loader.js";
import {
  createRemoveUnusedSuppressionCodeFix,
  createSuppressionTracker,
} from "../src/core/suppression-tracking.js";
import { createSourceFile } from "../src/index.js";
import { expectCodeFixOnAst } from "../src/testing/code-fix-testing.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../src/testing/index.js";
import { Tester } from "./tester.js";

it("tracks the collected directive identities while filtering non-project sources", () => {
  const text = `namespace Outer {
    #suppress "deprecated" "first"
    #suppress "deprecated" "second"
    namespace A.B {}
  }`;
  const project = parse(createSourceFile(text, "main.tsp"));
  const dependency = parse(createSourceFile(text, "library.tsp"));
  const resolution: SourceResolution = {
    sourceFiles: new Map([
      [project.file.path, project],
      [dependency.file.path, dependency],
    ]),
    jsSourceFiles: new Map(),
    locationContexts: new WeakMap(),
    loadedLibraries: new Map(),
    externals: [],
    diagnostics: [],
  };
  resolution.locationContexts.set(project.file, { type: "project" });
  resolution.locationContexts.set(dependency.file, { type: "compiler" });
  const tracker = createSuppressionTracker(resolution);
  const collected = collectSuppressions(project);
  strictEqual(collectSuppressions(dependency).length, 2);
  deepStrictEqual(
    tracker.getUnusedSuppressions().map(({ directive }) => directive.node),
    collected.map(({ directive }) => directive.node),
  );
  tracker.markUsed(collected[0].directive.node);
  deepStrictEqual(
    tracker.getUnusedSuppressions().map(({ directive }) => directive.node),
    [collected[1].directive.node],
  );
});

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

it("warns on duplicate suppressions with a message", async () => {
  const [, diagnostics] = await Tester.compileAndDiagnose(
    `
      #deprecated "Old is deprecated"
      model Old {}

      model Foo {
        #suppress "deprecated" "intentional"
        #suppress "deprecated" "duplicate"
        prop: Old;
      }
      `,
    {
      compilerOptions: { nostdlib: true },
    },
  );

  expectDiagnostics(diagnostics, {
    code: "duplicate-suppression",
    severity: "warning",
    message: 'Diagnostic "deprecated" is already suppressed on this node.',
  });
});

it("warns on duplicate suppressions without a message", async () => {
  const [, diagnostics] = await Tester.compileAndDiagnose(
    `
      #deprecated "Old is deprecated"
      model Old {}

      model Foo {
        #suppress "deprecated"
        #suppress "deprecated"
        prop: Old;
      }
      `,
    {
      compilerOptions: { nostdlib: true },
    },
  );

  expectDiagnostics(diagnostics, {
    code: "duplicate-suppression",
    severity: "warning",
    message: 'Diagnostic "deprecated" is already suppressed on this node.',
  });
});

it("reports unused suppression via tracker", async () => {
  const { program } = await Tester.compile(
    `
      #suppress "deprecated" "not needed anymore"
      model Foo {}
      `,
    {
      compilerOptions: { nostdlib: true },
    },
  );

  const unused = program.suppressionTracker?.getUnusedSuppressions() ?? [];
  strictEqual(unused.length, 1);
  strictEqual(unused[0].directive.code, "deprecated");
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
  const { program } = await Tester.compile(
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

  const unused = program.suppressionTracker?.getUnusedSuppressions() ?? [];
  strictEqual(unused.length, 0);
});

it("does not report unused suppression for unavailable diagnostic source", async () => {
  const { program } = await Tester.compile(
    `
      #suppress "test-emitter/not-run" "only emitted by another tool"
      model Foo {}
      `,
    {
      compilerOptions: { nostdlib: true },
    },
  );

  const unused = program.suppressionTracker?.getUnusedSuppressions() ?? [];
  strictEqual(unused.length, 0);
});

it("does not report unused suppression for errors as replacement for suppress-error", async () => {
  const [{ program }, diagnostics] = await Tester.compileAndDiagnose(
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
  // The suppression for an error should not appear as "unused" since it was explicitly rejected
  const unused = program.suppressionTracker?.getUnusedSuppressions() ?? [];
  strictEqual(unused.length, 0);
});
