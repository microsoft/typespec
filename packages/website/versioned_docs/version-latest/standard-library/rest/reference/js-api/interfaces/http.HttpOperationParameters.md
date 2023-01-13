[JS Api](../index.md) / [http](../modules/http.md) / HttpOperationParameters

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

___

### bodyParameter

• `Optional` **bodyParameter**: `ModelProperty`

**`Deprecated`**

use

**`See`**

body.property

___

### bodyType

• `Optional` **bodyType**: `Type`

**`Deprecated`**

use

**`See`**

body.type

___

### parameters

• **parameters**: [`HttpOperationParameter`](../modules/http.md#httpoperationparameter)[]

___

### verb

• **verb**: [`HttpVerb`](../modules/http.md#httpverb)

NOTE: The verb is determined when processing parameters as it can
depend on whether there is a request body if not explicitly specified.
Marked internal to keep from polluting the public API with the verb at
two levels.
