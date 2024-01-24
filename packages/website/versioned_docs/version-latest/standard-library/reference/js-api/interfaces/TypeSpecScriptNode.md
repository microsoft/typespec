---
jsApi: true
title: "[I] TypeSpecScriptNode"

---
## Extends

- [`DeclarationNode`](DeclarationNode.md).[`BaseNode`](BaseNode.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `readonly` | `comments` | readonly [`Comment`](../type-aliases/Comment.md)[] | - | - |
| `readonly` | `directives?` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`BaseNode.directives`](BaseNode.md) |
| `readonly` | `docs?` | readonly [`DocNode`](DocNode.md)[] | - | [`BaseNode.docs`](BaseNode.md) |
| `readonly` | `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. | [`BaseNode.end`](BaseNode.md) |
| `readonly` | `file` | [`SourceFile`](SourceFile.md) | - | - |
| `readonly` | `flags` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`BaseNode.flags`](BaseNode.md) |
| `readonly` | `id` | [`IdentifierNode`](IdentifierNode.md) | - | [`DeclarationNode.id`](DeclarationNode.md) |
| `readonly` | `inScopeNamespaces` | readonly [`NamespaceStatementNode`](NamespaceStatementNode.md)[] | - | - |
| `readonly` | `kind` | `TypeSpecScript` | - | [`BaseNode.kind`](BaseNode.md) |
| `readonly` | `locals` | `SymbolTable` | - | - |
| `readonly` | `namespaces` | [`NamespaceStatementNode`](NamespaceStatementNode.md)[] | - | - |
| `readonly` | `parent?` | [`Node`](../type-aliases/Node.md) | - | [`BaseNode.parent`](BaseNode.md) |
| `readonly` | `parseDiagnostics` | readonly [`Diagnostic`](Diagnostic.md)[] | - | - |
| `readonly` | `parseOptions` | [`ParseOptions`](ParseOptions.md) | - | - |
| `readonly` | `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. | [`BaseNode.pos`](BaseNode.md) |
| `readonly` | `printable` | `boolean` | - | - |
| `readonly` | `statements` | readonly [`Statement`](../type-aliases/Statement.md)[] | - | - |
| `readonly` | `symbol` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. | [`BaseNode.symbol`](BaseNode.md) |
| `readonly` | `usings` | readonly [`UsingStatementNode`](UsingStatementNode.md)[] | - | - |
