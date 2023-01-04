[Documentation](../index.md) / [http](../modules/http.md) / HttpOperation

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

#### Defined in

[http/types.ts:250](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L250)

___

### operation

• **operation**: `Operation`

Operation type reference.

#### Defined in

[http/types.ts:265](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L265)

___

### overloading

• `Optional` **overloading**: [`HttpOperation`](http.HttpOperation.md)

Overload this operation

#### Defined in

[http/types.ts:270](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L270)

___

### overloads

• `Optional` **overloads**: [`HttpOperation`](http.HttpOperation.md)[]

List of operations that overloads this one.

#### Defined in

[http/types.ts:275](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L275)

___

### parameters

• **parameters**: [`HttpOperationParameters`](http.HttpOperationParameters.md)

Parameters.

#### Defined in

[http/types.ts:255](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L255)

___

### path

• **path**: `string`

Route path

#### Defined in

[http/types.ts:235](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L235)

___

### pathSegments

• **pathSegments**: `string`[]

Path segments

#### Defined in

[http/types.ts:240](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L240)

___

### responses

• **responses**: [`HttpOperationResponse`](http.HttpOperationResponse.md)[]

Responses.

#### Defined in

[http/types.ts:260](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L260)

___

### verb

• **verb**: [`HttpVerb`](../modules/http.md#httpverb)

Route verb.

#### Defined in

[http/types.ts:245](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L245)
