---
jsApi: true
title: "[C] JsonSchemaEmitter"
---

## Extends

- `TypeEmitter`< `Record`< `string`, `any` \>, [`JSONSchemaEmitterOptions`](Interface.JSONSchemaEmitterOptions.md) \>

## Constructors

### constructor()

```ts
new JsonSchemaEmitter(emitter): JsonSchemaEmitter
```

Constructs a TypeEmitter. Do not use this constructor directly, instead
call `createAssetEmitter` on the emitter context object.

#### Parameters

| Parameter | Type                                                                                                                 | Description       |
| :-------- | :------------------------------------------------------------------------------------------------------------------- | :---------------- |
| `emitter` | `AssetEmitter`< `Record`< `string`, `any` \>, [`JSONSchemaEmitterOptions`](Interface.JSONSchemaEmitterOptions.md) \> | The asset emitter |

#### Returns

[`JsonSchemaEmitter`](Class.JsonSchemaEmitter.md)

#### Inherited from

TypeEmitter<Record<string, any\>, JSONSchemaEmitterOptions\>.constructor

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:124

## Properties

| Property                       | Type                                                                                                                 |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `private` `#refToDecl`         | `Map`< `string`, `Declaration`< `Record`< `string`, `unknown` \> \> \>                                               |
| `private` `#seenIds`           | `Set`< `unknown` \>                                                                                                  |
| `private` `#typeForSourceFile` | `Map`< `SourceFile`< `any` \>, [`JsonSchemaDeclaration`](Type.JsonSchemaDeclaration.md) \>                           |
| `protected` `emitter`          | `AssetEmitter`< `Record`< `string`, `any` \>, [`JSONSchemaEmitterOptions`](Interface.JSONSchemaEmitterOptions.md) \> |

## Methods

### #applyConstraints()

```ts
private #applyConstraints(type, schema): void
```

#### Parameters

| Parameter | Type                                                        |
| :-------- | :---------------------------------------------------------- |
| `type`    | `Model` \| `ModelProperty` \| `Scalar` \| `Enum` \| `Union` |
| `schema`  | `ObjectBuilder`< `unknown` \>                               |

#### Returns

`void`

#### Source

[json-schema/src/json-schema-emitter.ts:407](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L407)

---

### #checkForDuplicateId()

```ts
private #checkForDuplicateId(id): string
```

#### Parameters

| Parameter | Type     |
| :-------- | :------- |
| `id`      | `string` |

#### Returns

`string`

#### Source

[json-schema/src/json-schema-emitter.ts:652](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L652)

---

### #createDeclaration()

```ts
private #createDeclaration(
  type,
  name,
  schema): Declaration< Record< string, any > >
```

#### Parameters

| Parameter | Type                                                     |
| :-------- | :------------------------------------------------------- |
| `type`    | [`JsonSchemaDeclaration`](Type.JsonSchemaDeclaration.md) |
| `name`    | `string`                                                 |
| `schema`  | `ObjectBuilder`< `unknown` \>                            |

#### Returns

`Declaration`< `Record`< `string`, `any` \> \>

#### Source

[json-schema/src/json-schema-emitter.ts:503](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L503)

---

### #fileExtension()

```ts
private #fileExtension(): "json" | "yaml"
```

#### Returns

`"json"` \| `"yaml"`

#### Source

[json-schema/src/json-schema-emitter.ts:741](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L741)

---

### #getCurrentSourceFile()

```ts
private #getCurrentSourceFile(): SourceFile< object >
```

#### Returns

`SourceFile`< `object` \>

#### Source

[json-schema/src/json-schema-emitter.ts:604](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L604)

---

### #getDeclId()

```ts
private #getDeclId(type, name): string
```

#### Parameters

| Parameter | Type                                                     |
| :-------- | :------------------------------------------------------- |
| `type`    | [`JsonSchemaDeclaration`](Type.JsonSchemaDeclaration.md) |
| `name`    | `string`                                                 |

#### Returns

`string`

#### Source

[json-schema/src/json-schema-emitter.ts:617](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L617)

---

### #isStdType()

```ts
private #isStdType(type): boolean
```

#### Parameters

| Parameter | Type   |
| :-------- | :----- |
| `type`    | `Type` |

#### Returns

`boolean`

#### Source

[json-schema/src/json-schema-emitter.ts:513](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L513)

---

### #newFileScope()

```ts
private #newFileScope(type): object
```

#### Parameters

| Parameter | Type                                                     |
| :-------- | :------------------------------------------------------- |
| `type`    | [`JsonSchemaDeclaration`](Type.JsonSchemaDeclaration.md) |

#### Returns

| Member  | Type                                     |
| :------ | :--------------------------------------- |
| `scope` | `Scope`< `Record`< `string`, `any` \> \> |

#### Source

[json-schema/src/json-schema-emitter.ts:727](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L727)

---

### #requiredModelProperties()

```ts
private #requiredModelProperties(model): undefined | string[]
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `model`   | `Model` |

#### Returns

`undefined` \| `string`[]

#### Source

[json-schema/src/json-schema-emitter.ts:138](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L138)

---

### #scalarBuiltinBaseType()

```ts
private #scalarBuiltinBaseType(scalar): null | Scalar
```

#### Parameters

| Parameter | Type     |
| :-------- | :------- |
| `scalar`  | `Scalar` |

#### Returns

`null` \| `Scalar`

#### Source

[json-schema/src/json-schema-emitter.ts:490](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L490)

---

### arrayDeclaration()

```ts
arrayDeclaration(
  array,
  name,
  elementType): EmitterOutput< object >
```

#### Parameters

| Parameter     | Type     |
| :------------ | :------- |
| `array`       | `Model`  |
| `name`        | `string` |
| `elementType` | `Type`   |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.arrayDeclaration

#### Source

[json-schema/src/json-schema-emitter.ts:118](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L118)

---

### arrayDeclarationContext()

```ts
arrayDeclarationContext(array): Context
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `array`   | `Model` |

#### Returns

`Context`

#### Overrides

TypeEmitter.arrayDeclarationContext

#### Source

[json-schema/src/json-schema-emitter.ts:693](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L693)

---

### arrayDeclarationReferenceContext()

```ts
arrayDeclarationReferenceContext(
  array,
  name,
  elementType): Context
```

#### Parameters

| Parameter     | Type     |
| :------------ | :------- |
| `array`       | `Model`  |
| `name`        | `string` |
| `elementType` | `Type`   |

#### Returns

`Context`

#### Inherited from

TypeEmitter.arrayDeclarationReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:254

---

### arrayLiteral()

```ts
arrayLiteral(array, elementType): EmitterOutput< object >
```

#### Parameters

| Parameter     | Type    |
| :------------ | :------ |
| `array`       | `Model` |
| `elementType` | `Type`  |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.arrayLiteral

#### Source

[json-schema/src/json-schema-emitter.ts:131](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L131)

---

### arrayLiteralContext()

```ts
arrayLiteralContext(array, elementType): Context
```

#### Parameters

| Parameter     | Type    |
| :------------ | :------ |
| `array`       | `Model` |
| `elementType` | `Type`  |

#### Returns

`Context`

#### Inherited from

TypeEmitter.arrayLiteralContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:256

---

### arrayLiteralReferenceContext()

```ts
arrayLiteralReferenceContext(array, elementType): Context
```

#### Parameters

| Parameter     | Type    |
| :------------ | :------ |
| `array`       | `Model` |
| `elementType` | `Type`  |

#### Returns

`Context`

#### Inherited from

TypeEmitter.arrayLiteralReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:257

---

### booleanLiteral()

```ts
booleanLiteral(boolean): EmitterOutput< object >
```

#### Parameters

| Parameter | Type             |
| :-------- | :--------------- |
| `boolean` | `BooleanLiteral` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.booleanLiteral

#### Source

[json-schema/src/json-schema-emitter.ts:174](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L174)

---

### booleanLiteralContext()

```ts
booleanLiteralContext(boolean): Context
```

#### Parameters

| Parameter | Type             |
| :-------- | :--------------- |
| `boolean` | `BooleanLiteral` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.booleanLiteralContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:264

---

### declarationName()

```ts
declarationName(declarationType): undefined | string
```

#### Parameters

| Parameter         | Type                  |
| :---------------- | :-------------------- |
| `declarationType` | `TypeSpecDeclaration` |

#### Returns

`undefined` \| `string`

#### Inherited from

TypeEmitter.declarationName

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:316

---

### enumDeclaration()

```ts
enumDeclaration(en, name): EmitterOutput< object >
```

#### Parameters

| Parameter | Type     |
| :-------- | :------- |
| `en`      | `Enum`   |
| `name`    | `string` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.enumDeclaration

#### Source

[json-schema/src/json-schema-emitter.ts:186](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L186)

---

### enumDeclarationContext()

```ts
enumDeclarationContext(en): Context
```

#### Parameters

| Parameter | Type   |
| :-------- | :----- |
| `en`      | `Enum` |

#### Returns

`Context`

#### Overrides

TypeEmitter.enumDeclarationContext

#### Source

[json-schema/src/json-schema-emitter.ts:701](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L701)

---

### enumMember()

```ts
enumMember(member): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type         |
| :-------- | :----------- |
| `member`  | `EnumMember` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.enumMember

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:292

---

### enumMemberContext()

```ts
enumMemberContext(member): object
```

#### Parameters

| Parameter | Type         |
| :-------- | :----------- |
| `member`  | `EnumMember` |

#### Returns

`object`

#### Inherited from

TypeEmitter.enumMemberContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:293

---

### enumMemberReference()

```ts
enumMemberReference(member): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type         |
| :-------- | :----------- |
| `member`  | `EnumMember` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Overrides

TypeEmitter.enumMemberReference

#### Source

[json-schema/src/json-schema-emitter.ts:207](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L207)

---

### enumMembers()

```ts
enumMembers(en): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type   |
| :-------- | :----- |
| `en`      | `Enum` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.enumMembers

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:290

---

### enumMembersContext()

```ts
enumMembersContext(en): Context
```

#### Parameters

| Parameter | Type   |
| :-------- | :----- |
| `en`      | `Enum` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.enumMembersContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:291

---

### interfaceDeclaration()

```ts
interfaceDeclaration(iface, name): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type        |
| :-------- | :---------- |
| `iface`   | `Interface` |
| `name`    | `string`    |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.interfaceDeclaration

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:283

---

### interfaceDeclarationContext()

```ts
interfaceDeclarationContext(iface, name): Context
```

#### Parameters

| Parameter | Type        |
| :-------- | :---------- |
| `iface`   | `Interface` |
| `name`    | `string`    |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceDeclarationContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:284

---

### interfaceDeclarationOperations()

```ts
interfaceDeclarationOperations(iface): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type        |
| :-------- | :---------- |
| `iface`   | `Interface` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.interfaceDeclarationOperations

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:286

---

### interfaceDeclarationOperationsContext()

```ts
interfaceDeclarationOperationsContext(iface): Context
```

#### Parameters

| Parameter | Type        |
| :-------- | :---------- |
| `iface`   | `Interface` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceDeclarationOperationsContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:273

---

### interfaceDeclarationOperationsReferenceContext()

```ts
interfaceDeclarationOperationsReferenceContext(iface): Context
```

#### Parameters

| Parameter | Type        |
| :-------- | :---------- |
| `iface`   | `Interface` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceDeclarationOperationsReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:274

---

### interfaceDeclarationReferenceContext()

```ts
interfaceDeclarationReferenceContext(iface, name): Context
```

#### Parameters

| Parameter | Type        |
| :-------- | :---------- |
| `iface`   | `Interface` |
| `name`    | `string`    |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceDeclarationReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:285

---

### interfaceOperationDeclaration()

```ts
interfaceOperationDeclaration(operation, name): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter   | Type        |
| :---------- | :---------- |
| `operation` | `Operation` |
| `name`      | `string`    |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.interfaceOperationDeclaration

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:287

---

### interfaceOperationDeclarationContext()

```ts
interfaceOperationDeclarationContext(operation, name): Context
```

#### Parameters

| Parameter   | Type        |
| :---------- | :---------- |
| `operation` | `Operation` |
| `name`      | `string`    |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceOperationDeclarationContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:275

---

### interfaceOperationDeclarationReferenceContext()

```ts
interfaceOperationDeclarationReferenceContext(operation, name): Context
```

#### Parameters

| Parameter   | Type        |
| :---------- | :---------- |
| `operation` | `Operation` |
| `name`      | `string`    |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceOperationDeclarationReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:276

---

### intrinsic()

```ts
intrinsic(intrinsic, name): EmitterOutput< object >
```

#### Parameters

| Parameter   | Type            |
| :---------- | :-------------- |
| `intrinsic` | `IntrinsicType` |
| `name`      | `string`        |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.intrinsic

#### Source

[json-schema/src/json-schema-emitter.ts:517](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L517)

---

### intrinsicContext()

```ts
intrinsicContext(intrinsic, name): Context
```

#### Parameters

| Parameter   | Type            |
| :---------- | :-------------- |
| `intrinsic` | `IntrinsicType` |
| `name`      | `string`        |

#### Returns

`Context`

#### Inherited from

TypeEmitter.intrinsicContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:263

---

### modelDeclaration()

```ts
modelDeclaration(model, name): EmitterOutput< object >
```

#### Parameters

| Parameter | Type     |
| :-------- | :------- |
| `model`   | `Model`  |
| `name`    | `string` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.modelDeclaration

#### Source

[json-schema/src/json-schema-emitter.ts:72](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L72)

---

### modelDeclarationContext()

```ts
modelDeclarationContext(model, name): Context
```

#### Parameters

| Parameter | Type     |
| :-------- | :------- |
| `model`   | `Model`  |
| `name`    | `string` |

#### Returns

`Context`

#### Overrides

TypeEmitter.modelDeclarationContext

#### Source

[json-schema/src/json-schema-emitter.ts:671](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L671)

---

### modelDeclarationReferenceContext()

```ts
modelDeclarationReferenceContext(model, name): Context
```

Set reference context for a model declaration.

#### Parameters

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `model`   | `Model`  |             |
| `name`    | `string` | -           |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelDeclarationReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:187

---

### modelInstantiation()

```ts
modelInstantiation(model, name): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type                    |
| :-------- | :---------------------- |
| `model`   | `Model`                 |
| `name`    | `undefined` \| `string` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Overrides

TypeEmitter.modelInstantiation

#### Source

[json-schema/src/json-schema-emitter.ts:110](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L110)

---

### modelInstantiationContext()

```ts
modelInstantiationContext(model, name): Context
```

#### Parameters

| Parameter | Type                    |
| :-------- | :---------------------- |
| `model`   | `Model`                 |
| `name`    | `undefined` \| `string` |

#### Returns

`Context`

#### Overrides

TypeEmitter.modelInstantiationContext

#### Source

[json-schema/src/json-schema-emitter.ts:683](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L683)

---

### modelInstantiationReferenceContext()

```ts
modelInstantiationReferenceContext(model, name): Context
```

Set reference context for a model declaration.

#### Parameters

| Parameter | Type                    | Description |
| :-------- | :---------------------- | :---------- |
| `model`   | `Model`                 |             |
| `name`    | `undefined` \| `string` | -           |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelInstantiationReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:208

---

### modelLiteral()

```ts
modelLiteral(model): EmitterOutput< object >
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `model`   | `Model` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.modelLiteral

#### Source

[json-schema/src/json-schema-emitter.ts:96](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L96)

---

### modelLiteralContext()

```ts
modelLiteralContext(model): Context
```

Set lexical context for a model literal.

#### Parameters

| Parameter | Type    | Description |
| :-------- | :------ | :---------- |
| `model`   | `Model` |             |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelLiteralContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:162

---

### modelLiteralReferenceContext()

```ts
modelLiteralReferenceContext(model): Context
```

Set reference context for a model literal.

#### Parameters

| Parameter | Type    | Description |
| :-------- | :------ | :---------- |
| `model`   | `Model` |             |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelLiteralReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:167

---

### modelProperties()

```ts
modelProperties(model): EmitterOutput< object >
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `model`   | `Model` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.modelProperties

#### Source

[json-schema/src/json-schema-emitter.ts:150](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L150)

---

### modelPropertiesContext()

```ts
modelPropertiesContext(model): Context
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `model`   | `Model` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelPropertiesContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:216

---

### modelPropertiesReferenceContext()

```ts
modelPropertiesReferenceContext(model): Context
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `model`   | `Model` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelPropertiesReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:217

---

### modelPropertyLiteral()

```ts
modelPropertyLiteral(property): EmitterOutput< object >
```

#### Parameters

| Parameter  | Type            |
| :--------- | :-------------- |
| `property` | `ModelProperty` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.modelPropertyLiteral

#### Source

[json-schema/src/json-schema-emitter.ts:161](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L161)

---

### modelPropertyLiteralContext()

```ts
modelPropertyLiteralContext(property): Context
```

Set lexical context for a property of a model.

#### Parameters

| Parameter  | Type            | Description |
| :--------- | :-------------- | :---------- |
| `property` | `ModelProperty` |             |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelPropertyLiteralContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:229

---

### modelPropertyLiteralReferenceContext()

```ts
modelPropertyLiteralReferenceContext(property): Context
```

Set reference context for a property of a model.

#### Parameters

| Parameter  | Type            | Description |
| :--------- | :-------------- | :---------- |
| `property` | `ModelProperty` |             |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelPropertyLiteralReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:235

---

### modelPropertyReference()

```ts
modelPropertyReference(property): EmitterOutput< object >
```

#### Parameters

| Parameter  | Type            |
| :--------- | :-------------- |
| `property` | `ModelProperty` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.modelPropertyReference

#### Source

[json-schema/src/json-schema-emitter.ts:249](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L249)

---

### namespace()

```ts
namespace(namespace): EmitterOutput< Record< string, any > >
```

Emit a namespace

#### Parameters

| Parameter   | Type        | Description |
| :---------- | :---------- | :---------- |
| `namespace` | `Namespace` |             |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

Emitter output

#### Inherited from

TypeEmitter.namespace

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:139

---

### namespaceContext()

```ts
namespaceContext(namespace): Context
```

Set lexical context for a namespace

#### Parameters

| Parameter   | Type        | Description |
| :---------- | :---------- | :---------- |
| `namespace` | `Namespace` |             |

#### Returns

`Context`

#### Inherited from

TypeEmitter.namespaceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:145

---

### namespaceReferenceContext()

```ts
namespaceReferenceContext(namespace): Context
```

Set reference context for a namespace.

#### Parameters

| Parameter   | Type        | Description |
| :---------- | :---------- | :---------- |
| `namespace` | `Namespace` |             |

#### Returns

`Context`

#### Inherited from

TypeEmitter.namespaceReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:151

---

### numericLiteral()

```ts
numericLiteral(number): EmitterOutput< object >
```

#### Parameters

| Parameter | Type             |
| :-------- | :--------------- |
| `number`  | `NumericLiteral` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.numericLiteral

#### Source

[json-schema/src/json-schema-emitter.ts:182](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L182)

---

### numericLiteralContext()

```ts
numericLiteralContext(number): Context
```

#### Parameters

| Parameter | Type             |
| :-------- | :--------------- |
| `number`  | `NumericLiteral` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.numericLiteralContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:268

---

### operationDeclaration()

```ts
operationDeclaration(operation, name): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter   | Type        |
| :---------- | :---------- |
| `operation` | `Operation` |
| `name`      | `string`    |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.operationDeclaration

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:270

---

### operationDeclarationContext()

```ts
operationDeclarationContext(operation, name): Context
```

#### Parameters

| Parameter   | Type        |
| :---------- | :---------- |
| `operation` | `Operation` |
| `name`      | `string`    |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationDeclarationContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:271

---

### operationDeclarationReferenceContext()

```ts
operationDeclarationReferenceContext(operation, name): Context
```

#### Parameters

| Parameter   | Type        |
| :---------- | :---------- |
| `operation` | `Operation` |
| `name`      | `string`    |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationDeclarationReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:272

---

### operationParameters()

```ts
operationParameters(operation, parameters): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter    | Type        |
| :----------- | :---------- |
| `operation`  | `Operation` |
| `parameters` | `Model`     |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.operationParameters

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:277

---

### operationParametersContext()

```ts
operationParametersContext(operation, parameters): Context
```

#### Parameters

| Parameter    | Type        |
| :----------- | :---------- |
| `operation`  | `Operation` |
| `parameters` | `Model`     |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationParametersContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:278

---

### operationParametersReferenceContext()

```ts
operationParametersReferenceContext(operation, parameters): Context
```

#### Parameters

| Parameter    | Type        |
| :----------- | :---------- |
| `operation`  | `Operation` |
| `parameters` | `Model`     |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationParametersReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:279

---

### operationReturnType()

```ts
operationReturnType(operation, returnType): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter    | Type        |
| :----------- | :---------- |
| `operation`  | `Operation` |
| `returnType` | `Type`      |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.operationReturnType

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:280

---

### operationReturnTypeContext()

```ts
operationReturnTypeContext(operation, returnType): Context
```

#### Parameters

| Parameter    | Type        |
| :----------- | :---------- |
| `operation`  | `Operation` |
| `returnType` | `Type`      |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationReturnTypeContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:281

---

### operationReturnTypeReferenceContext()

```ts
operationReturnTypeReferenceContext(operation, returnType): Context
```

#### Parameters

| Parameter    | Type        |
| :----------- | :---------- |
| `operation`  | `Operation` |
| `returnType` | `Type`      |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationReturnTypeReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:282

---

### programContext()

```ts
programContext(program): Context
```

#### Parameters

| Parameter | Type      |
| :-------- | :-------- |
| `program` | `Program` |

#### Returns

`Context`

#### Overrides

TypeEmitter.programContext

#### Source

[json-schema/src/json-schema-emitter.ts:662](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L662)

---

### reference()

```ts
reference(
  targetDeclaration,
  pathUp,
  pathDown,
  commonScope): object | EmitEntity< Record< string, unknown > >
```

#### Parameters

| Parameter           | Type                                                   |
| :------------------ | :----------------------------------------------------- |
| `targetDeclaration` | `Declaration`< `Record`< `string`, `unknown` \> \>     |
| `pathUp`            | `Scope`< `Record`< `string`, `unknown` \> \>[]         |
| `pathDown`          | `Scope`< `Record`< `string`, `unknown` \> \>[]         |
| `commonScope`       | `null` \| `Scope`< `Record`< `string`, `unknown` \> \> |

#### Returns

`object` \| `EmitEntity`< `Record`< `string`, `unknown` \> \>

#### Overrides

TypeEmitter.reference

#### Source

[json-schema/src/json-schema-emitter.ts:263](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L263)

---

### scalarDeclaration()

```ts
scalarDeclaration(scalar, name): EmitterOutput< object >
```

#### Parameters

| Parameter | Type     |
| :-------- | :------- |
| `scalar`  | `Scalar` |
| `name`    | `string` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.scalarDeclaration

#### Source

[json-schema/src/json-schema-emitter.ts:300](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L300)

---

### scalarDeclarationContext()

```ts
scalarDeclarationContext(scalar): Context
```

#### Parameters

| Parameter | Type     |
| :-------- | :------- |
| `scalar`  | `Scalar` |

#### Returns

`Context`

#### Overrides

TypeEmitter.scalarDeclarationContext

#### Source

[json-schema/src/json-schema-emitter.ts:717](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L717)

---

### scalarInstantiation()

```ts
scalarInstantiation(scalar, name): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type                    |
| :-------- | :---------------------- |
| `scalar`  | `Scalar`                |
| `name`    | `undefined` \| `string` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.scalarInstantiation

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:260

---

### scalarInstantiationContext()

```ts
scalarInstantiationContext(scalar, name): Context
```

#### Parameters

| Parameter | Type                    |
| :-------- | :---------------------- |
| `scalar`  | `Scalar`                |
| `name`    | `undefined` \| `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.scalarInstantiationContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:261

---

### sourceFile()

```ts
sourceFile(sourceFile): EmittedSourceFile
```

#### Parameters

| Parameter    | Type                      |
| :----------- | :------------------------ |
| `sourceFile` | `SourceFile`< `object` \> |

#### Returns

`EmittedSourceFile`

#### Overrides

TypeEmitter.sourceFile

#### Source

[json-schema/src/json-schema-emitter.ts:550](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L550)

---

### stringLiteral()

```ts
stringLiteral(string): EmitterOutput< object >
```

#### Parameters

| Parameter | Type            |
| :-------- | :-------------- |
| `string`  | `StringLiteral` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.stringLiteral

#### Source

[json-schema/src/json-schema-emitter.ts:178](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L178)

---

### stringLiteralContext()

```ts
stringLiteralContext(string): Context
```

#### Parameters

| Parameter | Type            |
| :-------- | :-------------- |
| `string`  | `StringLiteral` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.stringLiteralContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:266

---

### tupleLiteral()

```ts
tupleLiteral(tuple): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `tuple`   | `Tuple` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.tupleLiteral

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:309

---

### tupleLiteralContext()

```ts
tupleLiteralContext(tuple): Context
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `tuple`   | `Tuple` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.tupleLiteralContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:310

---

### tupleLiteralReferenceContext()

```ts
tupleLiteralReferenceContext(tuple): Context
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `tuple`   | `Tuple` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.tupleLiteralReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:312

---

### tupleLiteralValues()

```ts
tupleLiteralValues(tuple): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `tuple`   | `Tuple` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.tupleLiteralValues

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:311

---

### unionDeclaration()

```ts
unionDeclaration(union, name): EmitterOutput< object >
```

#### Parameters

| Parameter | Type     |
| :-------- | :------- |
| `union`   | `Union`  |
| `name`    | `string` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.unionDeclaration

#### Source

[json-schema/src/json-schema-emitter.ts:219](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L219)

---

### unionDeclarationContext()

```ts
unionDeclarationContext(union): Context
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `union`   | `Union` |

#### Returns

`Context`

#### Overrides

TypeEmitter.unionDeclarationContext

#### Source

[json-schema/src/json-schema-emitter.ts:709](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L709)

---

### unionDeclarationReferenceContext()

```ts
unionDeclarationReferenceContext(union): Context
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `union`   | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionDeclarationReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:296

---

### unionInstantiation()

```ts
unionInstantiation(union, name): EmitterOutput< Record< string, any > >
```

#### Parameters

| Parameter | Type     |
| :-------- | :------- |
| `union`   | `Union`  |
| `name`    | `string` |

#### Returns

`EmitterOutput`< `Record`< `string`, `any` \> \>

#### Inherited from

TypeEmitter.unionInstantiation

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:297

---

### unionInstantiationContext()

```ts
unionInstantiationContext(union, name): Context
```

#### Parameters

| Parameter | Type     |
| :-------- | :------- |
| `union`   | `Union`  |
| `name`    | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionInstantiationContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:298

---

### unionInstantiationReferenceContext()

```ts
unionInstantiationReferenceContext(union, name): Context
```

#### Parameters

| Parameter | Type     |
| :-------- | :------- |
| `union`   | `Union`  |
| `name`    | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionInstantiationReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:299

---

### unionLiteral()

```ts
unionLiteral(union): EmitterOutput< object >
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `union`   | `Union` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.unionLiteral

#### Source

[json-schema/src/json-schema-emitter.ts:230](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L230)

---

### unionLiteralContext()

```ts
unionLiteralContext(union): Context
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `union`   | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionLiteralContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:301

---

### unionLiteralReferenceContext()

```ts
unionLiteralReferenceContext(union): Context
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `union`   | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionLiteralReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:302

---

### unionVariant()

```ts
unionVariant(variant): EmitterOutput< object >
```

#### Parameters

| Parameter | Type           |
| :-------- | :------------- |
| `variant` | `UnionVariant` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.unionVariant

#### Source

[json-schema/src/json-schema-emitter.ts:245](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L245)

---

### unionVariantContext()

```ts
unionVariantContext(union): Context
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `union`   | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionVariantContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:307

---

### unionVariantReferenceContext()

```ts
unionVariantReferenceContext(union): Context
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `union`   | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionVariantReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:308

---

### unionVariants()

```ts
unionVariants(union): EmitterOutput< object >
```

#### Parameters

| Parameter | Type    |
| :-------- | :------ |
| `union`   | `Union` |

#### Returns

`EmitterOutput`< `object` \>

#### Overrides

TypeEmitter.unionVariants

#### Source

[json-schema/src/json-schema-emitter.ts:237](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L237)

---

### unionVariantsContext()

```ts
unionVariantsContext(): Context
```

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionVariantsContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:304

---

### unionVariantsReferenceContext()

```ts
unionVariantsReferenceContext(): Context
```

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionVariantsReferenceContext

#### Source

compiler/dist/src/emitter-framework/type-emitter.d.ts:305

---

### writeOutput()

```ts
writeOutput(sourceFiles): Promise< void >
```

#### Parameters

| Parameter     | Type                                            |
| :------------ | :---------------------------------------------- |
| `sourceFiles` | `SourceFile`< `Record`< `string`, `any` \> \>[] |

#### Returns

`Promise`< `void` \>

#### Overrides

TypeEmitter.writeOutput

#### Source

[json-schema/src/json-schema-emitter.ts:531](https://github.com/markcowl/cadl/blob/3db15286/packages/json-schema/src/json-schema-emitter.ts#L531)
