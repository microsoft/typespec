[JS Api](../index.md) / Checker

# Interface: Checker

## Table of contents

### Properties

- [anyType](Checker.md#anytype)
- [errorType](Checker.md#errortype)
- [neverType](Checker.md#nevertype)
- [typePrototype](Checker.md#typeprototype)
- [voidType](Checker.md#voidtype)

### Methods

- [checkProgram](Checker.md#checkprogram)
- [checkSourceFile](Checker.md#checksourcefile)
- [cloneType](Checker.md#clonetype)
- [createAndFinishType](Checker.md#createandfinishtype)
- [createFunctionType](Checker.md#createfunctiontype)
- [createLiteralType](Checker.md#createliteraltype)
- [createType](Checker.md#createtype)
- [evalProjection](Checker.md#evalprojection)
- [finishType](Checker.md#finishtype)
- [getGlobalNamespaceNode](Checker.md#getglobalnamespacenode)
- [getGlobalNamespaceType](Checker.md#getglobalnamespacetype)
- [getLiteralType](Checker.md#getliteraltype)
- [getMergedSymbol](Checker.md#getmergedsymbol)
- [getNamespaceString](Checker.md#getnamespacestring)
- [getStdType](Checker.md#getstdtype)
- [getTypeForNode](Checker.md#gettypefornode)
- [getTypeName](Checker.md#gettypename)
- [isStdType](Checker.md#isstdtype)
- [isTypeAssignableTo](Checker.md#istypeassignableto)
- [mergeSourceFile](Checker.md#mergesourcefile)
- [project](Checker.md#project)
- [resolveCompletions](Checker.md#resolvecompletions)
- [resolveIdentifier](Checker.md#resolveidentifier)
- [resolveTypeReference](Checker.md#resolvetypereference)
- [setUsingsForFile](Checker.md#setusingsforfile)

## Properties

### anyType

• **anyType**: [`UnknownType`](UnknownType.md)

___

### errorType

• **errorType**: [`ErrorType`](ErrorType.md)

___

### neverType

• **neverType**: [`NeverType`](NeverType.md)

___

### typePrototype

• **typePrototype**: `TypePrototype`

___

### voidType

• **voidType**: [`VoidType`](VoidType.md)

## Methods

### checkProgram

▸ **checkProgram**(): `void`

#### Returns

`void`

___

### checkSourceFile

▸ **checkSourceFile**(`file`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `file` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) |

#### Returns

`void`

___

### cloneType

▸ **cloneType**<`T`\>(`type`, `additionalProps?`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Type`](../index.md#type) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `T` |
| `additionalProps?` | { [P in string \| number \| symbol]?: T[P] } |

#### Returns

`T`

___

### createAndFinishType

▸ **createAndFinishType**<`U`\>(`typeDef`): `U` & `TypePrototype`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `U` | extends `Omit`<[`Type`](../index.md#type), keyof `TypePrototype`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `typeDef` | `U` |

#### Returns

`U` & `TypePrototype`

___

### createFunctionType

▸ **createFunctionType**(`fn`): [`FunctionType`](FunctionType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (...`args`: [`Type`](../index.md#type)[]) => [`Type`](../index.md#type) |

#### Returns

[`FunctionType`](FunctionType.md)

___

### createLiteralType

▸ **createLiteralType**(`value`, `node?`): [`StringLiteral`](StringLiteral.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |
| `node?` | [`StringLiteralNode`](StringLiteralNode.md) |

#### Returns

[`StringLiteral`](StringLiteral.md)

▸ **createLiteralType**(`value`, `node?`): [`NumericLiteral`](NumericLiteral.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `number` |
| `node?` | [`NumericLiteralNode`](NumericLiteralNode.md) |

#### Returns

[`NumericLiteral`](NumericLiteral.md)

▸ **createLiteralType**(`value`, `node?`): [`BooleanLiteral`](BooleanLiteral.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `boolean` |
| `node?` | [`BooleanLiteralNode`](BooleanLiteralNode.md) |

#### Returns

[`BooleanLiteral`](BooleanLiteral.md)

▸ **createLiteralType**(`value`, `node?`): [`StringLiteral`](StringLiteral.md) \| [`NumericLiteral`](NumericLiteral.md) \| [`BooleanLiteral`](BooleanLiteral.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` \| `number` \| `boolean` |
| `node?` | [`StringLiteralNode`](StringLiteralNode.md) \| [`NumericLiteralNode`](NumericLiteralNode.md) \| [`BooleanLiteralNode`](BooleanLiteralNode.md) |

#### Returns

[`StringLiteral`](StringLiteral.md) \| [`NumericLiteral`](NumericLiteral.md) \| [`BooleanLiteral`](BooleanLiteral.md)

▸ **createLiteralType**(`value`, `node?`): [`StringLiteral`](StringLiteral.md) \| [`NumericLiteral`](NumericLiteral.md) \| [`BooleanLiteral`](BooleanLiteral.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` \| `number` \| `boolean` |
| `node?` | [`StringLiteralNode`](StringLiteralNode.md) \| [`NumericLiteralNode`](NumericLiteralNode.md) \| [`BooleanLiteralNode`](BooleanLiteralNode.md) |

#### Returns

[`StringLiteral`](StringLiteral.md) \| [`NumericLiteral`](NumericLiteral.md) \| [`BooleanLiteral`](BooleanLiteral.md)

___

### createType

▸ **createType**<`T`\>(`typeDef`): `T` & `TypePrototype`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `typeDef` | `T` |

#### Returns

`T` & `TypePrototype`

___

### evalProjection

▸ **evalProjection**(`node`, `target`, `args`): [`Type`](../index.md#type)

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | [`ProjectionNode`](ProjectionNode.md) |
| `target` | [`Type`](../index.md#type) |
| `args` | [`Type`](../index.md#type)[] |

#### Returns

[`Type`](../index.md#type)

___

### finishType

▸ **finishType**<`T`\>(`typeDef`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Type`](../index.md#type) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `typeDef` | `T` |

#### Returns

`T`

___

### getGlobalNamespaceNode

▸ **getGlobalNamespaceNode**(): [`NamespaceStatementNode`](NamespaceStatementNode.md)

#### Returns

[`NamespaceStatementNode`](NamespaceStatementNode.md)

___

### getGlobalNamespaceType

▸ **getGlobalNamespaceType**(): [`Namespace`](Namespace.md)

#### Returns

[`Namespace`](Namespace.md)

___

### getLiteralType

▸ **getLiteralType**(`node`): [`StringLiteral`](StringLiteral.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | [`StringLiteralNode`](StringLiteralNode.md) |

#### Returns

[`StringLiteral`](StringLiteral.md)

▸ **getLiteralType**(`node`): [`NumericLiteral`](NumericLiteral.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | [`NumericLiteralNode`](NumericLiteralNode.md) |

#### Returns

[`NumericLiteral`](NumericLiteral.md)

▸ **getLiteralType**(`node`): [`BooleanLiteral`](BooleanLiteral.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | [`BooleanLiteralNode`](BooleanLiteralNode.md) |

#### Returns

[`BooleanLiteral`](BooleanLiteral.md)

▸ **getLiteralType**(`node`): [`LiteralType`](../index.md#literaltype)

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | [`LiteralNode`](../index.md#literalnode) |

#### Returns

[`LiteralType`](../index.md#literaltype)

___

### getMergedSymbol

▸ **getMergedSymbol**(`sym`): `undefined` \| [`Sym`](Sym.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `sym` | `undefined` \| [`Sym`](Sym.md) |

#### Returns

`undefined` \| [`Sym`](Sym.md)

___

### getNamespaceString

▸ **getNamespaceString**(`type`, `options?`): `string`

**`Deprecated`**

use `import { getNamespaceFullName } from "@typespec/compiler";`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `undefined` \| [`Namespace`](Namespace.md) |
| `options?` | [`TypeNameOptions`](TypeNameOptions.md) |

#### Returns

`string`

___

### getStdType

▸ **getStdType**<`T`\>(`name`): `StdTypes`[`T`]

Std type

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`IntrinsicScalarName`](../index.md#intrinsicscalarname) \| ``"Array"`` \| ``"Record"`` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `T` | Name |

#### Returns

`StdTypes`[`T`]

___

### getTypeForNode

▸ **getTypeForNode**(`node`): [`Type`](../index.md#type)

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | [`Node`](../index.md#node) |

#### Returns

[`Type`](../index.md#type)

___

### getTypeName

▸ **getTypeName**(`type`, `options?`): `string`

**`Deprecated`**

use `import { getTypeName } from "@typespec/compiler";`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | [`Type`](../index.md#type) |
| `options?` | [`TypeNameOptions`](TypeNameOptions.md) |

#### Returns

`string`

___

### isStdType

▸ **isStdType**(`type`, `stdType?`): type is Scalar & Object

Check if the given type is one of the built-in standard TypeSpec Types.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `type` | [`Scalar`](Scalar.md) | Type to check |
| `stdType?` | [`IntrinsicScalarName`](../index.md#intrinsicscalarname) | If provided check is that standard type |

#### Returns

type is Scalar & Object

▸ **isStdType**(`type`, `stdType?`): type is Type & Object

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | [`Type`](../index.md#type) |
| `stdType?` | `StdTypeName` |

#### Returns

type is Type & Object

___

### isTypeAssignableTo

▸ **isTypeAssignableTo**(`source`, `target`, `diagnosticTarget`): [`boolean`, [`Diagnostic`](Diagnostic.md)[]]

Check if the source type can be assigned to the target type.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `source` | [`Type`](../index.md#type) | Source type, should be assignable to the target. |
| `target` | [`Type`](../index.md#type) | Target type |
| `diagnosticTarget` | [`DiagnosticTarget`](../index.md#diagnostictarget) | Target for the diagnostic, unless something better can be inferred. |

#### Returns

[`boolean`, [`Diagnostic`](Diagnostic.md)[]]

[related, list of diagnostics]

___

### mergeSourceFile

▸ **mergeSourceFile**(`file`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `file` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) \| [`JsSourceFileNode`](JsSourceFileNode.md) |

#### Returns

`void`

___

### project

▸ **project**(`target`, `projection`, `args?`): [`Type`](../index.md#type)

#### Parameters

| Name | Type |
| :------ | :------ |
| `target` | [`Type`](../index.md#type) |
| `projection` | [`ProjectionNode`](ProjectionNode.md) |
| `args?` | (`string` \| `number` \| `boolean` \| [`Type`](../index.md#type))[] |

#### Returns

[`Type`](../index.md#type)

___

### resolveCompletions

▸ **resolveCompletions**(`node`): `Map`<`string`, [`TypeSpecCompletionItem`](TypeSpecCompletionItem.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | [`IdentifierNode`](IdentifierNode.md) |

#### Returns

`Map`<`string`, [`TypeSpecCompletionItem`](TypeSpecCompletionItem.md)\>

___

### resolveIdentifier

▸ **resolveIdentifier**(`node`): `undefined` \| [`Sym`](Sym.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | [`IdentifierNode`](IdentifierNode.md) |

#### Returns

`undefined` \| [`Sym`](Sym.md)

___

### resolveTypeReference

▸ **resolveTypeReference**(`node`): [`undefined` \| [`Type`](../index.md#type), readonly [`Diagnostic`](Diagnostic.md)[]]

Check and resolve a type for the given type reference node.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `node` | [`TypeReferenceNode`](TypeReferenceNode.md) | Node. |

#### Returns

[`undefined` \| [`Type`](../index.md#type), readonly [`Diagnostic`](Diagnostic.md)[]]

Resolved type and diagnostics if there was an error.

___

### setUsingsForFile

▸ **setUsingsForFile**(`file`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `file` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) |

#### Returns

`void`
