[JS Api](../index.md) / HttpOperation

# Interface: HttpOperation

## Table of contents

### Properties

- [container](HttpOperation.md#container)
- [operation](HttpOperation.md#operation)
- [overloading](HttpOperation.md#overloading)
- [overloads](HttpOperation.md#overloads)
- [parameters](HttpOperation.md#parameters)
- [path](HttpOperation.md#path)
- [pathSegments](HttpOperation.md#pathsegments)
- [responses](HttpOperation.md#responses)
- [verb](HttpOperation.md#verb)

## Properties

### container

• **container**: [`OperationContainer`](../index.md#operationcontainer)

Parent type being the interface, namespace or global namespace.

___

### operation

• **operation**: `Operation`

Operation type reference.

___

### overloading

• `Optional` **overloading**: [`HttpOperation`](HttpOperation.md)

Overload this operation

___

### overloads

• `Optional` **overloads**: [`HttpOperation`](HttpOperation.md)[]

List of operations that overloads this one.

___

### parameters

• **parameters**: [`HttpOperationParameters`](HttpOperationParameters.md)

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

• **responses**: [`HttpOperationResponse`](HttpOperationResponse.md)[]

Responses.

___

### verb

• **verb**: [`HttpVerb`](../index.md#httpverb)

Route verb.
