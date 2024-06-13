---
jsApi: true
title: "[I] Checker"

---
## Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `anyType` | `readonly` | [`UnknownType`](UnknownType.md) |
| `errorType` | `readonly` | [`ErrorType`](ErrorType.md) |
| `neverType` | `readonly` | [`NeverType`](NeverType.md) |
| `nullType` | `readonly` | [`NullType`](NullType.md) |
| `typePrototype` | `public` | `TypePrototype` |
| `voidType` | `readonly` | [`VoidType`](VoidType.md) |

## Methods

### checkProgram()

```ts
checkProgram(): void
```

#### Returns

`void`

***

### checkSourceFile()

```ts
checkSourceFile(file): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `file` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) |

#### Returns

`void`

***

### cloneType()

```ts
cloneType<T>(type, additionalProps?): T
```

#### Type parameters

| Type parameter |
| :------ |
| `T` *extends* [`Type`](../type-aliases/Type.md) |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `T` |
| `additionalProps`? | \{ \[P in string \| number \| symbol\]?: T\[P\] \} |

#### Returns

`T`

***

### createAndFinishType()

```ts
createAndFinishType<T>(typeDef): T & TypePrototype
```

#### Type parameters

| Type parameter |
| :------ |
| `T` *extends* [`CreateTypeProps`](../type-aliases/CreateTypeProps.md) |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `typeDef` | `T` |

#### Returns

`T` & `TypePrototype`

***

### createFunctionType()

```ts
createFunctionType(fn): FunctionType
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `fn` | (...`args`) => [`Type`](../type-aliases/Type.md) |

#### Returns

[`FunctionType`](FunctionType.md)

***

### createLiteralType()

#### createLiteralType(value, node)

```ts
createLiteralType(value, node?): StringLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `string` |
| `node`? | [`StringLiteralNode`](StringLiteralNode.md) |

##### Returns

[`StringLiteral`](StringLiteral.md)

#### createLiteralType(value, node)

```ts
createLiteralType(value, node?): NumericLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `number` |
| `node`? | [`NumericLiteralNode`](NumericLiteralNode.md) |

##### Returns

[`NumericLiteral`](NumericLiteral.md)

#### createLiteralType(value, node)

```ts
createLiteralType(value, node?): BooleanLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `boolean` |
| `node`? | [`BooleanLiteralNode`](BooleanLiteralNode.md) |

##### Returns

[`BooleanLiteral`](BooleanLiteral.md)

#### createLiteralType(value, node)

```ts
createLiteralType(value, node?): BooleanLiteral | NumericLiteral | StringLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `string` \| `number` \| `boolean` |
| `node`? | [`StringLiteralNode`](StringLiteralNode.md) \| [`NumericLiteralNode`](NumericLiteralNode.md) \| [`BooleanLiteralNode`](BooleanLiteralNode.md) |

##### Returns

[`BooleanLiteral`](BooleanLiteral.md) \| [`NumericLiteral`](NumericLiteral.md) \| [`StringLiteral`](StringLiteral.md)

#### createLiteralType(value, node)

```ts
createLiteralType(value, node?): BooleanLiteral | NumericLiteral | StringLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `string` \| `number` \| `boolean` |
| `node`? | [`StringLiteralNode`](StringLiteralNode.md) \| [`NumericLiteralNode`](NumericLiteralNode.md) \| [`BooleanLiteralNode`](BooleanLiteralNode.md) |

##### Returns

[`BooleanLiteral`](BooleanLiteral.md) \| [`NumericLiteral`](NumericLiteral.md) \| [`StringLiteral`](StringLiteral.md)

***

### createType()

```ts
createType<T>(typeDef): T & TypePrototype & object
```

#### Type parameters

| Type parameter |
| :------ |
| `T` *extends* [`CreateTypeProps`](../type-aliases/CreateTypeProps.md) |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `typeDef` | `T` |

#### Returns

`T` & `TypePrototype` & `object`

***

### evalProjection()

```ts
evalProjection(
   node, 
   target, 
   args): Type
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`ProjectionNode`](ProjectionNode.md) |
| `target` | [`Type`](../type-aliases/Type.md) |
| `args` | [`Type`](../type-aliases/Type.md)[] |

#### Returns

[`Type`](../type-aliases/Type.md)

***

### finishType()

```ts
finishType<T>(typeDef): T
```

#### Type parameters

| Type parameter |
| :------ |
| `T` *extends* [`Type`](../type-aliases/Type.md) |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `typeDef` | `T` |

#### Returns

`T`

***

### getGlobalNamespaceNode()

```ts
getGlobalNamespaceNode(): NamespaceStatementNode
```

#### Returns

[`NamespaceStatementNode`](NamespaceStatementNode.md)

***

### getGlobalNamespaceType()

```ts
getGlobalNamespaceType(): Namespace
```

#### Returns

[`Namespace`](Namespace.md)

***

### getLiteralType()

#### getLiteralType(node)

```ts
getLiteralType(node): StringLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`StringLiteralNode`](StringLiteralNode.md) |

##### Returns

[`StringLiteral`](StringLiteral.md)

#### getLiteralType(node)

```ts
getLiteralType(node): NumericLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`NumericLiteralNode`](NumericLiteralNode.md) |

##### Returns

[`NumericLiteral`](NumericLiteral.md)

#### getLiteralType(node)

```ts
getLiteralType(node): BooleanLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`BooleanLiteralNode`](BooleanLiteralNode.md) |

##### Returns

[`BooleanLiteral`](BooleanLiteral.md)

#### getLiteralType(node)

```ts
getLiteralType(node): LiteralType
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`LiteralNode`](../type-aliases/LiteralNode.md) |

##### Returns

[`LiteralType`](../type-aliases/LiteralType.md)

***

### getMergedSymbol()

```ts
getMergedSymbol(sym): undefined | Sym
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `sym` | `undefined` \| [`Sym`](Sym.md) |

#### Returns

`undefined` \| [`Sym`](Sym.md)

***

### ~~getNamespaceString()~~

```ts
getNamespaceString(type, options?): string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `undefined` \| [`Namespace`](Namespace.md) |
| `options`? | [`TypeNameOptions`](TypeNameOptions.md) |

#### Returns

`string`

#### Deprecated

use `import { getNamespaceFullName } from "@typespec/compiler";`

***

### getStdType()

```ts
getStdType<T>(name): StdTypes[T]
```

Std type

#### Type parameters

| Type parameter |
| :------ |
| `T` *extends* `"Array"` \| [`IntrinsicScalarName`](../type-aliases/IntrinsicScalarName.md) \| `"Record"` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `name` | `T` | Name |

#### Returns

[`StdTypes`](../type-aliases/StdTypes.md)\[`T`\]

***

### getTypeForNode()

```ts
getTypeForNode(node): Type
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`Node`](../type-aliases/Node.md) |

#### Returns

[`Type`](../type-aliases/Type.md)

***

### ~~getTypeName()~~

```ts
getTypeName(type, options?): string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | [`Type`](../type-aliases/Type.md) |
| `options`? | [`TypeNameOptions`](TypeNameOptions.md) |

#### Returns

`string`

#### Deprecated

use `import { getTypeName } from "@typespec/compiler";`

***

### isStdType()

#### isStdType(type, stdType)

```ts
isStdType(type, stdType?): type is Scalar & Object
```

Check if the given type is one of the built-in standard TypeSpec Types.

##### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `type` | [`Scalar`](Scalar.md) | Type to check |
| `stdType`? | [`IntrinsicScalarName`](../type-aliases/IntrinsicScalarName.md) | If provided check is that standard type |

##### Returns

`type is Scalar & Object`

#### isStdType(type, stdType)

```ts
isStdType(type, stdType?): type is Type & Object
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | [`Type`](../type-aliases/Type.md) |
| `stdType`? | `"Array"` \| [`IntrinsicScalarName`](../type-aliases/IntrinsicScalarName.md) \| `"Record"` |

##### Returns

`type is Type & Object`

***

### isTypeAssignableTo()

```ts
isTypeAssignableTo(
   source, 
   target, 
   diagnosticTarget): [boolean, readonly Diagnostic[]]
```

Check if the source type can be assigned to the target type.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `source` | [`Entity`](../type-aliases/Entity.md) | Source type, should be assignable to the target. |
| `target` | [`Entity`](../type-aliases/Entity.md) | Target type |
| `diagnosticTarget` | [`DiagnosticTarget`](../type-aliases/DiagnosticTarget.md) | Target for the diagnostic, unless something better can be inferred. |

#### Returns

[`boolean`, readonly [`Diagnostic`](Diagnostic.md)[]]

[related, list of diagnostics]

***

### mergeSourceFile()

```ts
mergeSourceFile(file): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `file` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) \| [`JsSourceFileNode`](JsSourceFileNode.md) |

#### Returns

`void`

***

### project()

```ts
project(
   target, 
   projection, 
   args?): Type
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `target` | [`Type`](../type-aliases/Type.md) |
| `projection` | [`ProjectionNode`](ProjectionNode.md) |
| `args`? | (`string` \| `number` \| `boolean` \| [`Type`](../type-aliases/Type.md))[] |

#### Returns

[`Type`](../type-aliases/Type.md)

***

### resolveCompletions()

```ts
resolveCompletions(node): Map<string, TypeSpecCompletionItem>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`IdentifierNode`](IdentifierNode.md) |

#### Returns

`Map`<`string`, [`TypeSpecCompletionItem`](TypeSpecCompletionItem.md)\>

***

### resolveIdentifier()

```ts
resolveIdentifier(node): undefined | Sym
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`IdentifierNode`](IdentifierNode.md) |

#### Returns

`undefined` \| [`Sym`](Sym.md)

***

### resolveTypeReference()

```ts
resolveTypeReference(node): [undefined | Type, readonly Diagnostic[]]
```

Check and resolve a type for the given type reference node.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `node` | [`TypeReferenceNode`](TypeReferenceNode.md) | Node. |

#### Returns

[`undefined` \| [`Type`](../type-aliases/Type.md), readonly [`Diagnostic`](Diagnostic.md)[]]

Resolved type and diagnostics if there was an error.

***

### setUsingsForFile()

```ts
setUsingsForFile(file): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `file` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) |

#### Returns

`void`
