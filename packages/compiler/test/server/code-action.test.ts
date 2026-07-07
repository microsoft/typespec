import { deepStrictEqual, strictEqual } from "assert";
import { it } from "vitest";
import { CodeActionKind, Range } from "vscode-languageserver";
import { createLinterRule } from "../../src/core/library.js";
import { defineLinter } from "../../src/core/linter.js";
import { createTestServerHost } from "../../src/testing/test-server-host.js";

it("expands dynamic codefixes into separate code actions", async () => {
  const host = await createTestServerHost();
  let resolveCalls = 0;
  let appliedFix = "";

  const dynamicRule = createLinterRule({
    name: "dynamic-codefix",
    description: "Test dynamic codefix expansion",
    severity: "warning",
    messages: {
      default: "Dynamic codefix test.",
    },
    create(context) {
      return {
        model: (target) => {
          context.reportDiagnostic({
            target,
            codefixes: [
              {
                id: "dynamic-root",
                label: "Generate dynamic fixes",
                fix: () => undefined,
                resolveCodefixes: async () => {
                  resolveCalls++;
                  return [
                    {
                      id: "dynamic-first",
                      label: "Use first suggestion",
                      fix: () => {
                        appliedFix = "first";
                      },
                    },
                    {
                      id: "dynamic-second",
                      label: "Use second suggestion",
                      fix: () => {
                        appliedFix = "second";
                      },
                    },
                  ];
                },
              },
            ],
          });
        },
      };
    },
  });

  host.addTypeSpecFile(
    "./node_modules/@typespec/dynamic-codefix-linter/package.json",
    JSON.stringify({
      name: "@typespec/dynamic-codefix-linter",
      version: "0.0.1",
      main: "lib/index.js",
    }),
  );
  host.addJsFile("./node_modules/@typespec/dynamic-codefix-linter/lib/index.js", {
    $linter: defineLinter({
      rules: [dynamicRule],
      ruleSets: {
        recommended: {
          enable: {
            "@typespec/dynamic-codefix-linter/dynamic-codefix": true,
          },
        },
      },
    }),
  });

  host.addOrUpdateDocument(
    "./tspconfig.yaml",
    [
      "linter:",
      "  extends:",
      '    - "@typespec/dynamic-codefix-linter/recommended"',
    ].join("\n"),
  );
  const document = host.addOrUpdateDocument("./main.tsp", "model Test {}");
  await host.server.compile(document, undefined, { mode: "full" });

  const diagnostics = host.getDiagnostics("./main.tsp");
  strictEqual(diagnostics.length, 1);

  const actions = await host.server.getCodeActions({
    textDocument: document,
    range: Range.create(0, 0, 0, 0),
    context: { diagnostics: [...diagnostics] },
  });

  deepStrictEqual(
    actions.map((x) => ({ title: x.title, kind: x.kind })),
    [
      { title: "Use first suggestion", kind: CodeActionKind.QuickFix },
      { title: "Use second suggestion", kind: CodeActionKind.QuickFix },
    ],
  );
  strictEqual(resolveCalls, 1);

  await host.server.resolveCodeAction(actions[1]);
  strictEqual(appliedFix, "second");
});
