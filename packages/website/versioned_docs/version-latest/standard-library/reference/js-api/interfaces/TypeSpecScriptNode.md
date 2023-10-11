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
| `readonly` | `directives?` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`BaseNode`](BaseNode.md).`directives` |
| `readonly` | `docs?` | readonly [`DocNode`](DocNode.md)[] | - | [`BaseNode`](BaseNode.md).`docs` |
| `readonly` | `end` | `number` | The ending position measured in UTF-16 code units from the start of the<br />full string. Exclusive. | [`BaseNode`](BaseNode.md).`end` |
| `readonly` | `file` | [`SourceFile`](SourceFile.md) | - | - |
| `readonly` | `flags` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`BaseNode`](BaseNode.md).`flags` |
| `readonly` | `id` | [`IdentifierNode`](IdentifierNode.md) | - | [`DeclarationNode`](DeclarationNode.md).`id` |
| `readonly` | `inScopeNamespaces` | readonly [`NamespaceStatementNode`](NamespaceStatementNode.md)[] | - | - |
| `readonly` | `kind` | `TypeSpecScript` | - | [`BaseNode`](BaseNode.md).`kind` |
| `readonly` | `locals` | `SymbolTable` | - | - |
| `readonly` | `namespaces` | [`NamespaceStatementNode`](NamespaceStatementNode.md)[] | - | - |
| `readonly` | `parent?` | [`Node`](../type-aliases/Node.md) | - | [`BaseNode`](BaseNode.md).`parent` |
| `readonly` | `parseDiagnostics` | readonly [`Diagnostic`](Diagnostic.md)[] | - | - |
| `readonly` | `parseOptions` | [`ParseOptions`](ParseOptions.md) | - | - |
| `readonly` | `pos` | `number` | The starting position of the ranger measured in UTF-16 code units from the<br />start of the full string. Inclusive. | [`BaseNode`](BaseNode.md).`pos` |
| `readonly` | `printable` | `boolean` | - | - |
| `readonly` | `statements` | readonly [`Statement`](../type-aliases/Statement.md)[] | - | - |
| `readonly` | `symbol` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice,<br />you will likely only access symbol in cases where you know the node has a symbol. | [`BaseNode`](BaseNode.md).`symbol` |
| `readonly` | `usings` | readonly [`UsingStatementNode`](UsingStatementNode.md)[] | - | - |
