[JS Api](../index.md) / HttpOperationRequestBody

# Interface: HttpOperationRequestBody

Represent the body information for an http request.

**`Note`**

the `type` must be a `Model` if the content type is multipart.

## Hierarchy

- [`HttpOperationBody`](HttpOperationBody.md)

  ↳ **`HttpOperationRequestBody`**

## Table of contents

### Properties

- [contentTypes](HttpOperationRequestBody.md#contenttypes)
- [parameter](HttpOperationRequestBody.md#parameter)
- [type](HttpOperationRequestBody.md#type)

## Properties

### contentTypes

• **contentTypes**: `string`[]

Content types.

#### Inherited from

[HttpOperationBody](HttpOperationBody.md).[contentTypes](HttpOperationBody.md#contenttypes)

___

### parameter

• `Optional` **parameter**: `ModelProperty`

If the body was explicitly set as a property. Correspond to the property with `@body`

___

### type

• **type**: `Type`

Type of the operation body.

#### Inherited from

[HttpOperationBody](HttpOperationBody.md).[type](HttpOperationBody.md#type)
