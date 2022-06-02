import { ok, strictEqual } from "assert";
import {
  CadlScriptNode,
  IdentifierNode,
  NamespaceStatementNode,
  SyntaxKind,
} from "../core/index.js";
import { getNodeAtPosition, parse } from "../core/parser.js";
import { Node } from "../core/types.js";
import { extractCursor } from "./server/test-server-host.js";

describe.only("compiler: parser utils", () => {
  describe("getNodeAtPosition", () => {
    async function getNodeAtCursor(
      sourceWithCursor: string
    ): Promise<{ root: CadlScriptNode; node: Node | undefined }> {
      const { source, pos } = extractCursor(sourceWithCursor);
      const root = parse(source);
      return { node: getNodeAtPosition(root, pos), root };
    }

    it("return namespace when in namespace body", async () => {
      const { node } = await getNodeAtCursor(`
        namespace Foo {
          ┆
        }
      `);
      ok(node);
      strictEqual(node.kind, SyntaxKind.NamespaceStatement);
      strictEqual((node as NamespaceStatementNode).id.sv, "Foo");
    });

    it("return identifier for property return type", async () => {
      const { node } = await getNodeAtCursor(`
        model Foo {
          prop: stri┆ng
        }
      `);
      ok(node);
      strictEqual(node.kind, SyntaxKind.Identifier);
      strictEqual((node as IdentifierNode).sv, "string");
    });

    it("return missing identifier node when at the position for model property type", async () => {
      const { node } = await getNodeAtCursor(`
        model Foo {
          prop: ┆
        }
      `);
      ok(node);
      strictEqual(node.kind, SyntaxKind.Identifier);
      strictEqual((node as IdentifierNode).sv, "<missing identifier>1");
    });

    it("return string literal when in non completed string", async () => {
      const { node } = await getNodeAtCursor(`
        import "┆
      `);
      ok(node);
      strictEqual(node.kind, SyntaxKind.StringLiteral);
    });

    it("return string literal when in non completed multi line string", async () => {
      const { node } = await getNodeAtCursor(`
        model Foo {
          prop: """┆
        }
      `);
      ok(node);
      strictEqual(node.kind, SyntaxKind.StringLiteral);
    });
  });
});
