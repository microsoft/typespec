[JS Api](../index.md) / BaseNode

# Interface: BaseNode

## Hierarchy

- [`TextRange`](TextRange.md)

  ↳ **`BaseNode`**

  ↳↳ [`TypeSpecScriptNode`](TypeSpecScriptNode.md)

  ↳↳ [`ImportStatementNode`](ImportStatementNode.md)

  ↳↳ [`IdentifierNode`](IdentifierNode.md)

  ↳↳ [`DecoratorExpressionNode`](DecoratorExpressionNode.md)

  ↳↳ [`AugmentDecoratorStatementNode`](AugmentDecoratorStatementNode.md)

  ↳↳ [`DirectiveExpressionNode`](DirectiveExpressionNode.md)

  ↳↳ [`MemberExpressionNode`](MemberExpressionNode.md)

  ↳↳ [`NamespaceStatementNode`](NamespaceStatementNode.md)

  ↳↳ [`UsingStatementNode`](UsingStatementNode.md)

  ↳↳ [`OperationSignatureDeclarationNode`](OperationSignatureDeclarationNode.md)

  ↳↳ [`OperationSignatureReferenceNode`](OperationSignatureReferenceNode.md)

  ↳↳ [`OperationStatementNode`](OperationStatementNode.md)

  ↳↳ [`ModelStatementNode`](ModelStatementNode.md)

  ↳↳ [`ScalarStatementNode`](ScalarStatementNode.md)

  ↳↳ [`InterfaceStatementNode`](InterfaceStatementNode.md)

  ↳↳ [`UnionStatementNode`](UnionStatementNode.md)

  ↳↳ [`UnionVariantNode`](UnionVariantNode.md)

  ↳↳ [`EnumStatementNode`](EnumStatementNode.md)

  ↳↳ [`EnumMemberNode`](EnumMemberNode.md)

  ↳↳ [`EnumSpreadMemberNode`](EnumSpreadMemberNode.md)

  ↳↳ [`AliasStatementNode`](AliasStatementNode.md)

  ↳↳ [`InvalidStatementNode`](InvalidStatementNode.md)

  ↳↳ [`EmptyStatementNode`](EmptyStatementNode.md)

  ↳↳ [`ModelExpressionNode`](ModelExpressionNode.md)

  ↳↳ [`ArrayExpressionNode`](ArrayExpressionNode.md)

  ↳↳ [`TupleExpressionNode`](TupleExpressionNode.md)

  ↳↳ [`ModelPropertyNode`](ModelPropertyNode.md)

  ↳↳ [`ModelSpreadPropertyNode`](ModelSpreadPropertyNode.md)

  ↳↳ [`StringLiteralNode`](StringLiteralNode.md)

  ↳↳ [`NumericLiteralNode`](NumericLiteralNode.md)

  ↳↳ [`BooleanLiteralNode`](BooleanLiteralNode.md)

  ↳↳ [`ExternKeywordNode`](ExternKeywordNode.md)

  ↳↳ [`VoidKeywordNode`](VoidKeywordNode.md)

  ↳↳ [`NeverKeywordNode`](NeverKeywordNode.md)

  ↳↳ [`AnyKeywordNode`](AnyKeywordNode.md)

  ↳↳ [`ReturnExpressionNode`](ReturnExpressionNode.md)

  ↳↳ [`UnionExpressionNode`](UnionExpressionNode.md)

  ↳↳ [`IntersectionExpressionNode`](IntersectionExpressionNode.md)

  ↳↳ [`ValueOfExpressionNode`](ValueOfExpressionNode.md)

  ↳↳ [`TypeReferenceNode`](TypeReferenceNode.md)

  ↳↳ [`ProjectionReferenceNode`](ProjectionReferenceNode.md)

  ↳↳ [`TemplateParameterDeclarationNode`](TemplateParameterDeclarationNode.md)

  ↳↳ [`DecoratorDeclarationStatementNode`](DecoratorDeclarationStatementNode.md)

  ↳↳ [`FunctionParameterNode`](FunctionParameterNode.md)

  ↳↳ [`FunctionDeclarationStatementNode`](FunctionDeclarationStatementNode.md)

  ↳↳ [`ProjectionModelSelectorNode`](ProjectionModelSelectorNode.md)

  ↳↳ [`ProjectionModelPropertySelectorNode`](ProjectionModelPropertySelectorNode.md)

  ↳↳ [`ProjectionInterfaceSelectorNode`](ProjectionInterfaceSelectorNode.md)

  ↳↳ [`ProjectionOperationSelectorNode`](ProjectionOperationSelectorNode.md)

  ↳↳ [`ProjectionUnionSelectorNode`](ProjectionUnionSelectorNode.md)

  ↳↳ [`ProjectionUnionVariantSelectorNode`](ProjectionUnionVariantSelectorNode.md)

  ↳↳ [`ProjectionEnumSelectorNode`](ProjectionEnumSelectorNode.md)

  ↳↳ [`ProjectionEnumMemberSelectorNode`](ProjectionEnumMemberSelectorNode.md)

  ↳↳ [`ProjectionParameterDeclarationNode`](ProjectionParameterDeclarationNode.md)

  ↳↳ [`ProjectionExpressionStatementNode`](ProjectionExpressionStatementNode.md)

  ↳↳ [`ProjectionLogicalExpressionNode`](ProjectionLogicalExpressionNode.md)

  ↳↳ [`ProjectionRelationalExpressionNode`](ProjectionRelationalExpressionNode.md)

  ↳↳ [`ProjectionEqualityExpressionNode`](ProjectionEqualityExpressionNode.md)

  ↳↳ [`ProjectionArithmeticExpressionNode`](ProjectionArithmeticExpressionNode.md)

  ↳↳ [`ProjectionUnaryExpressionNode`](ProjectionUnaryExpressionNode.md)

  ↳↳ [`ProjectionCallExpressionNode`](ProjectionCallExpressionNode.md)

  ↳↳ [`ProjectionMemberExpressionNode`](ProjectionMemberExpressionNode.md)

  ↳↳ [`ProjectionModelExpressionNode`](ProjectionModelExpressionNode.md)

  ↳↳ [`ProjectionTupleExpressionNode`](ProjectionTupleExpressionNode.md)

  ↳↳ [`ProjectionModelPropertyNode`](ProjectionModelPropertyNode.md)

  ↳↳ [`ProjectionModelSpreadPropertyNode`](ProjectionModelSpreadPropertyNode.md)

  ↳↳ [`ProjectionIfExpressionNode`](ProjectionIfExpressionNode.md)

  ↳↳ [`ProjectionBlockExpressionNode`](ProjectionBlockExpressionNode.md)

  ↳↳ [`ProjectionLambdaExpressionNode`](ProjectionLambdaExpressionNode.md)

  ↳↳ [`ProjectionLambdaParameterDeclarationNode`](ProjectionLambdaParameterDeclarationNode.md)

  ↳↳ [`ProjectionNode`](ProjectionNode.md)

  ↳↳ [`ProjectionStatementNode`](ProjectionStatementNode.md)

  ↳↳ [`ProjectionDecoratorReferenceExpressionNode`](ProjectionDecoratorReferenceExpressionNode.md)

  ↳↳ [`DocNode`](DocNode.md)

  ↳↳ [`DocTagBaseNode`](DocTagBaseNode.md)

  ↳↳ [`DocTextNode`](DocTextNode.md)

  ↳↳ [`JsSourceFileNode`](JsSourceFileNode.md)

## Table of contents

### Properties

- [directives](BaseNode.md#directives)
- [docs](BaseNode.md#docs)
- [end](BaseNode.md#end)
- [flags](BaseNode.md#flags)
- [kind](BaseNode.md#kind)
- [parent](BaseNode.md#parent)
- [pos](BaseNode.md#pos)
- [symbol](BaseNode.md#symbol)

## Properties

### directives

• `Optional` `Readonly` **directives**: readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[]

___

### docs

• `Optional` `Readonly` **docs**: readonly [`DocNode`](DocNode.md)[]

___

### end

• `Readonly` **end**: `number`

The ending position measured in UTF-16 code units from the start of the
full string. Exclusive.

#### Inherited from

[TextRange](TextRange.md).[end](TextRange.md#end)

___

### flags

• `Readonly` **flags**: [`NodeFlags`](../enums/NodeFlags.md)

___

### kind

• `Readonly` **kind**: [`SyntaxKind`](../enums/SyntaxKind.md)

___

### parent

• `Optional` `Readonly` **parent**: [`Node`](../index.md#node)

___

### pos

• `Readonly` **pos**: `number`

The starting position of the ranger measured in UTF-16 code units from the
start of the full string. Inclusive.

#### Inherited from

[TextRange](TextRange.md).[pos](TextRange.md#pos)

___

### symbol

• `Readonly` **symbol**: [`Sym`](Sym.md)

Could be undefined but making this optional creates a lot of noise. In practice,
you will likely only access symbol in cases where you know the node has a symbol.
