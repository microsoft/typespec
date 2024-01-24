---
jsApi: true
title: "[F] resolveEncodedName"

---
```ts
resolveEncodedName(
   program, 
   target, 
   mimeType): string
```

Resolve the encoded name for the given type when serialized to the given mime type.
If a specific value was provided by `@encodedName` decorator for that mime type it will return that otherwise it will return the name of the type.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | - |
| `target` | `Object` | - |
| `target.instantiationParameters`? | [`Type`](../type-aliases/Type.md)[] | - |
| `target.isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) |
| `target.kind` |    \| `"Model"`   \| `"ModelProperty"`   \| `"Scalar"`   \| `"Interface"`   \| `"Enum"`   \| `"EnumMember"`   \| `"TemplateParameter"`   \| `"Namespace"`   \| `"Operation"`   \| `"String"`   \| `"Number"`   \| `"Boolean"`   \| `"StringTemplate"`   \| `"StringTemplateSpan"`   \| `"Tuple"`   \| `"Union"`   \| `"UnionVariant"`   \| `"Intrinsic"`   \| `"Function"`   \| `"Decorator"`   \| `"FunctionParameter"`   \| `"Object"`   \| `"Projection"` | - |
| `target.name` | `string` | - |
| `target.node`? |    \| [`StringTemplateHeadNode`](../interfaces/StringTemplateHeadNode.md)   \| [`StringTemplateMiddleNode`](../interfaces/StringTemplateMiddleNode.md)   \| [`StringTemplateTailNode`](../interfaces/StringTemplateTailNode.md)   \| [`ArrayExpressionNode`](../interfaces/ArrayExpressionNode.md)   \| [`MemberExpressionNode`](../interfaces/MemberExpressionNode.md)   \| [`ModelExpressionNode`](../interfaces/ModelExpressionNode.md)   \| [`TupleExpressionNode`](../interfaces/TupleExpressionNode.md)   \| [`UnionExpressionNode`](../interfaces/UnionExpressionNode.md)   \| [`IntersectionExpressionNode`](../interfaces/IntersectionExpressionNode.md)   \| [`TypeReferenceNode`](../interfaces/TypeReferenceNode.md)   \| [`ValueOfExpressionNode`](../interfaces/ValueOfExpressionNode.md)   \| [`StringLiteralNode`](../interfaces/StringLiteralNode.md)   \| [`NumericLiteralNode`](../interfaces/NumericLiteralNode.md)   \| [`BooleanLiteralNode`](../interfaces/BooleanLiteralNode.md)   \| [`StringTemplateExpressionNode`](../interfaces/StringTemplateExpressionNode.md)   \| [`VoidKeywordNode`](../interfaces/VoidKeywordNode.md)   \| [`NeverKeywordNode`](../interfaces/NeverKeywordNode.md)   \| [`AnyKeywordNode`](../interfaces/AnyKeywordNode.md)   \| [`ModelStatementNode`](../interfaces/ModelStatementNode.md)   \| [`ProjectionModelExpressionNode`](../interfaces/ProjectionModelExpressionNode.md)   \| [`InterfaceStatementNode`](../interfaces/InterfaceStatementNode.md)   \| [`OperationStatementNode`](../interfaces/OperationStatementNode.md)   \| [`UnionStatementNode`](../interfaces/UnionStatementNode.md)   \| [`TypeSpecScriptNode`](../interfaces/TypeSpecScriptNode.md)   \| [`JsSourceFileNode`](../interfaces/JsSourceFileNode.md)   \| [`JsNamespaceDeclarationNode`](../interfaces/JsNamespaceDeclarationNode.md)   \| [`TemplateArgumentNode`](../interfaces/TemplateArgumentNode.md)   \| [`TemplateParameterDeclarationNode`](../interfaces/TemplateParameterDeclarationNode.md)   \| [`ProjectionParameterDeclarationNode`](../interfaces/ProjectionParameterDeclarationNode.md)   \| [`ProjectionLambdaParameterDeclarationNode`](../interfaces/ProjectionLambdaParameterDeclarationNode.md)   \| [`ModelPropertyNode`](../interfaces/ModelPropertyNode.md)   \| [`UnionVariantNode`](../interfaces/UnionVariantNode.md)   \| [`OperationSignatureDeclarationNode`](../interfaces/OperationSignatureDeclarationNode.md)   \| [`OperationSignatureReferenceNode`](../interfaces/OperationSignatureReferenceNode.md)   \| [`EnumMemberNode`](../interfaces/EnumMemberNode.md)   \| [`EnumSpreadMemberNode`](../interfaces/EnumSpreadMemberNode.md)   \| [`ModelSpreadPropertyNode`](../interfaces/ModelSpreadPropertyNode.md)   \| [`DecoratorExpressionNode`](../interfaces/DecoratorExpressionNode.md)   \| [`DirectiveExpressionNode`](../interfaces/DirectiveExpressionNode.md)   \| [`ImportStatementNode`](../interfaces/ImportStatementNode.md)   \| [`ScalarStatementNode`](../interfaces/ScalarStatementNode.md)   \| [`NamespaceStatementNode`](../interfaces/NamespaceStatementNode.md)   \| [`UsingStatementNode`](../interfaces/UsingStatementNode.md)   \| [`EnumStatementNode`](../interfaces/EnumStatementNode.md)   \| [`AliasStatementNode`](../interfaces/AliasStatementNode.md)   \| [`DecoratorDeclarationStatementNode`](../interfaces/DecoratorDeclarationStatementNode.md)   \| [`FunctionDeclarationStatementNode`](../interfaces/FunctionDeclarationStatementNode.md)   \| [`AugmentDecoratorStatementNode`](../interfaces/AugmentDecoratorStatementNode.md)   \| [`EmptyStatementNode`](../interfaces/EmptyStatementNode.md)   \| [`InvalidStatementNode`](../interfaces/InvalidStatementNode.md)   \| [`ProjectionStatementNode`](../interfaces/ProjectionStatementNode.md)   \| [`FunctionParameterNode`](../interfaces/FunctionParameterNode.md)   \| [`StringTemplateSpanNode`](../interfaces/StringTemplateSpanNode.md)   \| [`ExternKeywordNode`](../interfaces/ExternKeywordNode.md)   \| [`DocNode`](../interfaces/DocNode.md)   \| [`DocTextNode`](../interfaces/DocTextNode.md)   \| [`DocReturnsTagNode`](../interfaces/DocReturnsTagNode.md)   \| [`DocErrorsTagNode`](../interfaces/DocErrorsTagNode.md)   \| [`DocParamTagNode`](../interfaces/DocParamTagNode.md)   \| [`DocTemplateTagNode`](../interfaces/DocTemplateTagNode.md)   \| [`DocUnknownTagNode`](../interfaces/DocUnknownTagNode.md)   \| [`ProjectionExpressionStatementNode`](../interfaces/ProjectionExpressionStatementNode.md)   \| [`ProjectionLogicalExpressionNode`](../interfaces/ProjectionLogicalExpressionNode.md)   \| [`ProjectionRelationalExpressionNode`](../interfaces/ProjectionRelationalExpressionNode.md)   \| [`ProjectionEqualityExpressionNode`](../interfaces/ProjectionEqualityExpressionNode.md)   \| [`ProjectionUnaryExpressionNode`](../interfaces/ProjectionUnaryExpressionNode.md)   \| [`ProjectionArithmeticExpressionNode`](../interfaces/ProjectionArithmeticExpressionNode.md)   \| [`ProjectionCallExpressionNode`](../interfaces/ProjectionCallExpressionNode.md)   \| [`ProjectionMemberExpressionNode`](../interfaces/ProjectionMemberExpressionNode.md)   \| [`ProjectionDecoratorReferenceExpressionNode`](../interfaces/ProjectionDecoratorReferenceExpressionNode.md)   \| [`ProjectionTupleExpressionNode`](../interfaces/ProjectionTupleExpressionNode.md)   \| [`ProjectionIfExpressionNode`](../interfaces/ProjectionIfExpressionNode.md)   \| [`ProjectionBlockExpressionNode`](../interfaces/ProjectionBlockExpressionNode.md)   \| [`ProjectionLambdaExpressionNode`](../interfaces/ProjectionLambdaExpressionNode.md)   \| [`IdentifierNode`](../interfaces/IdentifierNode.md)   \| [`ReturnExpressionNode`](../interfaces/ReturnExpressionNode.md)   \| [`ProjectionModelSelectorNode`](../interfaces/ProjectionModelSelectorNode.md)   \| [`ProjectionModelPropertySelectorNode`](../interfaces/ProjectionModelPropertySelectorNode.md)   \| [`ProjectionInterfaceSelectorNode`](../interfaces/ProjectionInterfaceSelectorNode.md)   \| [`ProjectionOperationSelectorNode`](../interfaces/ProjectionOperationSelectorNode.md)   \| [`ProjectionEnumSelectorNode`](../interfaces/ProjectionEnumSelectorNode.md)   \| [`ProjectionEnumMemberSelectorNode`](../interfaces/ProjectionEnumMemberSelectorNode.md)   \| [`ProjectionUnionSelectorNode`](../interfaces/ProjectionUnionSelectorNode.md)   \| [`ProjectionUnionVariantSelectorNode`](../interfaces/ProjectionUnionVariantSelectorNode.md)   \| [`ProjectionModelPropertyNode`](../interfaces/ProjectionModelPropertyNode.md)   \| [`ProjectionModelSpreadPropertyNode`](../interfaces/ProjectionModelSpreadPropertyNode.md)   \| [`ProjectionNode`](../interfaces/ProjectionNode.md) | - |
| `target.projectionBase`? | [`Type`](../type-aliases/Type.md) | - |
| `target.projectionSource`? | [`Type`](../type-aliases/Type.md) | - |
| `target.projector`? | [`Projector`](../interfaces/Projector.md) | - |
| `target.projections` | - |
| `target.projectionsByName` | - |
| `mimeType` | `string` | - |

## Returns

`string`

## Example

For the given
```tsp
model Certificate {
  @encodedName("application/json", "exp")
  @encodedName("application/xml", "expiry")
  expireAt: utcDateTime;

}
```

```ts
resolveEncodedName(program, type, "application/json") // exp
resolveEncodedName(program, type, "application/merge-patch+json") // exp
resolveEncodedName(program, type, "application/xml") // expireAt
resolveEncodedName(program, type, "application/yaml") // expiry
```
