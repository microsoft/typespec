[JS Api](../index.md) / ProjectionError

# Class: ProjectionError

Represents a failure while interpreting a projection.

## Hierarchy

- `Error`

  ↳ **`ProjectionError`**

## Table of contents

### Constructors

- [constructor](ProjectionError.md#constructor)

### Properties

- [message](ProjectionError.md#message)
- [name](ProjectionError.md#name)
- [stack](ProjectionError.md#stack)
- [prepareStackTrace](ProjectionError.md#preparestacktrace)
- [stackTraceLimit](ProjectionError.md#stacktracelimit)

### Methods

- [captureStackTrace](ProjectionError.md#capturestacktrace)

## Constructors

### constructor

• **new ProjectionError**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |

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
