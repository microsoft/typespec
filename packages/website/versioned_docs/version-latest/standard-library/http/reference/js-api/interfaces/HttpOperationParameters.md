[JS Api](../index.md) / HttpOperationParameters

# Interface: HttpOperationParameters

## Table of contents

### Properties

- [body](HttpOperationParameters.md#body)
- [bodyParameter](HttpOperationParameters.md#bodyparameter)
- [bodyType](HttpOperationParameters.md#bodytype)
- [parameters](HttpOperationParameters.md#parameters)
- [verb](HttpOperationParameters.md#verb)

## Properties

### body

• `Optional` **body**: [`HttpOperationRequestBody`](HttpOperationRequestBody.md)

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

• **parameters**: [`HttpOperationParameter`](../index.md#httpoperationparameter)[]

___

### verb

• **verb**: [`HttpVerb`](../index.md#httpverb)

NOTE: The verb is determined when processing parameters as it can
depend on whether there is a request body if not explicitly specified.
Marked internal to keep from polluting the public API with the verb at
two levels.
