[Documentation](../index.md) / [http](../modules/http.md) / HttpOperationParameters

# Interface: HttpOperationParameters

[http](../modules/http.md).HttpOperationParameters

## Table of contents

### Properties

- [body](http.HttpOperationParameters.md#body)
- [bodyParameter](http.HttpOperationParameters.md#bodyparameter)
- [bodyType](http.HttpOperationParameters.md#bodytype)
- [parameters](http.HttpOperationParameters.md#parameters)
- [verb](http.HttpOperationParameters.md#verb)

## Properties

### body

• `Optional` **body**: [`HttpOperationRequestBody`](http.HttpOperationRequestBody.md)

#### Defined in

[http/types.ts:209](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L209)

___

### bodyParameter

• `Optional` **bodyParameter**: `ModelProperty`

**`Deprecated`**

use

**`See`**

body.property

#### Defined in

[http/types.ts:214](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L214)

___

### bodyType

• `Optional` **bodyType**: `Type`

**`Deprecated`**

use

**`See`**

body.type

#### Defined in

[http/types.ts:212](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L212)

___

### parameters

• **parameters**: [`HttpOperationParameter`](http.HttpOperationParameter.md)[]

#### Defined in

[http/types.ts:207](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L207)

___

### verb

• **verb**: [`HttpVerb`](../modules/http.md#httpverb)

NOTE: The verb is determined when processing parameters as it can
depend on whether there is a request body if not explicitly specified.
Marked internal to keep from polluting the public API with the verb at
two levels.

#### Defined in

[http/types.ts:223](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L223)
