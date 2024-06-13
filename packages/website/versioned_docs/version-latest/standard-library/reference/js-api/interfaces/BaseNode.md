---
jsApi: true
title: "[I] BaseNode"

---
## Extends

- [`TextRange`](TextRange.md)

## Extended by

- [`TypeSpecScriptNode`](TypeSpecScriptNode.md)
- [`ImportStatementNode`](ImportStatementNode.md)
- [`IdentifierNode`](IdentifierNode.md)
- [`DecoratorExpressionNode`](DecoratorExpressionNode.md)
- [`AugmentDecoratorStatementNode`](AugmentDecoratorStatementNode.md)
- [`DirectiveExpressionNode`](DirectiveExpressionNode.md)
- [`MemberExpressionNode`](MemberExpressionNode.md)
- [`NamespaceStatementNode`](NamespaceStatementNode.md)
- [`UsingStatementNode`](UsingStatementNode.md)
- [`OperationSignatureDeclarationNode`](OperationSignatureDeclarationNode.md)
- [`OperationSignatureReferenceNode`](OperationSignatureReferenceNode.md)
- [`OperationStatementNode`](OperationStatementNode.md)
- [`ModelStatementNode`](ModelStatementNode.md)
- [`ScalarStatementNode`](ScalarStatementNode.md)
- [`ScalarConstructorNode`](ScalarConstructorNode.md)
- [`InterfaceStatementNode`](InterfaceStatementNode.md)
- [`UnionStatementNode`](UnionStatementNode.md)
- [`UnionVariantNode`](UnionVariantNode.md)
- [`EnumStatementNode`](EnumStatementNode.md)
- [`EnumMemberNode`](EnumMemberNode.md)
- [`EnumSpreadMemberNode`](EnumSpreadMemberNode.md)
- [`AliasStatementNode`](AliasStatementNode.md)
- [`ConstStatementNode`](ConstStatementNode.md)
- [`CallExpressionNode`](CallExpressionNode.md)
- [`InvalidStatementNode`](InvalidStatementNode.md)
- [`EmptyStatementNode`](EmptyStatementNode.md)
- [`ModelExpressionNode`](ModelExpressionNode.md)
- [`ArrayExpressionNode`](ArrayExpressionNode.md)
- [`TupleExpressionNode`](TupleExpressionNode.md)
- [`ModelPropertyNode`](ModelPropertyNode.md)
- [`ModelSpreadPropertyNode`](ModelSpreadPropertyNode.md)
- [`ObjectLiteralNode`](ObjectLiteralNode.md)
- [`ObjectLiteralPropertyNode`](ObjectLiteralPropertyNode.md)
- [`ObjectLiteralSpreadPropertyNode`](ObjectLiteralSpreadPropertyNode.md)
- [`ArrayLiteralNode`](ArrayLiteralNode.md)
- [`StringLiteralNode`](StringLiteralNode.md)
- [`NumericLiteralNode`](NumericLiteralNode.md)
- [`BooleanLiteralNode`](BooleanLiteralNode.md)
- [`StringTemplateExpressionNode`](StringTemplateExpressionNode.md)
- [`StringTemplateSpanNode`](StringTemplateSpanNode.md)
- [`StringTemplateLiteralLikeNode`](StringTemplateLiteralLikeNode.md)
- [`ExternKeywordNode`](ExternKeywordNode.md)
- [`VoidKeywordNode`](VoidKeywordNode.md)
- [`NeverKeywordNode`](NeverKeywordNode.md)
- [`AnyKeywordNode`](AnyKeywordNode.md)
- [`ReturnExpressionNode`](ReturnExpressionNode.md)
- [`UnionExpressionNode`](UnionExpressionNode.md)
- [`IntersectionExpressionNode`](IntersectionExpressionNode.md)
- [`ValueOfExpressionNode`](ValueOfExpressionNode.md)
- [`TypeOfExpressionNode`](TypeOfExpressionNode.md)
- [`TypeReferenceNode`](TypeReferenceNode.md)
- [`TemplateArgumentNode`](TemplateArgumentNode.md)
- [`ProjectionReferenceNode`](ProjectionReferenceNode.md)
- [`TemplateParameterDeclarationNode`](TemplateParameterDeclarationNode.md)
- [`DecoratorDeclarationStatementNode`](DecoratorDeclarationStatementNode.md)
- [`FunctionParameterNode`](FunctionParameterNode.md)
- [`FunctionDeclarationStatementNode`](FunctionDeclarationStatementNode.md)
- [`ProjectionModelSelectorNode`](ProjectionModelSelectorNode.md)
- [`ProjectionScalarSelectorNode`](ProjectionScalarSelectorNode.md)
- [`ProjectionModelPropertySelectorNode`](ProjectionModelPropertySelectorNode.md)
- [`ProjectionInterfaceSelectorNode`](ProjectionInterfaceSelectorNode.md)
- [`ProjectionOperationSelectorNode`](ProjectionOperationSelectorNode.md)
- [`ProjectionUnionSelectorNode`](ProjectionUnionSelectorNode.md)
- [`ProjectionUnionVariantSelectorNode`](ProjectionUnionVariantSelectorNode.md)
- [`ProjectionEnumSelectorNode`](ProjectionEnumSelectorNode.md)
- [`ProjectionEnumMemberSelectorNode`](ProjectionEnumMemberSelectorNode.md)
- [`ProjectionParameterDeclarationNode`](ProjectionParameterDeclarationNode.md)
- [`ProjectionExpressionStatementNode`](ProjectionExpressionStatementNode.md)
- [`ProjectionLogicalExpressionNode`](ProjectionLogicalExpressionNode.md)
- [`ProjectionRelationalExpressionNode`](ProjectionRelationalExpressionNode.md)
- [`ProjectionEqualityExpressionNode`](ProjectionEqualityExpressionNode.md)
- [`ProjectionArithmeticExpressionNode`](ProjectionArithmeticExpressionNode.md)
- [`ProjectionUnaryExpressionNode`](ProjectionUnaryExpressionNode.md)
- [`ProjectionCallExpressionNode`](ProjectionCallExpressionNode.md)
- [`ProjectionMemberExpressionNode`](ProjectionMemberExpressionNode.md)
- [`ProjectionModelExpressionNode`](ProjectionModelExpressionNode.md)
- [`ProjectionTupleExpressionNode`](ProjectionTupleExpressionNode.md)
- [`ProjectionModelPropertyNode`](ProjectionModelPropertyNode.md)
- [`ProjectionModelSpreadPropertyNode`](ProjectionModelSpreadPropertyNode.md)
- [`ProjectionIfExpressionNode`](ProjectionIfExpressionNode.md)
- [`ProjectionBlockExpressionNode`](ProjectionBlockExpressionNode.md)
- [`ProjectionLambdaExpressionNode`](ProjectionLambdaExpressionNode.md)
- [`ProjectionLambdaParameterDeclarationNode`](ProjectionLambdaParameterDeclarationNode.md)
- [`ProjectionNode`](ProjectionNode.md)
- [`ProjectionStatementNode`](ProjectionStatementNode.md)
- [`ProjectionDecoratorReferenceExpressionNode`](ProjectionDecoratorReferenceExpressionNode.md)
- [`DocNode`](DocNode.md)
- [`DocTagBaseNode`](DocTagBaseNode.md)
- [`DocTextNode`](DocTextNode.md)
- [`JsSourceFileNode`](JsSourceFileNode.md)
- [`JsNamespaceDeclarationNode`](JsNamespaceDeclarationNode.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `directives?` | `readonly` | readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[] | - | - |
| `docs?` | `readonly` | readonly [`DocNode`](DocNode.md)[] | - | - |
| `end` | `readonly` | `number` | The ending position measured in UTF-16 code units from the start of the full string. Exclusive. | [`TextRange`](TextRange.md).`end` |
| `flags` | `readonly` | [`NodeFlags`](../enumerations/NodeFlags.md) | - | - |
| `kind` | `readonly` | [`SyntaxKind`](../enumerations/SyntaxKind.md) | - | - |
| `parent?` | `readonly` | [`Node`](../type-aliases/Node.md) | - | - |
| `pos` | `readonly` | `number` | The starting position of the ranger measured in UTF-16 code units from the start of the full string. Inclusive. | [`TextRange`](TextRange.md).`pos` |
| `symbol` | `readonly` | [`Sym`](Sym.md) | Could be undefined but making this optional creates a lot of noise. In practice, you will likely only access symbol in cases where you know the node has a symbol. | - |
