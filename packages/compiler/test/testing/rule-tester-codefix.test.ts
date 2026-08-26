import { it } from "vitest";
import { getSourceLocation } from "../../src/core/diagnostics.js";
import { createLinterRule } from "../../src/core/library.js";
import type { Program } from "../../src/core/program.js";
import { createSourceFile } from "../../src/core/source-file.js";
import { CodeFixContext, CodeFixEdit, Model, SyntaxKind } from "../../src/core/types.js";
import { createLinterRuleTester } from "../../src/testing/rule-tester.js";
import { resolveVirtualPath } from "../../src/testing/test-utils.js";
import { Tester } from "../tester.js";

interface CodeFixTestContext {
  model: Model;
  fixContext: CodeFixContext;
  program: Program;
}

/**
 * Creates a rule tester with a rule that triggers on a model named "Foo"
 * and applies the given code fix function.
 */
async function createCodeFixRuleTester(
  createFix: (context: CodeFixTestContext) => CodeFixEdit | CodeFixEdit[],
  fixId = "test-fix",
) {
  const rule = createLinterRule({
    name: "test-codefix-rule",
    severity: "warning",
    description: "Test rule.",
    messages: { default: "Fix needed." },
    create(context) {
      return {
        model: (model: Model) => {
          if (model.name === "Foo" && model.node?.kind === SyntaxKind.ModelStatement) {
            context.reportDiagnostic({
              target: model,
              codefixes: [
                {
                  id: fixId,
                  label: "Test fix",
                  fix: (fixContext) => createFix({ model, fixContext, program: context.program }),
                },
              ],
            });
          }
        },
      };
    },
  });

  return createLinterRuleTester(await Tester.createInstance(), rule, "@typespec/compiler");
}
it("toEqual with string asserts single-file code fix on main.tsp", async () => {
  const tester = await createCodeFixRuleTester(({ model, fixContext }) => {
    const node = model.node!;
    if (node.kind !== SyntaxKind.ModelStatement) throw new Error("unexpected");
    return fixContext.replaceText(getSourceLocation(node.id), "Bar");
  });

  await tester
    .expect(`model Foo { name: string; }`)
    .applyCodeFix("test-fix")
    .toEqual(`model Bar { name: string; }`);
});

it("toEqual with Record asserts code fix that writes to a different file", async () => {
  const tester = await createCodeFixRuleTester(({ fixContext, program }) => {
    const clientFile = program.sourceFiles.get(resolveVirtualPath("client.tsp"))!.file;
    return fixContext.appendText(
      { file: clientFile, pos: clientFile.text.length },
      `\n@@override(Foo, "ClientFoo");\n`,
    );
  });

  await tester
    .expect({
      "main.tsp": `import "./client.tsp";\nmodel Foo { name: string; }`,
      "client.tsp": ``,
    })
    .applyCodeFix("test-fix")
    .toEqual({
      "client.tsp": `\n@@override(Foo, "ClientFoo");\n`,
    });
});

it("toEqual with Record asserts code fix that modifies both the original and a new file", async () => {
  const tester = await createCodeFixRuleTester(({ model, fixContext }) => {
    const mainFile = getSourceLocation(model.node!).file;
    const clientFile = createSourceFile("", resolveVirtualPath("client.tsp"));
    return [
      fixContext.prependText({ file: mainFile, pos: 0 }, `import "./client.tsp";\n`),
      fixContext.appendText({ file: clientFile, pos: 0 }, `@@override(Foo, "ClientFoo");\n`),
    ];
  });

  await tester
    .expect({
      "main.tsp": `model Foo { name: string; }`,
    })
    .applyCodeFix("test-fix")
    .toEqual({
      "main.tsp": `import "./client.tsp";\nmodel Foo { name: string; }`,
      "client.tsp": `@@override(Foo, "ClientFoo");\n`,
    });
});
