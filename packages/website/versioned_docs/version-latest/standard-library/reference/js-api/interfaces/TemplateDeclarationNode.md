---
jsApi: true
title: "[I] TemplateDeclarationNode"

---
## Extended by

- [`OperationStatementNode`](OperationStatementNode.md)
- [`ModelStatementNode`](ModelStatementNode.md)
- [`ScalarStatementNode`](ScalarStatementNode.md)
- [`InterfaceStatementNode`](InterfaceStatementNode.md)
- [`UnionStatementNode`](UnionStatementNode.md)
- [`AliasStatementNode`](AliasStatementNode.md)

## Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `locals?` | `readonly` | `SymbolTable` |
| `templateParameters` | `readonly` | readonly [`TemplateParameterDeclarationNode`](TemplateParameterDeclarationNode.md)[] |
| `templateParametersRange` | `readonly` | [`TextRange`](TextRange.md) |
