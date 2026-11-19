import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getNodeForTarget } from "../../src/core/diagnostics.js";
import { SyntaxKind } from "../../src/core/types.js";
import type { SourceLocationOptions } from "../../src/index.js";
import { getSourceLocation } from "../../src/index.js";
import { t } from "../../src/testing/marked-template.js";
import { extractSquiggles } from "../../src/testing/source-utils.js";
import { Tester } from "../tester.js";

async function expectLocationMatch(code: string, options: SourceLocationOptions = {}) {
  const { pos, end, source } = extractSquiggles(code);
  const { target } = await Tester.compile(source);
  const location = getSourceLocation(target, options);
  strictEqual(location.pos, pos);
  strictEqual(location.end, end);
}

describe("getSourceLocation", () => {
  it("report whole model by default", () =>
    expectLocationMatch(`
      ~~~@doc("This is documentation")
      model /*target*/Foo {
        name: string;
      }~~~
    
    `));
  it("report report only model id if `locateId: true`", () =>
    expectLocationMatch(
      `
      @doc("This is documentation")
      model /*target*/~~~Foo~~~ {
        name: string;
      }
    
    `,
      { locateId: true },
    ));

  describe("type references", () => {
    async function expectReferenceLocation(
      reference: string,
      highlighted: string,
      options: SourceLocationOptions = {},
    ) {
      const { prop } = await Tester.compile(t.code`
        model Foo<T> {}
        namespace N { model Foo<T> {} }
        model Test {
          ${t.modelProperty("prop")}: ${reference};
        }
      `);
      ok(prop.node?.kind === SyntaxKind.ModelProperty);
      const location = getSourceLocation(prop.node.value, options);
      strictEqual(location.file.text.slice(location.pos, location.end), highlighted);
    }

    it("includes template arguments by default", () =>
      expectReferenceLocation("N.Foo<string>", "N.Foo<string>"));

    it("highlights only the reference target with locateId", () =>
      expectReferenceLocation("Foo<string>", "Foo", { locateId: true }));

    it("preserves the qualified target without template arguments with locateId", () =>
      expectReferenceLocation("N.Foo<string>", "N.Foo", { locateId: true }));
  });
});

describe("getNodeForTarget", () => {
  const mockSyntaxKindA = SyntaxKind.ModelStatement;
  const mockSyntaxKindB = SyntaxKind.ScalarStatement;
  const mockSyntaxKindC = SyntaxKind.NamespaceStatement;

  it("returns function value node when available", () => {
    const valueNode = { kind: mockSyntaxKindA } as any;
    const typeNode = { kind: mockSyntaxKindB } as any;

    const target = {
      entityKind: "Value",
      valueKind: "Function",
      node: valueNode,
      type: { kind: "FunctionType", node: typeNode },
    } as any;

    strictEqual(getNodeForTarget(target), valueNode);
  });

  it("falls back to value type node when value has no node", () => {
    const typeNode = { kind: mockSyntaxKindC } as any;

    const target = {
      entityKind: "Value",
      valueKind: "StringValue",
      type: { kind: "String", node: typeNode },
    } as any;

    strictEqual(getNodeForTarget(target), typeNode);
  });

  it("returns object value node when available", () => {
    const valueNode = { kind: mockSyntaxKindB } as any;

    const target = {
      entityKind: "Value",
      valueKind: "ObjectValue",
      node: valueNode,
      type: { kind: "Model", node: undefined },
    } as any;

    strictEqual(getNodeForTarget(target), valueNode);
  });

  it("resolves mixed parameter constraint target in priority order", () => {
    const explicitNode = { kind: mockSyntaxKindA } as any;
    const typeNode = { kind: mockSyntaxKindB } as any;

    strictEqual(
      getNodeForTarget({
        entityKind: "MixedParameterConstraint",
        node: explicitNode,
        type: { kind: "Model", node: typeNode },
      } as any),
      explicitNode,
    );

    strictEqual(
      getNodeForTarget({
        entityKind: "MixedParameterConstraint",
        type: { kind: "Model", node: typeNode },
      } as any),
      typeNode,
    );
  });

  it("resolves indeterminate target to underlying type node", () => {
    const typeNode = { kind: mockSyntaxKindC } as any;

    const target = {
      entityKind: "Indeterminate",
      type: { kind: "String", node: typeNode },
    } as any;

    strictEqual(getNodeForTarget(target), typeNode);
  });
});
