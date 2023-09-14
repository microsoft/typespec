---
jsApi: true
title: "[I] TypeSpecScriptNode"

---
## Extends

- [`DeclarationNode`](Interface.DeclarationNode.md).[`BaseNode`](Interface.BaseNode.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `readonly` `comments` | *readonly* [`Comment`](Type.Comment.md)[] | - |
| `directives`? | *readonly* [`DirectiveExpressionNode`](Interface.DirectiveExpressionNode.md)[] | - |
| `docs`? | *readonly* [`DocNode`](Interface.DocNode.md)[] | - |
| `readonly` `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. |
| `readonly` `file` | [`SourceFile`](Interface.SourceFile.md) | - |
| `readonly` `flags` | [`NodeFlags`](Enumeration.NodeFlags.md) | - |
| `readonly` `id` | [`IdentifierNode`](Interface.IdentifierNode.md) | - |
| `readonly` `inScopeNamespaces` | *readonly* [`NamespaceStatementNode`](Interface.NamespaceStatementNode.md)[] | - |
| `readonly` `kind` | [`TypeSpecScript`](Enumeration.SyntaxKind.md#typespecscript) | - |
| `readonly` `locals` | `SymbolTable` | - |
| `readonly` `namespaces` | [`NamespaceStatementNode`](Interface.NamespaceStatementNode.md)[] | - |
| `parent`? | [`Node`](Type.Node.md) | - |
| `readonly` `parseDiagnostics` | *readonly* [`Diagnostic`](Interface.Diagnostic.md)[] | - |
| `readonly` `parseOptions` | [`ParseOptions`](Interface.ParseOptions.md) | - |
| `readonly` `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. |
| `readonly` `printable` | `boolean` | - |
| `readonly` `statements` | *readonly* [`Statement`](Type.Statement.md)[] | - |
| `readonly` `symbol` | [`Sym`](Interface.Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. |
| `readonly` `usings` | *readonly* [`UsingStatementNode`](Interface.UsingStatementNode.md)[] | - |
