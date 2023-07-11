[JS Api](../index.md) / decorators

# Namespace: decorators

## Table of contents

### Interfaces

- [Discriminator](../interfaces/decorators.Discriminator.md)
- [DocData](../interfaces/decorators.DocData.md)
- [EncodeData](../interfaces/decorators.EncodeData.md)
- [Service](../interfaces/decorators.Service.md)
- [ServiceDetails](../interfaces/decorators.ServiceDetails.md)

### Type Aliases

- [BytesKnownEncoding](decorators.md#bytesknownencoding)
- [DateTimeKnownEncoding](decorators.md#datetimeknownencoding)
- [DurationKnownEncoding](decorators.md#durationknownencoding)

### Variables

- [namespace](decorators.md#namespace)

### Functions

- [$deprecated](decorators.md#$deprecated)
- [$discriminator](decorators.md#$discriminator)
- [$doc](decorators.md#$doc)
- [$docFromComment](decorators.md#$docfromcomment)
- [$encode](decorators.md#$encode)
- [$error](decorators.md#$error)
- [$format](decorators.md#$format)
- [$friendlyName](decorators.md#$friendlyname)
- [$indexer](decorators.md#$indexer)
- [$inspectType](decorators.md#$inspecttype)
- [$inspectTypeName](decorators.md#$inspecttypename)
- [$key](decorators.md#$key)
- [$knownValues](decorators.md#$knownvalues)
- [$list](decorators.md#$list)
- [$maxItems](decorators.md#$maxitems)
- [$maxLength](decorators.md#$maxlength)
- [$maxValue](decorators.md#$maxvalue)
- [$maxValueExclusive](decorators.md#$maxvalueexclusive)
- [$minItems](decorators.md#$minitems)
- [$minLength](decorators.md#$minlength)
- [$minValue](decorators.md#$minvalue)
- [$minValueExclusive](decorators.md#$minvalueexclusive)
- [$overload](decorators.md#$overload)
- [$pattern](decorators.md#$pattern)
- [$projectedName](decorators.md#$projectedname)
- [$secret](decorators.md#$secret)
- [$service](decorators.md#$service)
- [$summary](decorators.md#$summary)
- [$tag](decorators.md#$tag)
- [$visibility](decorators.md#$visibility)
- [$withDefaultKeyVisibility](decorators.md#$withdefaultkeyvisibility)
- [$withOptionalProperties](decorators.md#$withoptionalproperties)
- [$withUpdateableProperties](decorators.md#$withupdateableproperties)
- [$withVisibility](decorators.md#$withvisibility)
- [$withoutDefaultValues](decorators.md#$withoutdefaultvalues)
- [$withoutOmittedProperties](decorators.md#$withoutomittedproperties)
- [addService](decorators.md#addservice)
- [getAllTags](decorators.md#getalltags)
- [getDeprecated](decorators.md#getdeprecated)
- [getDiscriminatedTypes](decorators.md#getdiscriminatedtypes)
- [getDiscriminator](decorators.md#getdiscriminator)
- [getDoc](decorators.md#getdoc)
- [getDocData](decorators.md#getdocdata)
- [getEncode](decorators.md#getencode)
- [getFormat](decorators.md#getformat)
- [getFriendlyName](decorators.md#getfriendlyname)
- [getIndexer](decorators.md#getindexer)
- [getKeyName](decorators.md#getkeyname)
- [getKnownValues](decorators.md#getknownvalues)
- [getListOperationType](decorators.md#getlistoperationtype)
- [getMaxItems](decorators.md#getmaxitems)
- [getMaxLength](decorators.md#getmaxlength)
- [getMaxValue](decorators.md#getmaxvalue)
- [getMaxValueExclusive](decorators.md#getmaxvalueexclusive)
- [getMinItems](decorators.md#getminitems)
- [getMinLength](decorators.md#getminlength)
- [getMinValue](decorators.md#getminvalue)
- [getMinValueExclusive](decorators.md#getminvalueexclusive)
- [getOverloadedOperation](decorators.md#getoverloadedoperation)
- [getOverloads](decorators.md#getoverloads)
- [getPattern](decorators.md#getpattern)
- [getProjectedName](decorators.md#getprojectedname)
- [getProjectedNames](decorators.md#getprojectednames)
- [getPropertyType](decorators.md#getpropertytype)
- [getService](decorators.md#getservice)
- [getSummary](decorators.md#getsummary)
- [getTags](decorators.md#gettags)
- [getVisibility](decorators.md#getvisibility)
- [hasProjectedName](decorators.md#hasprojectedname)
- [isArrayModelType](decorators.md#isarraymodeltype)
- [isDeprecated](decorators.md#isdeprecated)
- [isErrorModel](decorators.md#iserrormodel)
- [isKey](decorators.md#iskey)
- [isListOperation](decorators.md#islistoperation)
- [isNumericType](decorators.md#isnumerictype)
- [isRecordModelType](decorators.md#isrecordmodeltype)
- [isSecret](decorators.md#issecret)
- [isService](decorators.md#isservice)
- [isStringType](decorators.md#isstringtype)
- [isVisible](decorators.md#isvisible)
- [listServices](decorators.md#listservices)

## Type Aliases

### BytesKnownEncoding

Ƭ **BytesKnownEncoding**: ``"base64"`` \| ``"base64url"``

___

### DateTimeKnownEncoding

Ƭ **DateTimeKnownEncoding**: ``"rfc3339"`` \| ``"rfc7231"`` \| ``"unixTimestamp"``

___

### DurationKnownEncoding

Ƭ **DurationKnownEncoding**: ``"ISO8601"`` \| ``"seconds"``

## Variables

### namespace

• `Const` **namespace**: ``"TypeSpec"``

## Functions

### $deprecated

▸ **$deprecated**(`context`, `target`, `message`): `Map`<[`Type`](../index.md#type), `any`\>

Mark a type as deprecated

**`Example`**

``` @deprecated("Foo is deprecated, use Bar instead.")
    model Foo {}
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) | DecoratorContext |
| `target` | [`Type`](../index.md#type) | Decorator target |
| `message` | `string` | Deprecation target. |

#### Returns

`Map`<[`Type`](../index.md#type), `any`\>

___

### $discriminator

▸ **$discriminator**(`context`, `entity`, `propertyName`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `entity` | [`Model`](../interfaces/Model.md) \| [`Union`](../interfaces/Union.md) |
| `propertyName` | `string` |

#### Returns

`void`

___

### $doc

▸ **$doc**(`context`, `target`, `text`, `sourceObject?`): `void`

**`Doc`**

attaches a documentation string. Works great with multi-line string literals.

The first argument to

**`Doc`**

is a string, which may contain template parameters, enclosed in braces,
which are replaced with an attribute for the type (commonly "name") passed as the second (optional) argument.

**`Doc`**

can be specified on any language element -- a model, an operation, a namespace, etc.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Type`](../index.md#type) |
| `text` | `string` |
| `sourceObject?` | [`Type`](../index.md#type) |

#### Returns

`void`

___

### $docFromComment

▸ **$docFromComment**(`context`, `target`, `text`): `void`

to be used to set the `@doc` from doc comment.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Type`](../index.md#type) |
| `text` | `string` |

#### Returns

`void`

___

### $encode

▸ **$encode**(`context`, `target`, `encoding`, `encodeAs?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |
| `encoding` | `string` \| [`EnumMember`](../interfaces/EnumMember.md) |
| `encodeAs?` | [`Scalar`](../interfaces/Scalar.md) |

#### Returns

`void`

___

### $error

▸ **$error**(`context`, `entity`): `void`

`@error` decorator marks a model as an error type.

`@error` can only be specified on a model.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `entity` | [`Model`](../interfaces/Model.md) |

#### Returns

`void`

___

### $format

▸ **$format**(`context`, `target`, `format`): `void`

`@format` - specify the data format hint for a string type

The first argument is a string that identifies the format that the string type expects.  Any string
can be entered here, but a TypeSpec emitter must know how to interpret

For TypeSpec specs that will be used with an OpenAPI emitter, the OpenAPI specification describes possible
valid values for a string type's format:

https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#dataTypes

`@format` can be specified on a type that extends from `string` or a `string`-typed model property.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |
| `format` | `string` |

#### Returns

`void`

___

### $friendlyName

▸ **$friendlyName**(`context`, `target`, `friendlyName`, `sourceObject`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Type`](../index.md#type) |
| `friendlyName` | `string` |
| `sourceObject` | `undefined` \| [`Type`](../index.md#type) |

#### Returns

`void`

___

### $indexer

▸ **$indexer**(`context`, `target`, `key`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Type`](../index.md#type) |
| `key` | [`Scalar`](../interfaces/Scalar.md) |
| `value` | [`Type`](../index.md#type) |

#### Returns

`void`

___

### $inspectType

▸ **$inspectType**(`program`, `target`, `text`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |
| `text` | `string` |

#### Returns

`void`

___

### $inspectTypeName

▸ **$inspectTypeName**(`program`, `target`, `text`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |
| `text` | `string` |

#### Returns

`void`

___

### $key

▸ **$key**(`context`, `entity`, `altName?`): `void`

`@key` - mark a model property as the key to identify instances of that type

The optional first argument accepts an alternate key name which may be used by emitters.
Otherwise, the name of the target property will be used.

`@key` can only be applied to model properties.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `entity` | [`ModelProperty`](../interfaces/ModelProperty.md) |
| `altName?` | `string` |

#### Returns

`void`

___

### $knownValues

▸ **$knownValues**(`context`, `target`, `knownValues`): `void`

`@knownValues` marks a string type with an enum that contains all known values

The first parameter is a reference to an enum type that describes all possible values that the
type accepts.

`@knownValues` can only be applied to model types that extend `string`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) | - |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) | Decorator target. Must be a string. (model Foo extends string) |
| `knownValues` | [`Enum`](../interfaces/Enum.md) | Must be an enum. |

#### Returns

`void`

___

### $list

▸ **$list**(`context`, `target`, `listedType?`): `void`

**`Deprecated`**

Use the `listsResource` decorator in `@typespec/rest` instead.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Operation`](../interfaces/Operation.md) |
| `listedType?` | [`Type`](../index.md#type) |

#### Returns

`void`

___

### $maxItems

▸ **$maxItems**(`context`, `target`, `maxItems`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Model`](../interfaces/Model.md) \| [`ModelProperty`](../interfaces/ModelProperty.md) |
| `maxItems` | `number` |

#### Returns

`void`

___

### $maxLength

▸ **$maxLength**(`context`, `target`, `maxLength`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |
| `maxLength` | `number` |

#### Returns

`void`

___

### $maxValue

▸ **$maxValue**(`context`, `target`, `maxValue`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |
| `maxValue` | `number` |

#### Returns

`void`

___

### $maxValueExclusive

▸ **$maxValueExclusive**(`context`, `target`, `maxValueExclusive`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |
| `maxValueExclusive` | `number` |

#### Returns

`void`

___

### $minItems

▸ **$minItems**(`context`, `target`, `minItems`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Model`](../interfaces/Model.md) \| [`ModelProperty`](../interfaces/ModelProperty.md) |
| `minItems` | `number` |

#### Returns

`void`

___

### $minLength

▸ **$minLength**(`context`, `target`, `minLength`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |
| `minLength` | `number` |

#### Returns

`void`

___

### $minValue

▸ **$minValue**(`context`, `target`, `minValue`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |
| `minValue` | `number` |

#### Returns

`void`

___

### $minValueExclusive

▸ **$minValueExclusive**(`context`, `target`, `minValueExclusive`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |
| `minValueExclusive` | `number` |

#### Returns

`void`

___

### $overload

▸ **$overload**(`context`, `target`, `overloadBase`): `void`

`@overload` - Indicate that the target overloads (specializes) the overloads type.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) | DecoratorContext |
| `target` | [`Operation`](../interfaces/Operation.md) | The specializing operation declaration |
| `overloadBase` | [`Operation`](../interfaces/Operation.md) | The operation to be overloaded. |

#### Returns

`void`

___

### $pattern

▸ **$pattern**(`context`, `target`, `pattern`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |
| `pattern` | `string` |

#### Returns

`void`

___

### $projectedName

▸ **$projectedName**(`context`, `target`, `projectionName`, `projectedName`): `void`

`@projectedName` - Indicate that this entity should be renamed according to the given projection.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) | DecoratorContext |
| `target` | [`Type`](../index.md#type) | The that should have a different name. |
| `projectionName` | `string` | Name of the projection (e.g. "toJson", "toCSharp") |
| `projectedName` | `string` | Name of the type should have in the scope of the projection specified. |

#### Returns

`void`

___

### $secret

▸ **$secret**(`context`, `target`): `void`

Mark a string as a secret value that should be treated carefully to avoid exposure

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) | Decorator context |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) | Decorator target, either a string model or a property with type string. |

#### Returns

`void`

___

### $service

▸ **$service**(`context`, `target`, `options?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Namespace`](../interfaces/Namespace.md) |
| `options?` | [`Model`](../interfaces/Model.md) |

#### Returns

`void`

___

### $summary

▸ **$summary**(`context`, `target`, `text`, `sourceObject`): `void`

**`Summary`**

attaches a documentation string. It is typically used to give a short, single-line
description, and can be used in combination with or instead of @doc.

The first argument to

**`Summary`**

is a string, which may contain template parameters, enclosed in braces,
which are replaced with an attribute for the type (commonly "name") passed as the second (optional) argument.

**`Summary`**

can be specified on any language element -- a model, an operation, a namespace, etc.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Type`](../index.md#type) |
| `text` | `string` |
| `sourceObject` | [`Type`](../index.md#type) |

#### Returns

`void`

___

### $tag

▸ **$tag**(`context`, `target`, `tag`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Interface`](../interfaces/Interface.md) \| [`Namespace`](../interfaces/Namespace.md) \| [`Operation`](../interfaces/Operation.md) |
| `tag` | `string` |

#### Returns

`void`

___

### $visibility

▸ **$visibility**(`context`, `target`, `...visibilities`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) |
| `...visibilities` | `string`[] |

#### Returns

`void`

___

### $withDefaultKeyVisibility

▸ **$withDefaultKeyVisibility**(`context`, `entity`, `visibility`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `entity` | [`Model`](../interfaces/Model.md) |
| `visibility` | `string` |

#### Returns

`void`

___

### $withOptionalProperties

▸ **$withOptionalProperties**(`context`, `target`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Model`](../interfaces/Model.md) |

#### Returns

`void`

___

### $withUpdateableProperties

▸ **$withUpdateableProperties**(`context`, `target`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`void`

___

### $withVisibility

▸ **$withVisibility**(`context`, `target`, `...visibilities`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Model`](../interfaces/Model.md) |
| `...visibilities` | `string`[] |

#### Returns

`void`

___

### $withoutDefaultValues

▸ **$withoutDefaultValues**(`context`, `target`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Model`](../interfaces/Model.md) |

#### Returns

`void`

___

### $withoutOmittedProperties

▸ **$withoutOmittedProperties**(`context`, `target`, `omitProperties`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Model`](../interfaces/Model.md) |
| `omitProperties` | [`StringLiteral`](../interfaces/StringLiteral.md) \| [`Union`](../interfaces/Union.md) |

#### Returns

`void`

___

### addService

▸ **addService**(`program`, `namespace`, `details?`): `void`

Mark the given namespace as a service.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `namespace` | [`Namespace`](../interfaces/Namespace.md) | Namespace |
| `details` | [`ServiceDetails`](../interfaces/decorators.ServiceDetails.md) | Service details |

#### Returns

`void`

___

### getAllTags

▸ **getAllTags**(`program`, `target`): `string`[] \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Interface`](../interfaces/Interface.md) \| [`Namespace`](../interfaces/Namespace.md) \| [`Operation`](../interfaces/Operation.md) |

#### Returns

`string`[] \| `undefined`

___

### getDeprecated

▸ **getDeprecated**(`program`, `type`): `string` \| `undefined`

Return the deprecated message or undefined if not deprecated

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `type` | [`Type`](../index.md#type) | Type |

#### Returns

`string` \| `undefined`

___

### getDiscriminatedTypes

▸ **getDiscriminatedTypes**(`program`): [[`Model`](../interfaces/Model.md) \| [`Union`](../interfaces/Union.md), [`Discriminator`](../interfaces/decorators.Discriminator.md)][]

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |

#### Returns

[[`Model`](../interfaces/Model.md) \| [`Union`](../interfaces/Union.md), [`Discriminator`](../interfaces/decorators.Discriminator.md)][]

___

### getDiscriminator

▸ **getDiscriminator**(`program`, `entity`): [`Discriminator`](../interfaces/decorators.Discriminator.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `entity` | [`Type`](../index.md#type) |

#### Returns

[`Discriminator`](../interfaces/decorators.Discriminator.md) \| `undefined`

___

### getDoc

▸ **getDoc**(`program`, `target`): `string` \| `undefined`

Get the documentation string for the given type.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `target` | [`Type`](../index.md#type) | Type |

#### Returns

`string` \| `undefined`

Documentation value

___

### getDocData

▸ **getDocData**(`program`, `target`): [`DocData`](../interfaces/decorators.DocData.md) \| `undefined`

Get the documentation information for the given type. In most cases you probably just want to use [getDoc](decorators.md#getdoc)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `target` | [`Type`](../index.md#type) | Type |

#### Returns

[`DocData`](../interfaces/decorators.DocData.md) \| `undefined`

Doc data with source information.

___

### getEncode

▸ **getEncode**(`program`, `target`): [`EncodeData`](../interfaces/decorators.EncodeData.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |

#### Returns

[`EncodeData`](../interfaces/decorators.EncodeData.md) \| `undefined`

___

### getFormat

▸ **getFormat**(`program`, `target`): `string` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`string` \| `undefined`

___

### getFriendlyName

▸ **getFriendlyName**(`program`, `target`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`string`

___

### getIndexer

▸ **getIndexer**(`program`, `target`): [`ModelIndexer`](../index.md#modelindexer) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

[`ModelIndexer`](../index.md#modelindexer) \| `undefined`

___

### getKeyName

▸ **getKeyName**(`program`, `property`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `property` | [`ModelProperty`](../interfaces/ModelProperty.md) |

#### Returns

`string`

___

### getKnownValues

▸ **getKnownValues**(`program`, `target`): [`Enum`](../interfaces/Enum.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |

#### Returns

[`Enum`](../interfaces/Enum.md) \| `undefined`

___

### getListOperationType

▸ **getListOperationType**(`program`, `target`): [`Model`](../interfaces/Model.md) \| `undefined`

**`Deprecated`**

This function is unused and will be removed in a future release.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

[`Model`](../interfaces/Model.md) \| `undefined`

___

### getMaxItems

▸ **getMaxItems**(`program`, `target`): `number` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`number` \| `undefined`

___

### getMaxLength

▸ **getMaxLength**(`program`, `target`): `number` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`number` \| `undefined`

___

### getMaxValue

▸ **getMaxValue**(`program`, `target`): `number` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`number` \| `undefined`

___

### getMaxValueExclusive

▸ **getMaxValueExclusive**(`program`, `target`): `number` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`number` \| `undefined`

___

### getMinItems

▸ **getMinItems**(`program`, `target`): `number` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`number` \| `undefined`

___

### getMinLength

▸ **getMinLength**(`program`, `target`): `number` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`number` \| `undefined`

___

### getMinValue

▸ **getMinValue**(`program`, `target`): `number` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`number` \| `undefined`

___

### getMinValueExclusive

▸ **getMinValueExclusive**(`program`, `target`): `number` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`number` \| `undefined`

___

### getOverloadedOperation

▸ **getOverloadedOperation**(`program`, `operation`): [`Operation`](../interfaces/Operation.md) \| `undefined`

If the given operation overloads another operation, return that operation.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `operation` | [`Operation`](../interfaces/Operation.md) | The operation to check for an overload target. |

#### Returns

[`Operation`](../interfaces/Operation.md) \| `undefined`

The operation this operation overloads, if any.

___

### getOverloads

▸ **getOverloads**(`program`, `operation`): [`Operation`](../interfaces/Operation.md)[] \| `undefined`

Get all operations that are marked as overloads of the given operation

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `operation` | [`Operation`](../interfaces/Operation.md) | Operation |

#### Returns

[`Operation`](../interfaces/Operation.md)[] \| `undefined`

An array of operations that overload the given operation.

___

### getPattern

▸ **getPattern**(`program`, `target`): `string` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`string` \| `undefined`

___

### getProjectedName

▸ **getProjectedName**(`program`, `target`, `projectionName`): `string` \| `undefined`

Get the projected name of the given entity for the given projection.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `target` | [`Type`](../index.md#type) | Target |
| `projectionName` | `string` | - |

#### Returns

`string` \| `undefined`

Projected name for the given projection

___

### getProjectedNames

▸ **getProjectedNames**(`program`, `target`): `ReadonlyMap`<`string`, `string`\> \| `undefined`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `target` | [`Type`](../index.md#type) | Target |

#### Returns

`ReadonlyMap`<`string`, `string`\> \| `undefined`

Map of the projected names for the given entity.

___

### getPropertyType

▸ **getPropertyType**(`target`): [`Type`](../index.md#type)

Return the type of the property or the model itself.

#### Parameters

| Name | Type |
| :------ | :------ |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |

#### Returns

[`Type`](../index.md#type)

___

### getService

▸ **getService**(`program`, `namespace`): [`Service`](../interfaces/decorators.Service.md) \| `undefined`

Get the service information for the given namespace.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `namespace` | [`Namespace`](../interfaces/Namespace.md) | Service namespace |

#### Returns

[`Service`](../interfaces/decorators.Service.md) \| `undefined`

Service information or undefined if namespace is not a service namespace.

___

### getSummary

▸ **getSummary**(`program`, `type`): `string` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `type` | [`Type`](../index.md#type) |

#### Returns

`string` \| `undefined`

___

### getTags

▸ **getTags**(`program`, `target`): `string`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`string`[]

___

### getVisibility

▸ **getVisibility**(`program`, `target`): `string`[] \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`string`[] \| `undefined`

___

### hasProjectedName

▸ **hasProjectedName**(`program`, `target`, `projectionName`): `boolean`

Get the projected name of the given entity for the given projection.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `target` | [`Type`](../index.md#type) | Target |
| `projectionName` | `string` | - |

#### Returns

`boolean`

Projected name for the given projection

___

### isArrayModelType

▸ **isArrayModelType**(`program`, `type`): type is ArrayModelType

Check if a model is an array type.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | - |
| `type` | [`Model`](../interfaces/Model.md) | Model type |

#### Returns

type is ArrayModelType

___

### isDeprecated

▸ **isDeprecated**(`program`, `type`): `boolean`

Check if the given type is deprecated

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `type` | [`Type`](../index.md#type) | Type |

#### Returns

`boolean`

___

### isErrorModel

▸ **isErrorModel**(`program`, `target`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`boolean`

___

### isKey

▸ **isKey**(`program`, `property`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `property` | [`ModelProperty`](../interfaces/ModelProperty.md) |

#### Returns

`boolean`

___

### isListOperation

▸ **isListOperation**(`program`, `target`): `boolean`

**`Deprecated`**

Use `isListOperation` in `@typespec/rest` instead.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Operation`](../interfaces/Operation.md) |

#### Returns

`boolean`

___

### isNumericType

▸ **isNumericType**(`program`, `target`): target is Scalar

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) \| [`ProjectedProgram`](../interfaces/ProjectedProgram.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

target is Scalar

___

### isRecordModelType

▸ **isRecordModelType**(`program`, `type`): type is ArrayModelType

Check if a model is an array type.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | - |
| `type` | [`Model`](../interfaces/Model.md) | Model type |

#### Returns

type is ArrayModelType

___

### isSecret

▸ **isSecret**(`program`, `target`): `boolean` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

`boolean` \| `undefined`

___

### isService

▸ **isService**(`program`, `namespace`): `boolean`

Check if the namespace is defined as a service.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `namespace` | [`Namespace`](../interfaces/Namespace.md) | Namespace |

#### Returns

`boolean`

Boolean

___

### isStringType

▸ **isStringType**(`program`, `target`): target is Scalar

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) \| [`ProjectedProgram`](../interfaces/ProjectedProgram.md) |
| `target` | [`Type`](../index.md#type) |

#### Returns

target is Scalar

___

### isVisible

▸ **isVisible**(`program`, `property`, `visibilities`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `property` | [`ModelProperty`](../interfaces/ModelProperty.md) |
| `visibilities` | readonly `string`[] |

#### Returns

`boolean`

___

### listServices

▸ **listServices**(`program`): [`Service`](../interfaces/decorators.Service.md)[]

List all the services defined in the typespec program

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |

#### Returns

[`Service`](../interfaces/decorators.Service.md)[]

List of service.
