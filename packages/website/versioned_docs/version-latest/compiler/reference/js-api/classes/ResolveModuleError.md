[JS Api](../index.md) / ResolveModuleError

# Class: ResolveModuleError

## Hierarchy

- `Error`

  ↳ **`ResolveModuleError`**

## Table of contents

### Constructors

- [constructor](ResolveModuleError.md#constructor)

### Properties

- [code](ResolveModuleError.md#code)
- [message](ResolveModuleError.md#message)
- [name](ResolveModuleError.md#name)
- [stack](ResolveModuleError.md#stack)
- [prepareStackTrace](ResolveModuleError.md#preparestacktrace)
- [stackTraceLimit](ResolveModuleError.md#stacktracelimit)

### Methods

- [captureStackTrace](ResolveModuleError.md#capturestacktrace)

## Constructors

### constructor

• **new ResolveModuleError**(`code`, `message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `code` | `ResolveModuleErrorCode` |
| `message` | `string` |

#### Overrides

Error.constructor

## Properties

### code

• **code**: `ResolveModuleErrorCode`

___

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
