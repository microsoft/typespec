---
jsApi: true
title: "[I] Checker"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `anyType` | [`UnknownType`](UnknownType.md) | - |
| `errorType` | [`ErrorType`](ErrorType.md) | - |
| `neverType` | [`NeverType`](NeverType.md) | - |
| `typePrototype` | `TypePrototype` | - |
| `voidType` | [`VoidType`](VoidType.md) | - |

## Methods

### checkProgram()

```ts
checkProgram(): void
```

***

### checkSourceFile()

```ts
checkSourceFile(file): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `file` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) |

***

### cloneType()

```ts
cloneType<T>(type, additionalProps?): T
```

#### Type parameters

| Parameter |
| :------ |
| `T` extends [`Type`](../type-aliases/Type.md) |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `T` |
| `additionalProps`? | `{ [P in string | number | symbol]?: T[P] }` |

***

### createAndFinishType()

```ts
createAndFinishType<T>(typeDef): T & TypePrototype
```

#### Type parameters

| Parameter |
| :------ |
| `T` extends [`CreateTypeProps`](../type-aliases/CreateTypeProps.md) |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `typeDef` | `T` |

***

### createFunctionType()

```ts
createFunctionType(fn): FunctionType
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `fn` | (...`args`) => [`Type`](../type-aliases/Type.md) |

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

#### createLiteralType(value, node)

```ts
createLiteralType(value, node?): NumericLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `number` |
| `node`? | [`NumericLiteralNode`](NumericLiteralNode.md) |

#### createLiteralType(value, node)

```ts
createLiteralType(value, node?): BooleanLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `boolean` |
| `node`? | [`BooleanLiteralNode`](BooleanLiteralNode.md) |

#### createLiteralType(value, node)

```ts
createLiteralType(value, node?): StringLiteral | NumericLiteral | BooleanLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `string` \| `number` \| `boolean` |
| `node`? | [`StringLiteralNode`](StringLiteralNode.md) \| [`NumericLiteralNode`](NumericLiteralNode.md) \| [`BooleanLiteralNode`](BooleanLiteralNode.md) |

#### createLiteralType(value, node)

```ts
createLiteralType(value, node?): StringLiteral | NumericLiteral | BooleanLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `string` \| `number` \| `boolean` |
| `node`? | [`StringLiteralNode`](StringLiteralNode.md) \| [`NumericLiteralNode`](NumericLiteralNode.md) \| [`BooleanLiteralNode`](BooleanLiteralNode.md) |

***

### createType()

```ts
createType<T>(typeDef): T & TypePrototype & object
```

#### Type parameters

| Parameter |
| :------ |
| `T` extends [`CreateTypeProps`](../type-aliases/CreateTypeProps.md) |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `typeDef` | `T` |

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

***

### finishType()

```ts
finishType<T>(typeDef): T
```

#### Type parameters

| Parameter |
| :------ |
| `T` extends [`Type`](../type-aliases/Type.md) |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `typeDef` | `T` |

***

### getGlobalNamespaceNode()

```ts
getGlobalNamespaceNode(): NamespaceStatementNode
```

***

### getGlobalNamespaceType()

```ts
getGlobalNamespaceType(): Namespace
```

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

#### getLiteralType(node)

```ts
getLiteralType(node): NumericLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`NumericLiteralNode`](NumericLiteralNode.md) |

#### getLiteralType(node)

```ts
getLiteralType(node): BooleanLiteral
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`BooleanLiteralNode`](BooleanLiteralNode.md) |

#### getLiteralType(node)

```ts
getLiteralType(node): LiteralType
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`LiteralNode`](../type-aliases/LiteralNode.md) |

***

### getMergedSymbol()

```ts
getMergedSymbol(sym): undefined | Sym
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `sym` | `undefined` \| [`Sym`](Sym.md) |

***

### getNamespaceString()

```ts
getNamespaceString(type, options?): string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `undefined` \| [`Namespace`](Namespace.md) |
| `options`? | [`TypeNameOptions`](TypeNameOptions.md) |

#### Returns

#### Deprecated

use `import { getNamespaceFullName } from "@typespec/compiler";`

***

### getStdType()

```ts
getStdType<T>(name): StdTypes[T]
```

Std type

#### Type parameters

| Parameter |
| :------ |
| `T` extends [`IntrinsicScalarName`](../type-aliases/IntrinsicScalarName.md) \| `"Array"` \| `"Record"` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `name` | `T` | Name |

***

### getTypeForNode()

```ts
getTypeForNode(node): Type
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`Node`](../type-aliases/Node.md) |

***

### getTypeName()

```ts
getTypeName(type, options?): string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | [`Type`](../type-aliases/Type.md) |
| `options`? | [`TypeNameOptions`](TypeNameOptions.md) |

#### Returns

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

#### isStdType(type, stdType)

```ts
isStdType(type, stdType?): type is Type & Object
```

##### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | [`Type`](../type-aliases/Type.md) |
| `stdType`? | [`IntrinsicScalarName`](../type-aliases/IntrinsicScalarName.md) \| `"Array"` \| `"Record"` |

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
| `source` | [`Type`](../type-aliases/Type.md) \| [`ValueType`](ValueType.md) | Source type, should be assignable to the target. |
| `target` | [`Type`](../type-aliases/Type.md) \| [`ValueType`](ValueType.md) | Target type |
| `diagnosticTarget` | [`DiagnosticTarget`](../type-aliases/DiagnosticTarget.md) | Target for the diagnostic, unless something better can be inferred. |

#### Returns

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

***

### resolveCompletions()

```ts
resolveCompletions(node): Map<string, TypeSpecCompletionItem>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`IdentifierNode`](IdentifierNode.md) |

***

### resolveIdentifier()

```ts
resolveIdentifier(node): undefined | Sym
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`IdentifierNode`](IdentifierNode.md) |

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
