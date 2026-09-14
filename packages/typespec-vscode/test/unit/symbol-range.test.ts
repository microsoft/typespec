import { parse, SyntaxKind, type Node } from "@typespec/compiler/ast";
import { strictEqual } from "assert";
import { it } from "vitest";
import {
  createTypeSpecSymbolNameRangeResolver,
  findInnermostSymbolAtOffset,
  findTypeSpecEntityAtOffset,
} from "../../src/symbol-range.js";

function expectSelectedText(source: string, node: Node, expected: string) {
  const resolveRange = createTypeSpecSymbolNameRangeResolver(source);
  const range = resolveRange(node.pos, node.end);

  strictEqual(range && source.slice(range.pos, range.end), expected);
}

it("selects declaration and member names instead of their definitions", () => {
  const source = `
    @doc("Pet")
    model Pet {
      @doc("name")
      name: string;
    }
  `;
  const script = parse(source);
  const model = script.statements[0];
  strictEqual(model.kind, SyntaxKind.ModelStatement);

  expectSelectedText(source, model, "Pet");
  expectSelectedText(source, model.properties[0], "name");
});

it("selects escaped, quoted, spread, and dotted namespace names", () => {
  const source = `
    namespace MyService.Models {}
    model \`Pet-name\` {
      "content-type": string;
      ...CommonPet
    }
  `;
  const script = parse(source);
  const namespace = script.statements[0];
  const model = script.statements[1];
  strictEqual(namespace.kind, SyntaxKind.NamespaceStatement);
  strictEqual(model.kind, SyntaxKind.ModelStatement);

  expectSelectedText(source, namespace, "MyService.Models");
  expectSelectedText(source, model, "`Pet-name`");
  expectSelectedText(source, model.properties[0], '"content-type"');
  expectSelectedText(source, model.properties[1], "CommonPet");
});

it("finds the innermost symbol containing the cursor", () => {
  const property = { range: { pos: 12, end: 25 }, children: [] };
  const model = { range: { pos: 0, end: 30 }, children: [property] };

  strictEqual(
    findInnermostSymbolAtOffset(
      [model],
      15,
      (symbol) => symbol.range,
      (symbol) => symbol.children,
    ),
    property,
  );
  strictEqual(
    findInnermostSymbolAtOffset(
      [model],
      5,
      (symbol) => symbol.range,
      (symbol) => symbol.children,
    ),
    model,
  );
  strictEqual(
    findInnermostSymbolAtOffset(
      [model],
      31,
      (symbol) => symbol.range,
      (symbol) => symbol.children,
    ),
    undefined,
  );
});

it("finds a hovered entity directly from TypeSpec source", () => {
  const source = "model Pet { name: string; }";
  const entity = findTypeSpecEntityAtOffset(source, source.indexOf("name") + 1);

  strictEqual(entity?.name, "name");
  strictEqual(source.slice(entity?.range.pos, entity?.range.end), "name: string");
  strictEqual(source.slice(entity?.nameRange.pos, entity?.nameRange.end), "name");
});
