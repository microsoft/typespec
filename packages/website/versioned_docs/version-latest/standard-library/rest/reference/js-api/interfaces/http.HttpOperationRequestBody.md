[JS Api](../index.md) / [http](../modules/http.md) / HttpOperationRequestBody

# Interface: HttpOperationRequestBody

[http](../modules/http.md).HttpOperationRequestBody

Represent the body information for an http request.

**`Note`**

the `type` must be a `Model` if the content type is multipart.

## Hierarchy

- [`HttpOperationBody`](http.HttpOperationBody.md)

  ↳ **`HttpOperationRequestBody`**

## Table of contents

### Properties

- [contentTypes](http.HttpOperationRequestBody.md#contenttypes)
- [parameter](http.HttpOperationRequestBody.md#parameter)
- [type](http.HttpOperationRequestBody.md#type)

## Properties

### contentTypes

• **contentTypes**: `string`[]

Content types.

#### Inherited from

[HttpOperationBody](http.HttpOperationBody.md).[contentTypes](http.HttpOperationBody.md#contenttypes)

___

### parameter

• `Optional` **parameter**: `ModelProperty`

If the body was explicitly set as a property. Correspond to the property with `@body`

___

### type

• **type**: `Type`

Type of the operation body.

#### Inherited from

[HttpOperationBody](http.HttpOperationBody.md).[type](http.HttpOperationBody.md#type)
