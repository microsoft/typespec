---
jsApi: true
title: "[C] JsonSchemaEmitter"

---
## Extends

- `TypeEmitter`< `Record`< `string`, `any` \>, [`JSONSchemaEmitterOptions`](Interface.JSONSchemaEmitterOptions.md) \>

## Constructors

### new JsonSchemaEmitter

```ts
new JsonSchemaEmitter(emitter): JsonSchemaEmitter
```

Constructs a TypeEmitter. Do not use this constructor directly, instead
call `createAssetEmitter` on the emitter context object.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `emitter` | `AssetEmitter`< `Record`< `string`, `any` \>, [`JSONSchemaEmitterOptions`](Interface.JSONSchemaEmitterOptions.md) \> | The asset emitter |

#### Returns

[`JsonSchemaEmitter`](Class.JsonSchemaEmitter.md)

#### Inherited from

TypeEmitter<Record<string, any\>, JSONSchemaEmitterOptions\>.constructor

## Properties

| Property | Type |
| :------ | :------ |
| `private` `#refToDecl` | `Map`< `string`, `Declaration`< `Record`< `string`, `unknown` \> \> \> |
| `private` `#seenIds` | `Set`< `unknown` \> |
| `private` `#typeForSourceFile` | `Map`< `SourceFile`< `any` \>, [`JsonSchemaDeclaration`](Type.JsonSchemaDeclaration.md) \> |
| `protected` `emitter` | `AssetEmitter`< `Record`< `string`, `any` \>, [`JSONSchemaEmitterOptions`](Interface.JSONSchemaEmitterOptions.md) \> |

## Methods

### #applyConstraints

```ts
private #applyConstraints(type, schema): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `Model` \| `ModelProperty` \| `Scalar` \| `Enum` \| `Union` |
| `schema` | `ObjectBuilder`< `unknown` \> |

#### Returns

`void`

***

### #checkForDuplicateId

```ts
private #checkForDuplicateId(id): string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`string`

***

### #createDeclaration

```ts
private #createDeclaration(
  type,
  name,
  schema): Declaration< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | [`JsonSchemaDeclaration`](Type.JsonSchemaDeclaration.md) |
| `name` | `string` |
| `schema` | `ObjectBuilder`< `unknown` \> |

#### Returns

`Declaration`< `Record`< `string`, `any` \> \>

***

### #fileExtension

```ts
private #fileExtension(): "json" | "yaml"
```

#### Returns

`"json"` \| `"yaml"`

***

### #getCurrentSourceFile

```ts
private #getCurrentSourceFile(): SourceFile< object >
```

#### Returns

`SourceFile`< `object` \>

***

### #getDeclId

```ts
private #getDeclId(type, name): string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | [`JsonSchemaDeclaration`](Type.JsonSchemaDeclaration.md) |
| `name` | `string` |

#### Returns

`string`

***

### #isStdType

```ts
private #isStdType(type): boolean
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `Type` |

#### Returns

`boolean`

***

### #newFileScope

```ts
private #newFileScope(type): object
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | [`JsonSchemaDeclaration`](Type.JsonSchemaDeclaration.md) |

#### Returns

| Member | Type |
| :------ | :------ |
| `scope` | `Scope`< `Record`< `string`, `any` \> \> |

***

### #requiredModelProperties

```ts
private #requiredModelProperties(model): undefined | string[]
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | `Model` |

#### Returns

`undefined` \| `string`[]

***

### #scalarBuiltinBaseType

```ts
private #scalarBuiltinBaseType(scalar): null | Scalar
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `scalar` | `Scalar` |

#### Returns

`null` \| `Scalar`

***

### arrayDeclaration

```ts
arrayDeclaration(
  array,
  name,
  elementType): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `array` | `Model` |
| `name` | `string` |
| `elementType` | `Type` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.arrayDeclaration

***

### arrayDeclarationContext

```ts
arrayDeclarationContext(array): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `array` | `Model` |

#### Returns

`Context`

#### Overrides

TypeEmitter.arrayDeclarationContext

***

### arrayDeclarationReferenceContext

```ts
arrayDeclarationReferenceContext(
  array,
  name,
  elementType): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `array` | `Model` |
| `name` | `string` |
| `elementType` | `Type` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.arrayDeclarationReferenceContext

***

### arrayLiteral

```ts
arrayLiteral(array, elementType): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `array` | `Model` |
| `elementType` | `Type` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.arrayLiteral

***

### arrayLiteralContext

```ts
arrayLiteralContext(array, elementType): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `array` | `Model` |
| `elementType` | `Type` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.arrayLiteralContext

***

### arrayLiteralReferenceContext

```ts
arrayLiteralReferenceContext(array, elementType): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `array` | `Model` |
| `elementType` | `Type` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.arrayLiteralReferenceContext

***

### booleanLiteral

```ts
booleanLiteral(boolean): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `boolean` | `BooleanLiteral` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.booleanLiteral

***

### booleanLiteralContext

```ts
booleanLiteralContext(boolean): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `boolean` | `BooleanLiteral` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.booleanLiteralContext

***

### declarationName

```ts
declarationName(declarationType): undefined | string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `declarationType` | `TypeSpecDeclaration` |

#### Returns

`undefined` \| `string`

#### Inherited from

TypeEmitter.declarationName

***

### enumDeclaration

```ts
enumDeclaration(en, name): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `en` | `Enum` |
| `name` | `string` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.enumDeclaration

***

### enumDeclarationContext

```ts
enumDeclarationContext(en): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `en` | `Enum` |

#### Returns

`Context`

#### Overrides

TypeEmitter.enumDeclarationContext

***

### enumMember

```ts
enumMember(member): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `member` | `EnumMember` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.enumMember

***

### enumMemberContext

```ts
enumMemberContext(member): object
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `member` | `EnumMember` |

#### Returns

`object`

#### Inherited from

TypeEmitter.enumMemberContext

***

### enumMemberReference

```ts
enumMemberReference(member): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `member` | `EnumMember` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Overrides

TypeEmitter.enumMemberReference

***

### enumMembers

```ts
enumMembers(en): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `en` | `Enum` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.enumMembers

***

### enumMembersContext

```ts
enumMembersContext(en): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `en` | `Enum` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.enumMembersContext

***

### interfaceDeclaration

```ts
interfaceDeclaration(iface, name): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `iface` | `Interface` |
| `name` | `string` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.interfaceDeclaration

***

### interfaceDeclarationContext

```ts
interfaceDeclarationContext(iface, name): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `iface` | `Interface` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceDeclarationContext

***

### interfaceDeclarationOperations

```ts
interfaceDeclarationOperations(iface): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `iface` | `Interface` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.interfaceDeclarationOperations

***

### interfaceDeclarationOperationsContext

```ts
interfaceDeclarationOperationsContext(iface): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `iface` | `Interface` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceDeclarationOperationsContext

***

### interfaceDeclarationOperationsReferenceContext

```ts
interfaceDeclarationOperationsReferenceContext(iface): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `iface` | `Interface` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceDeclarationOperationsReferenceContext

***

### interfaceDeclarationReferenceContext

```ts
interfaceDeclarationReferenceContext(iface, name): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `iface` | `Interface` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceDeclarationReferenceContext

***

### interfaceOperationDeclaration

```ts
interfaceOperationDeclaration(operation, name): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `name` | `string` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.interfaceOperationDeclaration

***

### interfaceOperationDeclarationContext

```ts
interfaceOperationDeclarationContext(operation, name): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceOperationDeclarationContext

***

### interfaceOperationDeclarationReferenceContext

```ts
interfaceOperationDeclarationReferenceContext(operation, name): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceOperationDeclarationReferenceContext

***

### intrinsic

```ts
intrinsic(intrinsic, name): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `intrinsic` | `IntrinsicType` |
| `name` | `string` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.intrinsic

***

### intrinsicContext

```ts
intrinsicContext(intrinsic, name): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `intrinsic` | `IntrinsicType` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.intrinsicContext

***

### modelDeclaration

```ts
modelDeclaration(model, name): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | `Model` |
| `name` | `string` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.modelDeclaration

***

### modelDeclarationContext

```ts
modelDeclarationContext(model, name): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | `Model` |
| `name` | `string` |

#### Returns

`Context`

#### Overrides

TypeEmitter.modelDeclarationContext

***

### modelDeclarationReferenceContext

```ts
modelDeclarationReferenceContext(model, name): Context
```

Set reference context for a model declaration.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `model` | `Model` |  |
| `name` | `string` | - |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelDeclarationReferenceContext

***

### modelInstantiation

```ts
modelInstantiation(model, name): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | `Model` |
| `name` | `undefined` \| `string` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Overrides

TypeEmitter.modelInstantiation

***

### modelInstantiationContext

```ts
modelInstantiationContext(model, name): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | `Model` |
| `name` | `undefined` \| `string` |

#### Returns

`Context`

#### Overrides

TypeEmitter.modelInstantiationContext

***

### modelInstantiationReferenceContext

```ts
modelInstantiationReferenceContext(model, name): Context
```

Set reference context for a model declaration.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `model` | `Model` |  |
| `name` | `undefined` \| `string` | - |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelInstantiationReferenceContext

***

### modelLiteral

```ts
modelLiteral(model): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | `Model` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.modelLiteral

***

### modelLiteralContext

```ts
modelLiteralContext(model): Context
```

Set lexical context for a model literal.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `model` | `Model` |  |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelLiteralContext

***

### modelLiteralReferenceContext

```ts
modelLiteralReferenceContext(model): Context
```

Set reference context for a model literal.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `model` | `Model` |  |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelLiteralReferenceContext

***

### modelProperties

```ts
modelProperties(model): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | `Model` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.modelProperties

***

### modelPropertiesContext

```ts
modelPropertiesContext(model): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | `Model` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelPropertiesContext

***

### modelPropertiesReferenceContext

```ts
modelPropertiesReferenceContext(model): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | `Model` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelPropertiesReferenceContext

***

### modelPropertyLiteral

```ts
modelPropertyLiteral(property): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `property` | `ModelProperty` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.modelPropertyLiteral

***

### modelPropertyLiteralContext

```ts
modelPropertyLiteralContext(property): Context
```

Set lexical context for a property of a model.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `property` | `ModelProperty` |  |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelPropertyLiteralContext

***

### modelPropertyLiteralReferenceContext

```ts
modelPropertyLiteralReferenceContext(property): Context
```

Set reference context for a property of a model.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `property` | `ModelProperty` |  |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelPropertyLiteralReferenceContext

***

### modelPropertyReference

```ts
modelPropertyReference(property): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `property` | `ModelProperty` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.modelPropertyReference

***

### namespace

```ts
namespace(namespace): EmitterOutput< Record< string, any > >
```

Emit a namespace

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `namespace` | `Namespace` |  |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

Emitter output

#### Inherited from

TypeEmitter.namespace

***

### namespaceContext

```ts
namespaceContext(namespace): Context
```

Set lexical context for a namespace

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `namespace` | `Namespace` |  |

#### Returns

`Context`

#### Inherited from

TypeEmitter.namespaceContext

***

### namespaceReferenceContext

```ts
namespaceReferenceContext(namespace): Context
```

Set reference context for a namespace.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `namespace` | `Namespace` |  |

#### Returns

`Context`

#### Inherited from

TypeEmitter.namespaceReferenceContext

***

### numericLiteral

```ts
numericLiteral(number): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `number` | `NumericLiteral` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.numericLiteral

***

### numericLiteralContext

```ts
numericLiteralContext(number): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `number` | `NumericLiteral` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.numericLiteralContext

***

### operationDeclaration

```ts
operationDeclaration(operation, name): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `name` | `string` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.operationDeclaration

***

### operationDeclarationContext

```ts
operationDeclarationContext(operation, name): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationDeclarationContext

***

### operationDeclarationReferenceContext

```ts
operationDeclarationReferenceContext(operation, name): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationDeclarationReferenceContext

***

### operationParameters

```ts
operationParameters(operation, parameters): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `parameters` | `Model` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.operationParameters

***

### operationParametersContext

```ts
operationParametersContext(operation, parameters): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `parameters` | `Model` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationParametersContext

***

### operationParametersReferenceContext

```ts
operationParametersReferenceContext(operation, parameters): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `parameters` | `Model` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationParametersReferenceContext

***

### operationReturnType

```ts
operationReturnType(operation, returnType): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `returnType` | `Type` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.operationReturnType

***

### operationReturnTypeContext

```ts
operationReturnTypeContext(operation, returnType): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `returnType` | `Type` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationReturnTypeContext

***

### operationReturnTypeReferenceContext

```ts
operationReturnTypeReferenceContext(operation, returnType): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `returnType` | `Type` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationReturnTypeReferenceContext

***

### programContext

```ts
programContext(program): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |

#### Returns

`Context`

#### Overrides

TypeEmitter.programContext

***

### reference

```ts
reference(
  targetDeclaration,
  pathUp,
  pathDown,
  commonScope): object | EmitEntity< Record< string, unknown > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `targetDeclaration` | `Declaration`< `Record`< `string`, `unknown` \> \> |
| `pathUp` | `Scope`< `Record`< `string`, `unknown` \> \>[] |
| `pathDown` | `Scope`< `Record`< `string`, `unknown` \> \>[] |
| `commonScope` | `null` \| `Scope`< `Record`< `string`, `unknown` \> \> |

#### Returns

`object` \| `EmitEntity`< `Record`< `string`, `unknown` \> \>

#### Overrides

TypeEmitter.reference

***

### scalarDeclaration

```ts
scalarDeclaration(scalar, name): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `scalar` | `Scalar` |
| `name` | `string` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.scalarDeclaration

***

### scalarDeclarationContext

```ts
scalarDeclarationContext(scalar): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `scalar` | `Scalar` |

#### Returns

`Context`

#### Overrides

TypeEmitter.scalarDeclarationContext

***

### scalarInstantiation

```ts
scalarInstantiation(scalar, name): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `scalar` | `Scalar` |
| `name` | `undefined` \| `string` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.scalarInstantiation

***

### scalarInstantiationContext

```ts
scalarInstantiationContext(scalar, name): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `scalar` | `Scalar` |
| `name` | `undefined` \| `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.scalarInstantiationContext

***

### sourceFile

```ts
sourceFile(sourceFile): EmittedSourceFile
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `sourceFile` | `SourceFile`< `object` \> |

#### Returns

`EmittedSourceFile`

#### Overrides

TypeEmitter.sourceFile

***

### stringLiteral

```ts
stringLiteral(string): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `string` | `StringLiteral` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.stringLiteral

***

### stringLiteralContext

```ts
stringLiteralContext(string): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `string` | `StringLiteral` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.stringLiteralContext

***

### tupleLiteral

```ts
tupleLiteral(tuple): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `tuple` | `Tuple` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.tupleLiteral

***

### tupleLiteralContext

```ts
tupleLiteralContext(tuple): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `tuple` | `Tuple` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.tupleLiteralContext

***

### tupleLiteralReferenceContext

```ts
tupleLiteralReferenceContext(tuple): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `tuple` | `Tuple` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.tupleLiteralReferenceContext

***

### tupleLiteralValues

```ts
tupleLiteralValues(tuple): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `tuple` | `Tuple` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.tupleLiteralValues

***

### unionDeclaration

```ts
unionDeclaration(union, name): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `union` | `Union` |
| `name` | `string` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.unionDeclaration

***

### unionDeclarationContext

```ts
unionDeclarationContext(union): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`Context`

#### Overrides

TypeEmitter.unionDeclarationContext

***

### unionDeclarationReferenceContext

```ts
unionDeclarationReferenceContext(union): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionDeclarationReferenceContext

***

### unionInstantiation

```ts
unionInstantiation(union, name): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `union` | `Union` |
| `name` | `string` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.unionInstantiation

***

### unionInstantiationContext

```ts
unionInstantiationContext(union, name): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `union` | `Union` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionInstantiationContext

***

### unionInstantiationReferenceContext

```ts
unionInstantiationReferenceContext(union, name): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `union` | `Union` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionInstantiationReferenceContext

***

### unionLiteral

```ts
unionLiteral(union): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.unionLiteral

***

### unionLiteralContext

```ts
unionLiteralContext(union): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionLiteralContext

***

### unionLiteralReferenceContext

```ts
unionLiteralReferenceContext(union): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionLiteralReferenceContext

***

### unionVariant

```ts
unionVariant(variant): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `variant` | `UnionVariant` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.unionVariant

***

### unionVariantContext

```ts
unionVariantContext(union): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionVariantContext

***

### unionVariantReferenceContext

```ts
unionVariantReferenceContext(union): Context
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionVariantReferenceContext

***

### unionVariants

```ts
unionVariants(union): EmitterOutput< object >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.unionVariants

***

### unionVariantsContext

```ts
unionVariantsContext(): Context
```

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionVariantsContext

***

### unionVariantsReferenceContext

```ts
unionVariantsReferenceContext(): Context
```

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionVariantsReferenceContext

***

### writeOutput

```ts
writeOutput(sourceFiles): Promise< void >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `sourceFiles` | `SourceFile`< `Record`< `string`, `any` \> \>[] |

#### Returns

`Promise`< `void` \>

#### Overrides

TypeEmitter.writeOutput
