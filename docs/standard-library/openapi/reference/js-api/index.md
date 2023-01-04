Documentation

# Documentation

## Table of contents

### Interfaces

- [ExternalDocs](interfaces/ExternalDocs.md)

### Type Aliases

- [ExtensionKey](index.md#extensionkey)

### Variables

- [namespace](index.md#namespace)

### Functions

- [$defaultResponse](index.md#$defaultresponse)
- [$extension](index.md#$extension)
- [$externalDocs](index.md#$externaldocs)
- [$operationId](index.md#$operationid)
- [checkDuplicateTypeName](index.md#checkduplicatetypename)
- [getExtensions](index.md#getextensions)
- [getExternalDocs](index.md#getexternaldocs)
- [getOpenAPITypeName](index.md#getopenapitypename)
- [getOperationId](index.md#getoperationid)
- [getParameterKey](index.md#getparameterkey)
- [isDefaultResponse](index.md#isdefaultresponse)
- [isReadonlyProperty](index.md#isreadonlyproperty)
- [resolveOperationId](index.md#resolveoperationid)
- [setExtension](index.md#setextension)
- [shouldInline](index.md#shouldinline)

## Type Aliases

### ExtensionKey

Ƭ **ExtensionKey**: \`x-${string}\`

## Variables

### namespace

• `Const` **namespace**: ``"OpenAPI"``

## Functions

### $defaultResponse

▸ **$defaultResponse**(`context`, `entity`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Model` |

#### Returns

`void`

___

### $extension

▸ **$extension**(`context`, `entity`, `extensionName`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Type` |
| `extensionName` | `string` |
| `value` | `CadlValue` |

#### Returns

`void`

___

### $externalDocs

▸ **$externalDocs**(`context`, `target`, `url`, `description?`): `void`

Allows referencing an external resource for extended documentation.

**`Optional`**

description A short description of the target documentation.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `context` | `DecoratorContext` | - |
| `target` | `Type` | - |
| `url` | `string` | The URL for the target documentation. Value MUST be in the format of a URL. |
| `description?` | `string` | - |

#### Returns

`void`

___

### $operationId

▸ **$operationId**(`context`, `entity`, `opId`): `void`

Set a specific operation ID.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `context` | `DecoratorContext` | Decorator Context |
| `entity` | `Operation` | Decorator target |
| `opId` | `string` | Operation ID. |

#### Returns

`void`

___

### checkDuplicateTypeName

▸ **checkDuplicateTypeName**(`program`, `type`, `name`, `existing`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `type` | `Type` |
| `name` | `string` |
| `existing` | `undefined` \| `Record`<`string`, `unknown`\> |

#### Returns

`void`

___

### getExtensions

▸ **getExtensions**(`program`, `entity`): `ReadonlyMap`<[`ExtensionKey`](index.md#extensionkey), `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`ReadonlyMap`<[`ExtensionKey`](index.md#extensionkey), `any`\>

___

### getExternalDocs

▸ **getExternalDocs**(`program`, `entity`): [`ExternalDocs`](interfaces/ExternalDocs.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

[`ExternalDocs`](interfaces/ExternalDocs.md) \| `undefined`

___

### getOpenAPITypeName

▸ **getOpenAPITypeName**(`program`, `type`, `options`, `existing?`): `string`

Gets the name of a type to be used in OpenAPI.

For inlined types: this is the Cadl-native name written to `x-cadl-name`.

For non-inlined types: this is either the friendly name or the Cadl-native name.

Cadl-native names are shortened to exclude root `Cadl` namespace and service
namespace using the provided `TypeNameOptions`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `type` | `Type` |
| `options` | `TypeNameOptions` |
| `existing?` | `Record`<`string`, `any`\> |

#### Returns

`string`

___

### getOperationId

▸ **getOperationId**(`program`, `entity`): `string` \| `undefined`

**`Operation Id`**

decorator or `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Operation` |

#### Returns

`string` \| `undefined`

operationId set via the

___

### getParameterKey

▸ **getParameterKey**(`program`, `property`, `newParam`, `existingParams`, `options`): `string`

Gets the key that is used to define a parameter in OpenAPI.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `property` | `ModelProperty` |
| `newParam` | `unknown` |
| `existingParams` | `Record`<`string`, `unknown`\> |
| `options` | `TypeNameOptions` |

#### Returns

`string`

___

### isDefaultResponse

▸ **isDefaultResponse**(`program`, `entity`): `boolean`

Check if the given model has been mark as a default response.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | Cadl Program |
| `entity` | `Type` | Model to check. |

#### Returns

`boolean`

boolean.

___

### isReadonlyProperty

▸ **isReadonlyProperty**(`program`, `property`): `boolean`

Determines if a property is read-only, which is defined as being
decorated `@visibility("read")`.

If there is more than 1 `@visibility` argument, then the property is not
read-only. For example, `@visibility("read", "update")` does not
designate a read-only property.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `property` | `ModelProperty` |

#### Returns

`boolean`

___

### resolveOperationId

▸ **resolveOperationId**(`program`, `operation`): `string`

Resolve the OpenAPI operation ID for the given operation using the following logic:
- If

**`Operation Id`**

was specified use that value
- If operation is defined at the root or under the service namespace return `<operation.name>`
- Otherwise(operation is under another namespace or interface) return `<namespace/interface.name>_<operation.name>`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | Cadl Program |
| `operation` | `Operation` | Operation |

#### Returns

`string`

Operation ID in this format `<name>` or `<group>_<name>`

___

### setExtension

▸ **setExtension**(`program`, `entity`, `extensionName`, `data`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |
| `extensionName` | \`x-${string}\` |
| `data` | `unknown` |

#### Returns

`void`

___

### shouldInline

▸ **shouldInline**(`program`, `type`): `boolean`

Determines whether a type will be inlined in OpenAPI rather than defined
as a schema and referenced.

All anonymous types (anonymous models, arrays, tuples, etc.) are inlined.

Template instantiations are inlined unless they have a friendly name.

A friendly name can be provided by the user using `@friendlyName`
decorator, or chosen by default in simple cases.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `type` | `Type` |

#### Returns

`boolean`
