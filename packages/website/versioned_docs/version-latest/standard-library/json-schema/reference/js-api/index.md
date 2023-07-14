JS Api

# JS Api

## Table of contents

### Namespaces

- [$validatesRawJson](modules/validatesRawJson.md)

### Classes

- [JsonSchemaEmitter](classes/JsonSchemaEmitter.md)

### Interfaces

- [ExtensionRecord](interfaces/ExtensionRecord.md)
- [JSONSchemaEmitterOptions](interfaces/JSONSchemaEmitterOptions.md)

### Type Aliases

- [JsonSchemaDeclaration](index.md#jsonschemadeclaration)

### Variables

- [$lib](index.md#$lib)
- [EmitterOptionsSchema](index.md#emitteroptionsschema)
- [namespace](index.md#namespace)

### Functions

- [$baseUri](index.md#$baseuri)
- [$contains](index.md#$contains)
- [$contentEncoding](index.md#$contentencoding)
- [$contentMediaType](index.md#$contentmediatype)
- [$contentSchema](index.md#$contentschema)
- [$extension](index.md#$extension)
- [$id](index.md#$id)
- [$jsonSchema](index.md#$jsonschema)
- [$maxContains](index.md#$maxcontains)
- [$maxProperties](index.md#$maxproperties)
- [$minContains](index.md#$mincontains)
- [$minProperties](index.md#$minproperties)
- [$multipleOf](index.md#$multipleof)
- [$onEmit](index.md#$onemit)
- [$prefixItems](index.md#$prefixitems)
- [$uniqueItems](index.md#$uniqueitems)
- [$validatesRawJson](index.md#$validatesrawjson)
- [findBaseUri](index.md#findbaseuri)
- [getBaseUri](index.md#getbaseuri)
- [getContains](index.md#getcontains)
- [getContentEncoding](index.md#getcontentencoding)
- [getContentMediaType](index.md#getcontentmediatype)
- [getContentSchema](index.md#getcontentschema)
- [getExtensions](index.md#getextensions)
- [getId](index.md#getid)
- [getJsonSchema](index.md#getjsonschema)
- [getJsonSchemaTypes](index.md#getjsonschematypes)
- [getMaxContains](index.md#getmaxcontains)
- [getMaxProperties](index.md#getmaxproperties)
- [getMinContains](index.md#getmincontains)
- [getMinProperties](index.md#getminproperties)
- [getMultipleOf](index.md#getmultipleof)
- [getPrefixItems](index.md#getprefixitems)
- [getUniqueItems](index.md#getuniqueitems)
- [isJsonSchemaDeclaration](index.md#isjsonschemadeclaration)

## Type Aliases

### JsonSchemaDeclaration

Ƭ **JsonSchemaDeclaration**: `Model` \| `Union` \| `Enum` \| `Scalar`

## Variables

### $lib

• `Const` **$lib**: `TypeSpecLibrary`<{ `[code: string]`: `DiagnosticMessages`;  }, [`JSONSchemaEmitterOptions`](interfaces/JSONSchemaEmitterOptions.md)\>

___

### EmitterOptionsSchema

• `Const` **EmitterOptionsSchema**: `JSONSchemaType`<[`JSONSchemaEmitterOptions`](interfaces/JSONSchemaEmitterOptions.md)\>

___

### namespace

• `Const` **namespace**: ``"TypeSpec.JsonSchema"``

## Functions

### $baseUri

▸ **$baseUri**(`context`, `target`, `baseUri`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `Namespace` |
| `baseUri` | `string` |

#### Returns

`void`

___

### $contains

▸ **$contains**(`context`, `target`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `Model` \| `ModelProperty` |
| `value` | `Type` |

#### Returns

`void`

___

### $contentEncoding

▸ **$contentEncoding**(`context`, `target`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `ModelProperty` \| `StringLiteral` |
| `value` | `string` |

#### Returns

`void`

___

### $contentMediaType

▸ **$contentMediaType**(`context`, `target`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `ModelProperty` \| `StringLiteral` |
| `value` | `string` |

#### Returns

`void`

___

### $contentSchema

▸ **$contentSchema**(`context`, `target`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `ModelProperty` \| `StringLiteral` |
| `value` | `Type` |

#### Returns

`void`

___

### $extension

▸ **$extension**(`context`, `target`, `key`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `Type` |
| `key` | `string` |
| `value` | `Type` |

#### Returns

`void`

___

### $id

▸ **$id**(`context`, `target`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `Model` \| `Scalar` \| `Enum` \| `Union` |
| `value` | `string` |

#### Returns

`void`

___

### $jsonSchema

▸ **$jsonSchema**(`context`, `target`, `baseUriOrId?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `Namespace` \| [`JsonSchemaDeclaration`](index.md#jsonschemadeclaration) |
| `baseUriOrId?` | `string` |

#### Returns

`void`

___

### $maxContains

▸ **$maxContains**(`context`, `target`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `Model` \| `ModelProperty` |
| `value` | `number` |

#### Returns

`void`

___

### $maxProperties

▸ **$maxProperties**(`context`, `target`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `Model` \| `ModelProperty` |
| `value` | `number` |

#### Returns

`void`

___

### $minContains

▸ **$minContains**(`context`, `target`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `Model` \| `ModelProperty` |
| `value` | `number` |

#### Returns

`void`

___

### $minProperties

▸ **$minProperties**(`context`, `target`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `Model` \| `ModelProperty` |
| `value` | `number` |

#### Returns

`void`

___

### $multipleOf

▸ **$multipleOf**(`context`, `target`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `Model` |
| `value` | `number` |

#### Returns

`void`

___

### $onEmit

▸ **$onEmit**(`context`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `EmitContext`<[`JSONSchemaEmitterOptions`](interfaces/JSONSchemaEmitterOptions.md)\> |

#### Returns

`Promise`<`void`\>

___

### $prefixItems

▸ **$prefixItems**(`context`, `target`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `Model` \| `ModelProperty` |
| `value` | `Tuple` |

#### Returns

`void`

___

### $uniqueItems

▸ **$uniqueItems**(`context`, `target`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `Model` \| `ModelProperty` |

#### Returns

`void`

___

### $validatesRawJson

▸ **$validatesRawJson**(`context`, `target`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `Model` |
| `value` | `Type` |

#### Returns

`void`

___

### findBaseUri

▸ **findBaseUri**(`program`, `target`): `string` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Namespace` \| [`JsonSchemaDeclaration`](index.md#jsonschemadeclaration) |

#### Returns

`string` \| `undefined`

___

### getBaseUri

▸ **getBaseUri**(`program`, `target`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`any`

___

### getContains

▸ **getContains**(`program`, `target`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`any`

___

### getContentEncoding

▸ **getContentEncoding**(`program`, `target`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`string`

___

### getContentMediaType

▸ **getContentMediaType**(`program`, `target`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`string`

___

### getContentSchema

▸ **getContentSchema**(`program`, `target`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`any`

___

### getExtensions

▸ **getExtensions**(`program`, `target`): [`ExtensionRecord`](interfaces/ExtensionRecord.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

[`ExtensionRecord`](interfaces/ExtensionRecord.md)[]

___

### getId

▸ **getId**(`program`, `target`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`any`

___

### getJsonSchema

▸ **getJsonSchema**(`program`, `target`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`boolean`

___

### getJsonSchemaTypes

▸ **getJsonSchemaTypes**(`program`): (`Namespace` \| `Model`)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |

#### Returns

(`Namespace` \| `Model`)[]

___

### getMaxContains

▸ **getMaxContains**(`program`, `target`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`any`

___

### getMaxProperties

▸ **getMaxProperties**(`program`, `target`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`any`

___

### getMinContains

▸ **getMinContains**(`program`, `target`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`any`

___

### getMinProperties

▸ **getMinProperties**(`program`, `target`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`any`

___

### getMultipleOf

▸ **getMultipleOf**(`program`, `target`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`any`

___

### getPrefixItems

▸ **getPrefixItems**(`program`, `target`): `Tuple` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`Tuple` \| `undefined`

___

### getUniqueItems

▸ **getUniqueItems**(`program`, `target`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Type` |

#### Returns

`any`

___

### isJsonSchemaDeclaration

▸ **isJsonSchemaDeclaration**(`program`, `target`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | [`JsonSchemaDeclaration`](index.md#jsonschemadeclaration) |

#### Returns

`boolean`
