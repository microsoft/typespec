import { ok, strictEqual } from "assert";
import { it } from "vitest";
import { SyntaxKind } from "../../../src/ast/index.js";
import { createQualifyReferenceCodeFix } from "../../../src/core/compiler-code-fixes/qualify-reference.codefix.js";
import { expectCodeFixOnAst } from "../../../src/testing/code-fix-testing.js";

it("qualifies a simple reference", async () => {
  await expectCodeFixOnAst(
    `
      using ┆Models;
      namespace MyOrg.Svc;
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.Identifier);
      return createQualifyReferenceCodeFix(node, "MyOrg.Models");
    },
  ).toChangeTo(`
      using MyOrg.Models;
      namespace MyOrg.Svc;
    `);
});

it("qualifies a member expression reference", async () => {
  await expectCodeFixOnAst(
    `
      using ┆Models.Sub;
      namespace MyOrg.Svc;
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.Identifier);
      const memberExpression = node.parent;
      ok(memberExpression?.kind === SyntaxKind.MemberExpression);
      return createQualifyReferenceCodeFix(memberExpression, "MyOrg.Models.Sub");
    },
  ).toChangeTo(`
      using MyOrg.Models.Sub;
      namespace MyOrg.Svc;
    `);
});
