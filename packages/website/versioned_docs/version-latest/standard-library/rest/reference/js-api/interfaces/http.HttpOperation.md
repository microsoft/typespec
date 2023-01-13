[JS Api](../index.md) / [http](../modules/http.md) / HttpOperation

# Interface: HttpOperation

[http](../modules/http.md).HttpOperation

## Table of contents

### Properties

- [container](http.HttpOperation.md#container)
- [operation](http.HttpOperation.md#operation)
- [overloading](http.HttpOperation.md#overloading)
- [overloads](http.HttpOperation.md#overloads)
- [parameters](http.HttpOperation.md#parameters)
- [path](http.HttpOperation.md#path)
- [pathSegments](http.HttpOperation.md#pathsegments)
- [responses](http.HttpOperation.md#responses)
- [verb](http.HttpOperation.md#verb)

## Properties

### container

• **container**: [`OperationContainer`](../modules/http.md#operationcontainer)

Parent type being the interface, namespace or global namespace.

___

### operation

• **operation**: `Operation`

Operation type reference.

___

### overloading

• `Optional` **overloading**: [`HttpOperation`](http.HttpOperation.md)

Overload this operation

___

### overloads

• `Optional` **overloads**: [`HttpOperation`](http.HttpOperation.md)[]

List of operations that overloads this one.

___

### parameters

• **parameters**: [`HttpOperationParameters`](http.HttpOperationParameters.md)

Parameters.

___

### path

• **path**: `string`

Route path

___

### pathSegments

• **pathSegments**: `string`[]

Path segments

___

### responses

• **responses**: [`HttpOperationResponse`](http.HttpOperationResponse.md)[]

Responses.

___

### verb

• **verb**: [`HttpVerb`](../modules/http.md#httpverb)

Route verb.
