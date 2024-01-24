---
jsApi: true
title: "[I] ProjectedNameView"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `program` | [`ProjectedProgram`](ProjectedProgram.md) | - |

## Methods

### getProjectedName()

```ts
getProjectedName(target): string
```

Get the name of the given entity in that scope.
If there is a projected name it returns that one otherwise return the original name.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `target` | `Object` | - |
| `target.instantiationParameters`? | [`Type`](../type-aliases/Type.md)[] | - |
| `target.isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) |
| `target.kind` |    \| `"Model"`   \| `"ModelProperty"`   \| `"Scalar"`   \| `"Interface"`   \| `"Enum"`   \| `"EnumMember"`   \| `"TemplateParameter"`   \| `"Namespace"`   \| `"Operation"`   \| `"String"`   \| `"Number"`   \| `"Boolean"`   \| `"StringTemplate"`   \| `"StringTemplateSpan"`   \| `"Tuple"`   \| `"Union"`   \| `"UnionVariant"`   \| `"Intrinsic"`   \| `"Function"`   \| `"Decorator"`   \| `"FunctionParameter"`   \| `"Object"`   \| `"Projection"` | - |
| `target.name` | `string` | - |
| `target.node`? |    \| [`StringTemplateHeadNode`](StringTemplateHeadNode.md)   \| [`StringTemplateMiddleNode`](StringTemplateMiddleNode.md)   \| [`StringTemplateTailNode`](StringTemplateTailNode.md)   \| [`ArrayExpressionNode`](ArrayExpressionNode.md)   \| [`MemberExpressionNode`](MemberExpressionNode.md)   \| [`ModelExpressionNode`](ModelExpressionNode.md)   \| [`TupleExpressionNode`](TupleExpressionNode.md)   \| [`UnionExpressionNode`](UnionExpressionNode.md)   \| [`IntersectionExpressionNode`](IntersectionExpressionNode.md)   \| [`TypeReferenceNode`](TypeReferenceNode.md)   \| [`ValueOfExpressionNode`](ValueOfExpressionNode.md)   \| [`StringLiteralNode`](StringLiteralNode.md)   \| [`NumericLiteralNode`](NumericLiteralNode.md)   \| [`BooleanLiteralNode`](BooleanLiteralNode.md)   \| [`StringTemplateExpressionNode`](StringTemplateExpressionNode.md)   \| [`VoidKeywordNode`](VoidKeywordNode.md)   \| [`NeverKeywordNode`](NeverKeywordNode.md)   \| [`AnyKeywordNode`](AnyKeywordNode.md)   \| [`ModelStatementNode`](ModelStatementNode.md)   \| [`ProjectionModelExpressionNode`](ProjectionModelExpressionNode.md)   \| [`InterfaceStatementNode`](InterfaceStatementNode.md)   \| [`OperationStatementNode`](OperationStatementNode.md)   \| [`UnionStatementNode`](UnionStatementNode.md)   \| [`TypeSpecScriptNode`](TypeSpecScriptNode.md)   \| [`JsSourceFileNode`](JsSourceFileNode.md)   \| [`JsNamespaceDeclarationNode`](JsNamespaceDeclarationNode.md)   \| [`TemplateArgumentNode`](TemplateArgumentNode.md)   \| [`TemplateParameterDeclarationNode`](TemplateParameterDeclarationNode.md)   \| [`ProjectionParameterDeclarationNode`](ProjectionParameterDeclarationNode.md)   \| [`ProjectionLambdaParameterDeclarationNode`](ProjectionLambdaParameterDeclarationNode.md)   \| [`ModelPropertyNode`](ModelPropertyNode.md)   \| [`UnionVariantNode`](UnionVariantNode.md)   \| [`OperationSignatureDeclarationNode`](OperationSignatureDeclarationNode.md)   \| [`OperationSignatureReferenceNode`](OperationSignatureReferenceNode.md)   \| [`EnumMemberNode`](EnumMemberNode.md)   \| [`EnumSpreadMemberNode`](EnumSpreadMemberNode.md)   \| [`ModelSpreadPropertyNode`](ModelSpreadPropertyNode.md)   \| [`DecoratorExpressionNode`](DecoratorExpressionNode.md)   \| [`DirectiveExpressionNode`](DirectiveExpressionNode.md)   \| [`ImportStatementNode`](ImportStatementNode.md)   \| [`ScalarStatementNode`](ScalarStatementNode.md)   \| [`NamespaceStatementNode`](NamespaceStatementNode.md)   \| [`UsingStatementNode`](UsingStatementNode.md)   \| [`EnumStatementNode`](EnumStatementNode.md)   \| [`AliasStatementNode`](AliasStatementNode.md)   \| [`DecoratorDeclarationStatementNode`](DecoratorDeclarationStatementNode.md)   \| [`FunctionDeclarationStatementNode`](FunctionDeclarationStatementNode.md)   \| [`AugmentDecoratorStatementNode`](AugmentDecoratorStatementNode.md)   \| [`EmptyStatementNode`](EmptyStatementNode.md)   \| [`InvalidStatementNode`](InvalidStatementNode.md)   \| [`ProjectionStatementNode`](ProjectionStatementNode.md)   \| [`FunctionParameterNode`](FunctionParameterNode.md)   \| [`StringTemplateSpanNode`](StringTemplateSpanNode.md)   \| [`ExternKeywordNode`](ExternKeywordNode.md)   \| [`DocNode`](DocNode.md)   \| [`DocTextNode`](DocTextNode.md)   \| [`DocReturnsTagNode`](DocReturnsTagNode.md)   \| [`DocErrorsTagNode`](DocErrorsTagNode.md)   \| [`DocParamTagNode`](DocParamTagNode.md)   \| [`DocTemplateTagNode`](DocTemplateTagNode.md)   \| [`DocUnknownTagNode`](DocUnknownTagNode.md)   \| [`ProjectionExpressionStatementNode`](ProjectionExpressionStatementNode.md)   \| [`ProjectionLogicalExpressionNode`](ProjectionLogicalExpressionNode.md)   \| [`ProjectionRelationalExpressionNode`](ProjectionRelationalExpressionNode.md)   \| [`ProjectionEqualityExpressionNode`](ProjectionEqualityExpressionNode.md)   \| [`ProjectionUnaryExpressionNode`](ProjectionUnaryExpressionNode.md)   \| [`ProjectionArithmeticExpressionNode`](ProjectionArithmeticExpressionNode.md)   \| [`ProjectionCallExpressionNode`](ProjectionCallExpressionNode.md)   \| [`ProjectionMemberExpressionNode`](ProjectionMemberExpressionNode.md)   \| [`ProjectionDecoratorReferenceExpressionNode`](ProjectionDecoratorReferenceExpressionNode.md)   \| [`ProjectionTupleExpressionNode`](ProjectionTupleExpressionNode.md)   \| [`ProjectionIfExpressionNode`](ProjectionIfExpressionNode.md)   \| [`ProjectionBlockExpressionNode`](ProjectionBlockExpressionNode.md)   \| [`ProjectionLambdaExpressionNode`](ProjectionLambdaExpressionNode.md)   \| [`IdentifierNode`](IdentifierNode.md)   \| [`ReturnExpressionNode`](ReturnExpressionNode.md)   \| [`ProjectionModelSelectorNode`](ProjectionModelSelectorNode.md)   \| [`ProjectionModelPropertySelectorNode`](ProjectionModelPropertySelectorNode.md)   \| [`ProjectionInterfaceSelectorNode`](ProjectionInterfaceSelectorNode.md)   \| [`ProjectionOperationSelectorNode`](ProjectionOperationSelectorNode.md)   \| [`ProjectionEnumSelectorNode`](ProjectionEnumSelectorNode.md)   \| [`ProjectionEnumMemberSelectorNode`](ProjectionEnumMemberSelectorNode.md)   \| [`ProjectionUnionSelectorNode`](ProjectionUnionSelectorNode.md)   \| [`ProjectionUnionVariantSelectorNode`](ProjectionUnionVariantSelectorNode.md)   \| [`ProjectionModelPropertyNode`](ProjectionModelPropertyNode.md)   \| [`ProjectionModelSpreadPropertyNode`](ProjectionModelSpreadPropertyNode.md)   \| [`ProjectionNode`](ProjectionNode.md) | - |
| `target.projectionBase`? | [`Type`](../type-aliases/Type.md) | - |
| `target.projectionSource`? | [`Type`](../type-aliases/Type.md) | - |
| `target.projector`? | [`Projector`](Projector.md) | - |
| `target.projections` | - |
| `target.projectionsByName` | - |

#### Returns

`string`
