import { ok, strictEqual } from "assert";
import { applyCodeFix } from "../core/code-fixes.js";
import {
  CodeFix,
  Node,
  createSourceFile,
  getNodeAtPosition,
  parse,
  visitChildren,
} from "../core/index.js";
import { mutate } from "../utils/misc.js";
import { createTestHost } from "./test-host.js";
import { extractCursor } from "./test-server-host.js";
import { trimBlankLines } from "./test-utils.js";

export interface CodeFixExpect {
  toChangeTo(code: string): Promise<void>;
}

/**
 * Test a code fix that only needs the ast as input.
 * @param code Code to parse. Use ┆ to mark the cursor position.
 * @param callback Callback to create the code fix it takes the node at the cursor position.
 *
 * @example
 *
 * ```ts
 *  await expectCodeFixOnAst(
 *    `
 *    model Foo {
 *      a: ┆number;
 *    }
 *  `,
 *    (node) => {
 *      strictEqual(node.kind, SyntaxKind.Identifier);
 *      return createChangeIdentifierCodeFix(node, "int32");
 *    }
 *  ).toChangeTo(`
 *    model Foo {
 *      a: int32;
 *    }
 *  `);
 * ```
 */
export function expectCodeFixOnAst(code: string, callback: (node: Node) => CodeFix): CodeFixExpect {
  return { toChangeTo };

  async function toChangeTo(expectedCode: string) {
    const { pos, source } = extractCursor(code);
    const virtualFile = createSourceFile(source, "test.tsp");
    const script = parse(virtualFile);
    linkAstParents(script);
    const node = getNodeAtPosition(script, pos);
    ok(node, "Expected node at cursor. Make sure to have ┆ to mark which node.");
    const codefix = callback(node);
    const host = await createTestHost();
    let updatedContent: string | undefined;
    await applyCodeFix(
      {
        ...host.compilerHost,
        writeFile: async (path, value) => {
          strictEqual(path, "test.tsp");
          updatedContent = value;
        },
      },
      codefix,
    );
    ok(updatedContent);
    strictEqual(trimBlankLines(updatedContent), trimBlankLines(expectedCode));
  }
}

function linkAstParents(base: Node) {
  visitChildren(base, (node) => {
    mutate(node).parent = base;
    linkAstParents(node);
  });
}
