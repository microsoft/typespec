import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { PositionDetail, SyntaxKind, TypeSpecScriptNode, parse } from "../../src/core/index.js";
import { getCompletionNodeAtPosition } from "../../src/server/serverlib.js";
import { extractCursor } from "../../src/testing/test-server-host.js";
import { dumpAST } from "../ast-test-utils.js";

describe("compiler: server: misc", () => {
  describe("getCompletionNodeAtPosition", () => {
    async function getNodeAtCursor(
      sourceWithCursor: string,
    ): Promise<{ root: TypeSpecScriptNode; detail: PositionDetail | undefined }> {
      const { source, pos } = extractCursor(sourceWithCursor);
      const root = parse(source, { comments: true, docs: true });
      dumpAST(root);
      return { detail: getCompletionNodeAtPosition(root, pos), root };
    }

    it("return identifier for property return type", async () => {
      const { detail } = await getNodeAtCursor(`
        model Foo {
          prop: stri┆ng
        }
      `);
      const node = detail?.node;
      ok(node);
      strictEqual(node.kind, SyntaxKind.Identifier as const);
      strictEqual(node.sv, "string");
    });

    it("return missing identifier node when at the position for model property type", async () => {
      const { detail } = await getNodeAtCursor(`
        model Foo {
          prop: ┆
        }
      `);
      const node = detail?.getPositionDetailAfterTrivia()?.node;
      ok(node);
      strictEqual(node.kind, SyntaxKind.Identifier as const);
      strictEqual(node.sv, "<missing identifier>1");
    });

    it("return string literal when in non completed string", async () => {
      const { detail } = await getNodeAtCursor(`
        import "┆
      `);
      const node = detail?.node;
      ok(node);
      strictEqual(node.kind, SyntaxKind.StringLiteral);
    });

    it("return string literal when in non completed multi line string", async () => {
      const { detail } = await getNodeAtCursor(`
        model Foo {
          prop: """┆
        }
      `);
      const node = detail?.node;
      ok(node);
      strictEqual(node.kind, SyntaxKind.StringLiteral);
    });

    it("return missing identifier between dot and close paren", async () => {
      const { detail } = await getNodeAtCursor(`
        @myDecN.┆)
      `);
      const node = detail?.node;
      ok(node);
      strictEqual(node.kind, SyntaxKind.Identifier as const);
      strictEqual(node.sv, "<missing identifier>1");
    });

    describe("resolve real node when no potential identifier", () => {
      it("return namespace when in namespace body", async () => {
        const { detail } = await getNodeAtCursor(`
        namespace Foo {
          ┆
        }
      `);
        const node = detail?.node;
        ok(node);
        strictEqual(node.kind, SyntaxKind.NamespaceStatement as const);
        strictEqual(node.id.sv, "Foo");
      });
    });
  });
});
