---
jsApi: true
title: "[I] TypeSpecScriptNode"

---
## Extends

- [`DeclarationNode`](DeclarationNode.md).[`BaseNode`](BaseNode.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ | :------ |
| `comments` | `readonly` | readonly [`Comment`](../type-aliases/Comment.md)[] | - | - | - |
| `directives?` | `readonly` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | [`BaseNode`](BaseNode.md).`directives` | [`BaseNode`](BaseNode.md).`directives` |
| `docs?` | `readonly` | readonly [`DocNode`](DocNode.md)[] | - | [`BaseNode`](BaseNode.md).`docs` | [`BaseNode`](BaseNode.md).`docs` |
| `end` | `readonly` | `number` | The ending position measured in UTF-16 code units from the start of the full string. Exclusive. | [`BaseNode`](BaseNode.md).`end` | [`BaseNode`](BaseNode.md).`end` |
| `file` | `readonly` | [`SourceFile`](SourceFile.md) | - | - | - |
| `flags` | `readonly` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | [`BaseNode`](BaseNode.md).`flags` | [`BaseNode`](BaseNode.md).`flags` |
| `id` | `readonly` | [`IdentifierNode`](IdentifierNode.md) | - | [`DeclarationNode`](DeclarationNode.md).`id` | [`DeclarationNode`](DeclarationNode.md).`id` |
| `inScopeNamespaces` | `readonly` | readonly [`NamespaceStatementNode`](NamespaceStatementNode.md)[] | - | - | - |
| `kind` | `readonly` | `TypeSpecScript` | - | [`BaseNode`](BaseNode.md).`kind` | [`BaseNode`](BaseNode.md).`kind` |
| `locals` | `readonly` | `SymbolTable` | - | - | - |
| `namespaces` | `readonly` | [`NamespaceStatementNode`](NamespaceStatementNode.md)[] | - | - | - |
| `parent?` | `readonly` | [`Node`](../type-aliases/Node.md) | - | [`BaseNode`](BaseNode.md).`parent` | [`BaseNode`](BaseNode.md).`parent` |
| `parseDiagnostics` | `readonly` | readonly [`Diagnostic`](Diagnostic.md)[] | - | - | - |
| `parseOptions` | `readonly` | [`ParseOptions`](ParseOptions.md) | - | - | - |
| `pos` | `readonly` | `number` | The starting position of the ranger measured in UTF-16 code units from the start of the full string. Inclusive. | [`BaseNode`](BaseNode.md).`pos` | [`BaseNode`](BaseNode.md).`pos` |
| `printable` | `readonly` | `boolean` | - | - | - |
| `statements` | `readonly` | readonly [`Statement`](../type-aliases/Statement.md)[] | - | - | - |
| `symbol` | `readonly` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice, you will likely only access symbol in cases where you know the node has a symbol. | [`BaseNode`](BaseNode.md).`symbol` | [`BaseNode`](BaseNode.md).`symbol` |
| `usings` | `readonly` | readonly [`UsingStatementNode`](UsingStatementNode.md)[] | - | - | - |
