import { deepStrictEqual } from "assert";
import { findStatementsIn } from "../../core/helpers/ast-utils.js";
import { CadlScriptNode, NamespaceStatementNode, Statement, SyntaxKind } from "../../core/index.js";
import { BasicTestRunner, createTestRunner, resolveVirtualPath } from "../../testing/index.js";

describe("compiler: ast-utils", () => {
  let runner: BasicTestRunner;
  beforeEach(async () => {
    runner = await createTestRunner();
  });

  function getMainFile(): CadlScriptNode {
    return runner.program.sourceFiles.get(resolveVirtualPath("main.cadl"))!;
  }

  async function findStatementNames(
    root: CadlScriptNode | NamespaceStatementNode,
    kind: Statement["kind"]
  ): Promise<string[]> {
    return findStatementsIn(root, kind).map((x: Statement) => {
      return "id" in x ? x.id.sv : "";
    });
  }

  it("find all alias statements in entire document", async () => {
    await runner.compile(`
      alias MyString = string;
      
      namespace Bar {
        alias MyInt = int32;

        model NotIncluded {}
      }

      namespace Foo {
        alias ActuallyIncluded = Bar.NotIncluded;
      }
    `);

    deepStrictEqual(await findStatementNames(getMainFile(), SyntaxKind.AliasStatement), [
      "MyString",
      "MyInt",
      "ActuallyIncluded",
    ]);
  });

  it("find all alias under a given namespace", async () => {
    await runner.compile(`
      alias MyString = string;
      
      namespace Bar {
        alias MyInt = int32;

        model NotIncluded {}
      }

      namespace Foo {
        alias ActuallyIncluded = Bar.NotIncluded;
      }
    `);

    deepStrictEqual(
      await findStatementNames(
        getMainFile().namespaces.find((x) => x.id.sv === "Bar")!,
        SyntaxKind.AliasStatement
      ),
      ["MyInt"]
    );
  });
});
