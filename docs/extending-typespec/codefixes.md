---
title: Code fixes
---

## Define a code fix

A code fix can be defined using the `defineCodeFix` function which is just here to help with typing. It doesn't need to be declared separately from being reported but doing so allows you to test it.

A codefix takes 3 arguments:

- `id`: A unique identifier for the code fix.
- `label`: A human-readable label for the code fix.
- `fix`: The implementation of the codefix. Takes in a context that allows patch operations on the source code. The fix function should return the list of changes to apply to the source code.

```ts
import { defineCodeFix, getSourceLocation, type IdentifierNode } from "@typespec/compiler";

export function createChangeIdentifierCodeFix(node: IdentifierNode, newIdentifier: string) {
  return defineCodeFix({
    id: "change-identifier",
    label: `Change ${node.sv} to ${newIdentifier}`,
    fix: (context) => {
      const location = getSourceLocation(node);
      return context.replaceText(location, newIdentifier);
    },
  });
}
```

## Connect a codefix to a diagnostic

When reporting diagnostics, you can pass `codefixes` to the `reportDiagnostic`/`createDiagnostic` functions. It is an array of codefixes that can be used to fix the diagnostic.

```ts
reportDiagnostic({
  code: "invalid-identifier",
  target: node,
  codefixes: [createChangeIdentifierCodeFix(node, "string")],
});
```

## Test a diagnostic

[See here for testing a codefix inside a linter rule](./linters.md#testing-linter-with-codefixes)

Testing a codefix is done by using the `expectCodeFixOnAst` function from the `@typespec/compiler/testing` package. It takes in the source code and a function that returns the codefix to apply.
It takes the input source code with a cursor defined by `┆` which will be used to resolve the node where the codefix should be applied. The callback function will receive that resolved node and is expected to return the codefix to test.

:::note
When using multi-line strings (with `\``) in typescript there is no de-indenting done so you will need to make sure the input and expected result are aligned to the left.
:::

```ts
import { strictEqual } from "assert";
import { createChangeIdentifierCodeFix } from "./change-identifier.codefix.js";
import { SyntaxKind } from "@typespec/compiler";
import { expectCodeFixOnAst } from "@typespec/compiler/testing";

describe("CodeFix: change-identifier", () => {
  it("it change identifier", async () => {
    await expectCodeFixOnAst(
      `
      model Foo {
        a: ┆number;
      }
    `,
      (node) => {
        strictEqual(node.kind, SyntaxKind.Identifier);
        return createChangeIdentifierCodeFix(node, "int32");
      },
    ).toChangeTo(`
      model Foo {
        a: int32;
      }
    `);
  });
});
```
