[JS Api](../index.md) / InvalidEncodingError

# Class: InvalidEncodingError

## Hierarchy

- `Error`

  ↳ **`InvalidEncodingError`**

## Table of contents

### Constructors

- [constructor](InvalidEncodingError.md#constructor)

### Properties

- [message](InvalidEncodingError.md#message)
- [name](InvalidEncodingError.md#name)
- [stack](InvalidEncodingError.md#stack)
- [prepareStackTrace](InvalidEncodingError.md#preparestacktrace)
- [stackTraceLimit](InvalidEncodingError.md#stacktracelimit)

### Methods

- [captureStackTrace](InvalidEncodingError.md#capturestacktrace)

## Constructors

### constructor

• **new InvalidEncodingError**(`encoding`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `encoding` | `string` |

#### Overrides

Error.constructor

## Properties

### message

• **message**: `string`

#### Inherited from

Error.message

___

### name

• **name**: `string`

#### Inherited from

Error.name

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

#### Inherited from

Error.prepareStackTrace

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

## Methods

### captureStackTrace

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace
