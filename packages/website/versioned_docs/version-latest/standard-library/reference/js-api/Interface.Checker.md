---
jsApi: true
title: "[I] Checker"

---
## Properties

| Property | Type |
| :------ | :------ |
| `anyType` | [`UnknownType`](Interface.UnknownType.md) |
| `errorType` | [`ErrorType`](Interface.ErrorType.md) |
| `neverType` | [`NeverType`](Interface.NeverType.md) |
| `typePrototype` | `TypePrototype` |
| `voidType` | [`VoidType`](Interface.VoidType.md) |

## Methods

### checkProgram

```ts
checkProgram(): void
```

#### Returns

`void`

***

### checkSourceFile

```ts
checkSourceFile(file): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `file` | [`TypeSpecScriptNode`](Interface.TypeSpecScriptNode.md) |

#### Returns

`void`

***

### cloneType

```ts
cloneType<T>(type, additionalProps?): T
```

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* [`Type`](Type.Type.md) |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `T` |
| `additionalProps`? | \{ [P in string \| number \| symbol]?: T[P] } |

#### Returns

`T`

***

### createAndFinishType

```ts
createAndFinishType<T>(typeDef): T & TypePrototype
```

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* [`CreateTypeProps`](Type.CreateTypeProps.md) |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `typeDef` | `T` |

#### Returns

`T` & `TypePrototype`

***

### createFunctionType

```ts
createFunctionType(fn): FunctionType
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `fn` | (...`args`) => [`Type`](Type.Type.md) |

#### Returns

[`FunctionType`](Interface.FunctionType.md)

***

### createLiteralType

```ts
createLiteralType(value, node?): StringLiteral
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `string` |
| `node`? | [`StringLiteralNode`](Interface.StringLiteralNode.md) |

#### Returns

[`StringLiteral`](Interface.StringLiteral.md)

```ts
createLiteralType(value, node?): NumericLiteral
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `number` |
| `node`? | [`NumericLiteralNode`](Interface.NumericLiteralNode.md) |

#### Returns

[`NumericLiteral`](Interface.NumericLiteral.md)

```ts
createLiteralType(value, node?): BooleanLiteral
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `boolean` |
| `node`? | [`BooleanLiteralNode`](Interface.BooleanLiteralNode.md) |

#### Returns

[`BooleanLiteral`](Interface.BooleanLiteral.md)

```ts
createLiteralType(value, node?): StringLiteral | NumericLiteral | BooleanLiteral
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `string` \| `number` \| `boolean` |
| `node`? | [`StringLiteralNode`](Interface.StringLiteralNode.md) \| [`NumericLiteralNode`](Interface.NumericLiteralNode.md) \| [`BooleanLiteralNode`](Interface.BooleanLiteralNode.md) |

#### Returns

[`StringLiteral`](Interface.StringLiteral.md) \| [`NumericLiteral`](Interface.NumericLiteral.md) \| [`BooleanLiteral`](Interface.BooleanLiteral.md)

```ts
createLiteralType(value, node?): StringLiteral | NumericLiteral | BooleanLiteral
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `string` \| `number` \| `boolean` |
| `node`? | [`StringLiteralNode`](Interface.StringLiteralNode.md) \| [`NumericLiteralNode`](Interface.NumericLiteralNode.md) \| [`BooleanLiteralNode`](Interface.BooleanLiteralNode.md) |

#### Returns

[`StringLiteral`](Interface.StringLiteral.md) \| [`NumericLiteral`](Interface.NumericLiteral.md) \| [`BooleanLiteral`](Interface.BooleanLiteral.md)

***

### createType

```ts
createType<T>(typeDef): T & TypePrototype & {isFinished: boolean;}
```

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* [`CreateTypeProps`](Type.CreateTypeProps.md) |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `typeDef` | `T` |

#### Returns

`T` & `TypePrototype` & \{`isFinished`: `boolean`;}

***

### evalProjection

```ts
evalProjection(
  node,
  target,
  args): Type
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`ProjectionNode`](Interface.ProjectionNode.md) |
| `target` | [`Type`](Type.Type.md) |
| `args` | [`Type`](Type.Type.md)[] |

#### Returns

[`Type`](Type.Type.md)

***

### finishType

```ts
finishType<T>(typeDef): T
```

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* [`Type`](Type.Type.md) |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `typeDef` | `T` |

#### Returns

`T`

***

### getGlobalNamespaceNode

```ts
getGlobalNamespaceNode(): NamespaceStatementNode
```

#### Returns

[`NamespaceStatementNode`](Interface.NamespaceStatementNode.md)

***

### getGlobalNamespaceType

```ts
getGlobalNamespaceType(): Namespace
```

#### Returns

[`Namespace`](Interface.Namespace.md)

***

### getLiteralType

```ts
getLiteralType(node): StringLiteral
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`StringLiteralNode`](Interface.StringLiteralNode.md) |

#### Returns

[`StringLiteral`](Interface.StringLiteral.md)

```ts
getLiteralType(node): NumericLiteral
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`NumericLiteralNode`](Interface.NumericLiteralNode.md) |

#### Returns

[`NumericLiteral`](Interface.NumericLiteral.md)

```ts
getLiteralType(node): BooleanLiteral
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`BooleanLiteralNode`](Interface.BooleanLiteralNode.md) |

#### Returns

[`BooleanLiteral`](Interface.BooleanLiteral.md)

```ts
getLiteralType(node): LiteralType
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`LiteralNode`](Type.LiteralNode.md) |

#### Returns

[`LiteralType`](Type.LiteralType.md)

***

### getMergedSymbol

```ts
getMergedSymbol(sym): undefined | Sym
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `sym` | `undefined` \| [`Sym`](Interface.Sym.md) |

#### Returns

`undefined` \| [`Sym`](Interface.Sym.md)

***

### getNamespaceString

```ts
getNamespaceString(type, options?): string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `undefined` \| [`Namespace`](Interface.Namespace.md) |
| `options`? | [`TypeNameOptions`](Interface.TypeNameOptions.md) |

#### Returns

`string`

#### Deprecated

use `import { getNamespaceFullName } from "@typespec/compiler";`

***

### getStdType

```ts
getStdType<T>(name): StdTypes[T]
```

Std type

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* [`IntrinsicScalarName`](Type.IntrinsicScalarName.md) \| `"Array"` \| `"Record"` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `name` | `T` | Name |

#### Returns

[`StdTypes`](Type.StdTypes.md)[`T`]

***

### getTypeForNode

```ts
getTypeForNode(node): Type
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`Node`](Type.Node.md) |

#### Returns

[`Type`](Type.Type.md)

***

### getTypeName

```ts
getTypeName(type, options?): string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | [`Type`](Type.Type.md) |
| `options`? | [`TypeNameOptions`](Interface.TypeNameOptions.md) |

#### Returns

`string`

#### Deprecated

use `import { getTypeName } from "@typespec/compiler";`

***

### isStdType

```ts
isStdType(type, stdType?): type is Scalar & Object
```

Check if the given type is one of the built-in standard TypeSpec Types.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `type` | [`Scalar`](Interface.Scalar.md) | Type to check |
| `stdType`? | [`IntrinsicScalarName`](Type.IntrinsicScalarName.md) | If provided check is that standard type |

#### Returns

`type is Scalar & Object`

```ts
isStdType(type, stdType?): type is Type & Object
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | [`Type`](Type.Type.md) |
| `stdType`? | [`IntrinsicScalarName`](Type.IntrinsicScalarName.md) \| `"Array"` \| `"Record"` |

#### Returns

`type is Type & Object`

***

### isTypeAssignableTo

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
| `source` | [`Type`](Type.Type.md) \| [`ValueType`](Interface.ValueType.md) | Source type, should be assignable to the target. |
| `target` | [`Type`](Type.Type.md) \| [`ValueType`](Interface.ValueType.md) | Target type |
| `diagnosticTarget` | [`DiagnosticTarget`](Type.DiagnosticTarget.md) | Target for the diagnostic, unless something better can be inferred. |

#### Returns

[`boolean`, *readonly* [`Diagnostic`](Interface.Diagnostic.md)[]]

[related, list of diagnostics]

***

### mergeSourceFile

```ts
mergeSourceFile(file): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `file` | [`TypeSpecScriptNode`](Interface.TypeSpecScriptNode.md) \| [`JsSourceFileNode`](Interface.JsSourceFileNode.md) |

#### Returns

`void`

***

### project

```ts
project(
  target,
  projection,
  args?): Type
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `target` | [`Type`](Type.Type.md) |
| `projection` | [`ProjectionNode`](Interface.ProjectionNode.md) |
| `args`? | (`string` \| `number` \| `boolean` \| [`Type`](Type.Type.md))[] |

#### Returns

[`Type`](Type.Type.md)

***

### resolveCompletions

```ts
resolveCompletions(node): Map< string, TypeSpecCompletionItem >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`IdentifierNode`](Interface.IdentifierNode.md) |

#### Returns

`Map`< `string`, [`TypeSpecCompletionItem`](Interface.TypeSpecCompletionItem.md) \>

***

### resolveIdentifier

```ts
resolveIdentifier(node): undefined | Sym
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | [`IdentifierNode`](Interface.IdentifierNode.md) |

#### Returns

`undefined` \| [`Sym`](Interface.Sym.md)

***

### resolveTypeReference

```ts
resolveTypeReference(node): [undefined | Type, readonly Diagnostic[]]
```

Check and resolve a type for the given type reference node.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `node` | [`TypeReferenceNode`](Interface.TypeReferenceNode.md) | Node. |

#### Returns

[`undefined` \| [`Type`](Type.Type.md), *readonly* [`Diagnostic`](Interface.Diagnostic.md)[]]

Resolved type and diagnostics if there was an error.

***

### setUsingsForFile

```ts
setUsingsForFile(file): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `file` | [`TypeSpecScriptNode`](Interface.TypeSpecScriptNode.md) |

#### Returns

`void`
